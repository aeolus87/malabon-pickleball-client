import React, { useEffect, useState, useCallback, memo } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "../../stores/AuthStore";
import { userStore } from "../../stores/UserStore";
import { venueStore, Venue } from "../../stores/VenueStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { runInAction } from "mobx";
import OptimizedImage from "../../components/OptimizedImage";

// Define interface for VenueCard props
interface VenueCardProps {
  venue: Venue;
  onAttendClick: (venueId: string) => void;
  onCancelClick: (venueId: string) => void;
  isUserAttending: boolean;
  hasReachedCancellationLimit: boolean;
}

// Memoized Venue Card component to prevent unnecessary re-renders
const VenueCard = memo(
  ({
    venue,
    onAttendClick,
    onCancelClick,
    isUserAttending,
    hasReachedCancellationLimit,
  }: VenueCardProps) => {
    const isFull = venue.attendees.length >= 20;

    return (
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden dark:border dark:border-dark-border">
        <div className="relative h-48 w-full">
          <OptimizedImage
            src={venue.photoURL || ""}
            alt={venue.name}
            className="w-full h-full"
            fallbackText={venue.name}
          />
          <div className="absolute top-2 right-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                venue.status === "Available"
                  ? "bg-brand-500 text-white dark:bg-brand-600"
                  : "bg-gray-400 text-white dark:bg-gray-600"
              }`}
            >
              {venue.status}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {venue.name}
          </h2>

          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-300">
              <span
                className={`${
                  isFull
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                } font-medium`}
              >
                {venue.attendees.length}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {" "}
                / 20 attendees
              </span>
              {isFull && !isUserAttending && (
                <span className="ml-2 text-red-600 dark:text-red-400 text-sm">
                  (Full)
                </span>
              )}
            </p>
          </div>

          {hasReachedCancellationLimit && !isUserAttending && (
            <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm rounded">
              You've cancelled twice for this venue. You can no longer sign up.
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {isUserAttending ? (
              <button
                onClick={() => onCancelClick(venue.id)}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Cancel Attendance
              </button>
            ) : (
              <button
                onClick={() => onAttendClick(venue.id)}
                disabled={
                  venue.status !== "Available" ||
                  isFull ||
                  hasReachedCancellationLimit
                }
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  venue.status !== "Available" ||
                  isFull ||
                  hasReachedCancellationLimit
                    ? "bg-gray-200 dark:bg-dark-muted text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-brand-600 dark:bg-brand-700 text-white hover:bg-brand-700 dark:hover:bg-brand-600"
                }`}
              >
                {venue.status !== "Available"
                  ? "Unavailable"
                  : isFull
                  ? "Full"
                  : hasReachedCancellationLimit
                  ? "Cancelled Twice"
                  : "Attend"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const VenuesPage: React.FC = observer(() => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  // Explicitly read observables in the render function
  // This ensures MobX tracks these values properly

  const venues = venueStore.venues;
  const venuesLoading = venueStore.loading;
  const venuesError = venueStore.error;

  useEffect(() => {
    const initializePage = async () => {
      try {
        console.log("Initializing venues page...");
        
        // Since we're wrapped in ProtectedRoute, auth is already verified
        // Just fetch venues directly
        await venueStore.fetchVenues();
      } catch (error) {
        console.error("Failed to initialize venues page:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const handleAttendClick = useCallback((venueId: string) => {
    setSelectedVenue(venueId);
    setShowModal(true);
  }, []);

  const handleCancelClick = useCallback((venueId: string) => {
    setSelectedVenue(venueId);
    setShowCancelModal(true);
  }, []);

  const handleCancelAttendance = async (venueId: string) => {
    try {
      console.log("Cancelling attendance for venue:", venueId);
      const success = await venueStore.cancelAttendance(venueId);

      if (success) {
        console.log(
          "Successfully cancelled attendance, checking userIsAttending:",
          venueStore.isUserAttending(venueId)
        );

        // Show temporary message
        setIsError(false);
        setConfirmationMessage(
          "You have successfully canceled your attendance."
        );
        setShowConfirmation(true);

        setTimeout(() => {
          setShowConfirmation(false);
        }, 2000);
      } else {
        setIsError(true);
        setConfirmationMessage(
          venueStore.error || "Failed to cancel attendance."
        );
        setShowConfirmation(true);

        setTimeout(() => {
          setShowConfirmation(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error cancelling attendance:", error);
      setIsError(true);
      setConfirmationMessage("An error occurred. Please try again.");
      setShowConfirmation(true);

      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!selectedVenue) return;

    try {
      console.log("Confirming attendance for venue:", selectedVenue);
      const success = await venueStore.attendVenue(selectedVenue);

      if (success) {
        console.log(
          "Successfully attended venue, checking userIsAttending:",
          venueStore.isUserAttending(selectedVenue)
        );

        setShowModal(false);
        setIsError(false);
        setConfirmationMessage(
          "You're all set! You've successfully signed up for this venue."
        );
        setShowConfirmation(true);

        // Close confirmation after 2 seconds
        setTimeout(() => {
          setShowConfirmation(false);
        }, 2000);
      } else {
        // Handle error
        console.error("Failed to attend venue");
        setShowModal(false);
        setIsError(true);
        setConfirmationMessage(venueStore.error || "Failed to attend venue.");
        setShowConfirmation(true);

        setTimeout(() => {
          setShowConfirmation(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error confirming attendance:", error);
      setShowModal(false);
      setIsError(true);
      setConfirmationMessage("An error occurred. Please try again.");
      setShowConfirmation(true);

      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowCancelModal(false);
    setSelectedVenue(null);
  };

  if (loading || venuesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 dark:border-brand-400"></div>
      </div>
    );
  }

  if (venuesError) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg">
        <div className="text-red-500 dark:text-red-400">{venuesError}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-dark-bg transition-colors duration-300">
      <div className="flex justify-center items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Available Venues
        </h1>
      </div>

      {venues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No venues available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => {
            const userIsAttending = venueStore.isUserAttending(venue.id);
            const reachedCancellationLimit =
              venueStore.hasReachedCancellationLimit(venue.id);

            return (
              <VenueCard
                key={venue.id}
                venue={venue}
                onAttendClick={handleAttendClick}
                onCancelClick={handleCancelClick}
                isUserAttending={userIsAttending}
                hasReachedCancellationLimit={reachedCancellationLimit}
              />
            );
          })}
        </div>
      )}

      {/* Attendance Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md mx-4 shadow-xl dark:border dark:border-dark-border">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Attendance
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to attend this venue?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-dark-muted font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAttendance}
                className="px-4 py-2 bg-brand-600 dark:bg-brand-700 text-white rounded-md hover:bg-brand-700 dark:hover:bg-brand-600 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md mx-4 shadow-xl dark:border dark:border-dark-border">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Cancel Attendance
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to cancel your attendance for this venue?
              You may only cancel your attendance up to 2 times per venue.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-dark-muted font-medium"
              >
                Keep Attendance
              </button>
              <button
                onClick={() => {
                  if (selectedVenue) {
                    handleCancelAttendance(selectedVenue);
                    setShowCancelModal(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 font-medium"
              >
                Cancel Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notification */}
      {showConfirmation && (
        <div
          className={`fixed bottom-4 right-4 ${
            isError
              ? "bg-red-600 dark:bg-red-700"
              : "bg-brand-600 dark:bg-brand-700"
          } text-white px-4 py-3 rounded-md shadow-md z-50 max-w-xs`}
        >
          <p className="font-medium">{isError ? "Error" : "Success!"}</p>
          <p className="text-sm">{confirmationMessage}</p>
        </div>
      )}
    </div>
  );
});

export default VenuesPage;
