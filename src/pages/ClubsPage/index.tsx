import React, { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { clubStore } from "../../stores/ClubStore";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import debounce from "lodash.debounce";
import { Link } from "react-router-dom";

const ClubsPage: React.FC = observer(() => {
  const location = useLocation();

  // Check if we should show all clubs tab by default (from URL param)
  const showAllClubs = location.search.includes("tab=all");

  const [activeTab, setActiveTab] = useState<"my-clubs" | "all-clubs">(
    showAllClubs ? "all-clubs" : "my-clubs"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Access userClubs to establish reactive dependency for the membership map
  const userClubs = clubStore.userClubs;

  // Fetch clubs data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      // First fetch all clubs with member counts
      await clubStore.fetchClubsWithMemberCount();

      // Then fetch user clubs (which now also gets counts)
      await clubStore.fetchUserClubs();
    };
    fetchData();

    // Set up a refresh when tabs are changed
    return () => {
      // Clean up if needed
    };
  }, []);

  // Add a tab change handler to refresh data when switching tabs
  const handleTabChange = async (tab: "my-clubs" | "all-clubs") => {
    setActiveTab(tab);

    // Refresh the appropriate data when tab changes
    if (tab === "my-clubs") {
      await clubStore.fetchUserClubs();
    } else {
      await clubStore.fetchClubsWithMemberCount();
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    clubStore.setSearchQuery(e.target.value);
    setIsSearching(true);

    // Use debounce to reduce search frequency
    debouncedSearch();
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      setIsSearching(false);
    }, 300),
    []
  );

  // Get the clubs to display based on current filters
  const displayedClubs =
    activeTab === "my-clubs"
      ? clubStore.getFilteredClubs(true)
      : clubStore.getFilteredClubs(false);

  // Create a map of club membership status once in the reactive render context
  // This avoids checking membership in click handlers
  const membershipMap = new Map<string, boolean>();

  // Fill the map with current membership status for all clubs
  // Create arrays of club IDs to avoid accessing observables in the loop
  const displayedClubIds = displayedClubs.map((club) => club._id);
  const userClubIds = userClubs.map((club) => club._id);

  // Create a Set for faster lookup
  const userClubIdSet = new Set(userClubIds);

  // Fill the map with current membership status
  displayedClubIds.forEach((clubId) => {
    membershipMap.set(clubId, userClubIdSet.has(clubId));
  });

  // Updated join and leave club handlers that capture the club ID within the click handler closure
  const handleJoinClub = async (clubId: string) => {
    // Get the membership status from our pre-computed map which is calculated in a reactive context
    const userInClub = membershipMap.get(clubId) || false;
    if (userInClub) {
      // User is already in the club
      return;
    }

    await clubStore.joinClub(clubId);

    // Refresh all data after joining
    await clubStore.fetchClubsWithMemberCount();
    await clubStore.fetchUserClubs();
  };

  const handleLeaveClub = async (clubId: string) => {
    // Get the membership status from our pre-computed map which is calculated in a reactive context
    const userInClub = membershipMap.get(clubId) || false;
    if (!userInClub) {
      // User is not in the club
      return;
    }

    await clubStore.leaveClub(clubId);

    // Refresh all data after leaving
    await clubStore.fetchClubsWithMemberCount();
    await clubStore.fetchUserClubs();
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg min-h-screen py-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden mb-8 dark:border dark:border-dark-border">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Pickle Clubs
              </h1>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search clubs..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-md leading-5 bg-white dark:bg-dark-muted placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-brand-600 dark:focus:border-brand-600 dark:text-gray-200 sm:text-sm"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex space-x-8">
                <button
                  className={`py-4 px-1 font-medium text-sm relative ${
                    activeTab === "my-clubs"
                      ? "text-brand-700 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => handleTabChange("my-clubs")}
                >
                  My Clubs
                  {activeTab === "my-clubs" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 dark:bg-brand-600"></span>
                  )}
                </button>
                <button
                  className={`py-4 px-1 font-medium text-sm relative ${
                    activeTab === "all-clubs"
                      ? "text-brand-700 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => handleTabChange("all-clubs")}
                >
                  All Clubs
                  {activeTab === "all-clubs" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 dark:bg-brand-600"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content based on the active tab */}
          <div className="p-6">
            {clubStore.loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-brand-500 dark:border-brand-400 rounded-full border-t-transparent"></div>
              </div>
            ) : isSearching ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin h-5 w-5 border-2 border-brand-500 dark:border-brand-400 rounded-full border-t-transparent"></div>
              </div>
            ) : displayedClubs.length === 0 ? (
              <div className="text-center py-12">
                {activeTab === "my-clubs" ? (
                  <>
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
                      No clubs joined yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Join clubs to see them here.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab("all-clubs")}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-brand-600 dark:focus:ring-offset-dark-bg"
                      >
                        Find Clubs to Join
                      </button>
                    </div>
                  </>
                ) : searchTerm ? (
                  <>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      No clubs match your search
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Try a different search term
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      No clubs available
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Check back soon for new clubs
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedClubs.map((club) => {
                  // Use the pre-computed membership status from our map
                  const isUserInClub = membershipMap.get(club._id) || false;
                  // Store the club ID in a non-reactive variable to prevent MobX access in event handlers
                  const clubId = club._id;

                  return (
                    <div
                      key={clubId}
                      className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-200 dark:border-dark-border"
                    >
                      <div className="flex p-4 items-center border-b border-gray-100 dark:border-dark-border">
                        {club.logo ? (
                          <img
                            src={club.logo}
                            alt={club.name}
                            className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-gray-200 dark:border-dark-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-4 text-brand-600 dark:text-brand-400 font-bold text-xl">
                            {club.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {club.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {club.memberCount || 0} Members
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex-grow">
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {club.description || "No description available"}
                        </p>
                      </div>

                      <div className="p-4 border-t border-gray-100 dark:border-dark-border flex justify-between items-center">
                        {isUserInClub ? (
                          <button
                            onClick={() => handleLeaveClub(clubId)}
                            className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-muted hover:bg-gray-50 dark:hover:bg-dark-muted/80 transition-colors text-sm font-medium"
                          >
                            Leave
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinClub(clubId)}
                            className="px-4 py-2 border border-transparent rounded-md bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 transition-colors text-sm font-medium"
                          >
                            Join
                          </button>
                        )}

                        <Link
                          to={`/clubs/${clubId}`}
                          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ClubsPage;
