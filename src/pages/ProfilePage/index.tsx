import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { authStore } from "../../stores/AuthStore";
import { clubStore } from "../../stores/ClubStore";
import { userStore } from "../../stores/UserStore";
import { Link } from "react-router-dom";
import EditProfile from "../../components/EditProfile";
import Avatar from "../../components/Avatar";

const ProfilePage: React.FC = observer(() => {
  const [activeTab, setActiveTab] = useState<"profile" | "clubs">("profile");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const loadProfileData = async () => {
    // Use runInAction to read observables safely
    const isAuth = runInAction(() => authStore.isAuthenticated);

    if (isAuth) {
      // Load user profile data first
      await userStore.loadProfile();

      // Then load clubs
      await Promise.all([clubStore.fetchUserClubs(), clubStore.fetchClubs()]);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleEditProfileClose = () => {
    setIsEditProfileOpen(false);
  };

  // Show loading state if user profile is not loaded yet
  if (userStore.loading || !userStore.profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // Get user data from userStore
  const { displayName, email, photoURL, coverPhoto, bio } = userStore.profile;

  return (
    <div className="bg-gray-50 dark:bg-dark-bg min-h-screen transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Header Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-md overflow-hidden mb-8 transition-colors duration-200">
          <div className="relative h-32 md:h-48">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 h-full w-full"></div>
            )}
          </div>
          <div className="px-4 py-4 sm:px-6 -mt-16 sm:-mt-24 flex flex-col sm:flex-row items-start sm:items-end space-y-3 sm:space-y-0 sm:space-x-5">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-white dark:ring-gray-800 rounded-full overflow-hidden">
                  <Avatar
                    src={photoURL}
                    name={displayName || email.split("@")[0]}
                    size="xl"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center w-full">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {displayName || email.split("@")[0]}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-8">
                <button
                  className={`py-4 px-1 font-medium text-sm relative ${
                    activeTab === "profile"
                      ? "text-gray-800 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("profile")}
                >
                  About
                  {activeTab === "profile" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gray-800 dark:bg-green-600"></span>
                  )}
                </button>
                <button
                  className={`py-4 px-1 font-medium text-sm relative ${
                    activeTab === "clubs"
                      ? "text-gray-800 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("clubs")}
                >
                  Clubs
                  {activeTab === "clubs" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gray-800 dark:bg-green-600"></span>
                  )}
                </button>
              </div>

              {/* Edit Profile Button now in the tabs row */}
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white border border-green-600 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                aria-label="Edit Profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="text-sm">Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "profile" ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-md overflow-hidden transition-colors duration-200">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                About
              </h2>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-5 sm:px-6">
              <div className="prose max-w-none dark:prose-invert">
                {bio ? (
                  <p className="text-gray-700 dark:text-gray-300">{bio}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No bio yet
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-md overflow-hidden transition-colors duration-200">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Your Clubs
              </h2>
              <Link
                to="/clubs?tab=all"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900/50 dark:hover:bg-green-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                Manage Clubs
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700">
              {clubStore.loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 dark:border-blue-400 rounded-full border-t-transparent"></div>
                </div>
              ) : clubStore.userClubs.length === 0 ? (
                <div className="px-4 py-8 sm:px-6 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                    No clubs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You haven't joined any clubs yet.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/clubs?tab=all"
                      className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                    >
                      Select Clubs
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubStore.userClubs.map((club) => (
                      <div
                        key={club._id}
                        className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex p-4 items-center border-b border-gray-100 dark:border-gray-800">
                          {club.logo ? (
                            <img
                              src={club.logo}
                              alt={club.name}
                              className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4 text-green-600 dark:text-green-400 font-bold text-xl">
                              {club.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {club.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {club.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 flex-grow">
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {club.description || "No description available"}
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {club.memberCount || "?"} Members
                            </span>
                          </div>
                          <Link
                            to={`/clubs/${club._id}`}
                            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-200"
                          >
                            View Club
                            <svg
                              className="ml-1 w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfile open={isEditProfileOpen} onClose={handleEditProfileClose} />
    </div>
  );
});

export default ProfilePage;
