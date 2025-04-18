import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../stores/AuthStore";
import { clubStore } from "../../stores/ClubStore";

const ProfileComplete = observer(() => {
  const navigate = useNavigate();
  const [skipSelection, setSkipSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Access MobX observables directly in the render function
  const allClubs = clubStore.clubs;
  const selectedClubs = clubStore.selectedClubs;
  const clubsLoading = clubStore.loading;

  useEffect(() => {
    // Load clubs when component mounts
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch all available clubs
        await clubStore.fetchClubs();
        // Fetch user's existing clubs if any
        await clubStore.fetchUserClubs();

        // If user already has clubs, preselect them
        if (clubStore.userClubs.length > 0) {
          const userClubIds = clubStore.userClubs.map((club) => club._id);
          clubStore.setSelectedClubs(userClubIds);
        }
      } catch (err) {
        console.error("Error loading clubs:", err);
        setError("Failed to load club data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Handle club selection (or skipping) first
      if (!skipSelection && selectedClubs.length > 0) {
        const clubResult = await clubStore.submitSelectedClubs();
        if (!clubResult) {
          throw new Error("Failed to save club selections");
        }
      }

      // Now mark the profile as complete
      const profileResult = await authStore.updateUserProfile({
        isProfileComplete: true,
      });
      if (!profileResult) {
        throw new Error("Failed to update profile");
      }

      // Navigate to venues page
      navigate("/venues");
    } catch (err: any) {
      console.error("Profile completion error:", err);
      setError(err.message || "Failed to complete profile setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClubClick = (clubId: string) => {
    if (skipSelection) {
      // If skip was checked, uncheck it when user selects a club
      setSkipSelection(false);
    }
    clubStore.toggleClubSelection(clubId);
  };

  const handleSkipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSkipSelection(checked);

    // Clear selected clubs if skipping
    if (checked && selectedClubs.length > 0) {
      clubStore.clearSelectedClubs();
    }
  };

  // Button should be enabled if skip is chosen or clubs are selected
  const isButtonEnabled = skipSelection || selectedClubs.length > 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 dark:border-brand-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your profile information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-white dark:bg-dark-card rounded-lg shadow-md p-6 dark:border dark:border-dark-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Welcome to Malabon
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your profile setup by selecting your favorite clubs
            </p>
          </div>

          {/* Club Selection Section */}
          <div className="mb-8 p-6 border border-gray-200 dark:border-dark-border rounded-lg dark:bg-dark-card/50">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Select your favorite clubs (optional)
            </h2>

            <div className="mb-6">
              <label className="flex items-center cursor-pointer mb-4">
                <input
                  type="checkbox"
                  id="skip-selection"
                  checked={skipSelection}
                  onChange={handleSkipChange}
                  className="h-5 w-5 text-brand-600 rounded focus:ring-brand-500 mr-2 dark:bg-dark-muted dark:border-dark-border"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  I don't want to select clubs right now
                </span>
              </label>
            </div>

            {clubsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 dark:border-brand-400"></div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  skipSelection ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {allClubs.map((club) => (
                  <div
                    key={club._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedClubs.includes(club._id)
                        ? "border-brand-500 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20"
                        : "border-gray-200 hover:border-brand-300 dark:border-dark-border dark:hover:border-brand-700"
                    }`}
                    onClick={() => handleClubClick(club._id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`club-${club._id}`}
                        checked={selectedClubs.includes(club._id)}
                        onChange={() => {}} // Controlled component
                        disabled={skipSelection}
                        className="mr-3 h-5 w-5 text-brand-600 rounded focus:ring-brand-500 dark:bg-dark-muted dark:border-dark-border"
                      />
                      <div>
                        <label
                          htmlFor={`club-${club._id}`}
                          className="block text-lg font-medium text-gray-800 dark:text-gray-200"
                        >
                          {club.name}
                        </label>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {club.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={!isButtonEnabled || isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium ${
                !isButtonEnabled || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : "bg-brand-600 text-white hover:bg-brand-700 transition-colors dark:bg-brand-700 dark:hover:bg-brand-600"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Continue to Venues"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileComplete;
