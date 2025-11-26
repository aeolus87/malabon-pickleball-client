import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, Link, useNavigate } from "react-router-dom";
import { clubStore } from "../../stores/ClubStore";
import { authStore } from "../../stores/AuthStore";
import { ArrowLeft, Users } from "lucide-react";
import Avatar from "../../components/Avatar";

const ClubDetailPage: React.FC = observer(() => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Check if the user is authenticated
  const isAuthenticated = authStore.isAuthenticated;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      if (!clubId) return;

      // Load both datasets in parallel to prevent flickering
      await Promise.all([
        clubStore.fetchClubWithMembers(clubId),
        clubStore.fetchUserClubs()
      ]);
    };

    loadData();
  }, [clubId, isAuthenticated, navigate]);

  // Check if the user is a member of this club
  const isMember = clubStore.userClubs.some((club) => club._id === clubId);

  const handleJoinClub = async () => {
    if (!clubId) return;

    setIsJoining(true);
    try {
      await clubStore.joinClub(clubId);

      // Refresh both datasets in parallel to prevent flickering
      await Promise.all([
        clubStore.fetchClubWithMembers(clubId),
        clubStore.fetchUserClubs()
      ]);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!clubId) return;

    setIsLeaving(true);
    try {
      await clubStore.leaveClub(clubId);

      // Refresh both datasets in parallel to prevent flickering
      await Promise.all([
        clubStore.fetchClubWithMembers(clubId),
        clubStore.fetchUserClubs()
      ]);
    } finally {
      setIsLeaving(false);
    }
  };

  if (clubStore.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 dark:border-brand-400"></div>
      </div>
    );
  }

  if (!clubStore.currentClub) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-dark-card shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Club Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The club you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/clubs"
              className="inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/clubs"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clubs
          </Link>
        </div>

        {/* Club Header */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden mb-8 dark:border dark:border-dark-border">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Club Logo */}
              {clubStore.currentClub.logo ? (
                <img
                  src={clubStore.currentClub.logo}
                  alt={clubStore.currentClub.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-2xl">
                  {clubStore.currentClub.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Club Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {clubStore.currentClub.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {clubStore.currentClub.description}
                </p>

                {/* Member Count */}
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{clubStore.clubMembers.length} Members</span>
                </div>
              </div>

              {/* Join/Leave Button */}
              <div className="mt-4 md:mt-0">
                {isMember ? (
                  <button
                    onClick={handleLeaveClub}
                    disabled={isLeaving}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    {isLeaving ? "Leaving..." : "Leave Club"}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinClub}
                    disabled={isJoining}
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-medium shadow-sm transition-colors dark:bg-brand-700 dark:hover:bg-brand-600"
                  >
                    {isJoining ? "Joining..." : "Join Club"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden dark:border dark:border-dark-border">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Members
            </h2>
          </div>

          {clubStore.clubMembersLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin h-8 w-8 border-2 border-brand-500 dark:border-brand-400 rounded-full border-t-transparent"></div>
            </div>
          ) : clubStore.clubMembers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                This club currently has no members.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {clubStore.clubMembers.map((member) => (
                <Link
                  key={member._id}
                  to={`/profile/${member._id}`}
                  className="p-4 sm:px-6 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-shrink-0 mr-4">
                    <Avatar
                      src={member.photoURL}
                      name={member.displayName}
                      alt={member.displayName || "Member"}
                      size="md"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 hover:underline">
                      {member.displayName || "Anonymous Member"}
                    </h3>
                    {member.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ClubDetailPage;
