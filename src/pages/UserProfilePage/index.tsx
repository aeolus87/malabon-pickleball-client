import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, Link } from "react-router-dom";
import { userStore } from "../../stores/UserStore";
import { authStore } from "../../stores/AuthStore";
import Avatar from "../../components/Avatar";
import CoachBadge from "../../components/CoachBadge";

/**
 * UserProfilePage - View any user's public profile
 */
const UserProfilePage: React.FC = observer(() => {
  const { userId } = useParams<{ userId: string }>();
  const { publicProfile, publicProfileLoading } = userStore;
  const isOwnProfile = authStore.user?.id === userId;

  useEffect(() => {
    if (userId) {
      userStore.getPublicProfile(userId);
    }

    return () => {
      userStore.clearPublicProfile();
    };
  }, [userId]);

  // Redirect to edit profile if viewing own profile
  if (isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This is your profile.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (publicProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!publicProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Profile Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This user doesn't exist or their profile is private.
            </p>
            <Link
              to="/venues"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Cover photo */}
          <div className="h-32 bg-gradient-to-r from-green-400 to-green-600 relative">
            {publicProfile.coverPhoto && (
              <img
                src={publicProfile.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile info */}
          <div className="px-6 pb-6">
            {/* Avatar - positioned to overlap cover */}
            <div className="relative -mt-12 mb-4">
              <Avatar
                src={publicProfile.photoURL}
                name={publicProfile.displayName}
                size="xl"
                className="ring-4 ring-white dark:ring-gray-800"
              />
            </div>

            {/* Name and role */}
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {publicProfile.displayName || "Anonymous User"}
              </h1>
              {publicProfile.role === "coach" && (
                <CoachBadge
                  role="coach"
                  size="md"
                  isAvailable={publicProfile.coachProfile?.isAvailable}
                  showAvailability
                />
              )}
            </div>

            {/* Role badge for non-coaches */}
            {publicProfile.role !== "coach" && publicProfile.role !== "player" && (
              <div className="mb-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                  {publicProfile.role}
                </span>
              </div>
            )}

            {/* Bio */}
            {publicProfile.bio && (
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                {publicProfile.bio}
              </p>
            )}

            {/* Coach-specific info */}
            {publicProfile.role === "coach" && publicProfile.coachProfile && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
                <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Coach Information
                </h3>

                {publicProfile.coachProfile.specialization && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Specialization:</span>
                    <p className="text-gray-800 dark:text-gray-200">
                      {publicProfile.coachProfile.specialization}
                    </p>
                  </div>
                )}

                {publicProfile.coachProfile.bio && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">About:</span>
                    <p className="text-gray-800 dark:text-gray-200">
                      {publicProfile.coachProfile.bio}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`
                      w-2 h-2 rounded-full
                      ${publicProfile.coachProfile.isAvailable ? "bg-green-500" : "bg-gray-400"}
                    `}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {publicProfile.coachProfile.isAvailable
                      ? "Currently available for sessions"
                      : "Not available at the moment"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/venues"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
          >
            ← Back to Venues
          </Link>
        </div>
      </div>
    </div>
  );
});

export default UserProfilePage;










