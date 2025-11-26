import React, { useEffect, useState, useCallback, memo } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { venueStore, Venue } from "../../stores/VenueStore";
import { sessionStore } from "../../stores/SessionStore";
import OptimizedImage from "../../components/OptimizedImage";
import VenueMap from "../../components/VenueMap";
import Avatar from "../../components/Avatar";
import SessionCard from "../../components/SessionCard";
// Temporary feature flag: hide map until ready
const SHOW_MAP = false;

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
    const [showMap, setShowMap] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const venueSessions = sessionStore.getSessionsByVenueId(venue.id).filter(s => s.status !== 'cancelled');

    return (
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden dark:border dark:border-dark-border flex flex-col h-full">
        {/* Image Section - Fixed Height */}
        <div className="relative h-48 w-full flex-shrink-0">
          <OptimizedImage
            src={venue.photoURL || ""}
            alt={venue.name}
            className="w-full h-full object-cover"
            fallbackText={venue.name}
          />
          {/* Status Badge - Top Right */}
          <div className="absolute top-2 right-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                venue.status === "Available"
                  ? "bg-brand-500 text-white dark:bg-brand-600"
                  : "bg-gray-400 text-white dark:bg-gray-600"
              }`}
            >
              {venue.status}
            </span>
          </div>

        </div>

        {/* Content Section - Flexible Height */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Header with Venue Name and Map Button */}
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-2">
              {venue.name}
            </h2>
            {SHOW_MAP && venue.latitude && venue.longitude && (
              <button
                onClick={() => setShowMap(true)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex-shrink-0"
                title="📍 View venue location on map"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="hidden sm:inline">Map</span>
              </button>
            )}
          </div>

          {/* Attendees Count & Avatars */}
          <div className="mb-3">
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
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
                <span className="ml-2 text-red-600 dark:text-red-400 text-xs">
                  (Full)
                </span>
              )}
            </p>
            {/* Clickable Attendee Avatars */}
            {venue.attendees.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden">
                {venue.attendees.slice(0, 5).map((attendee) => (
                  <Link
                    key={attendee.id}
                    to={`/profile/${attendee.id}`}
                    className="relative inline-block hover:z-10 transition-transform hover:scale-110"
                    title={attendee.displayName || "Anonymous"}
                  >
                    <Avatar
                      src={attendee.photoURL}
                      name={attendee.displayName}
                      size="sm"
                      className="ring-2 ring-white dark:ring-gray-800"
                    />
                  </Link>
                ))}
                {venue.attendees.length > 5 && (
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                    +{venue.attendees.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cancellation Warning */}
          {hasReachedCancellationLimit && !isUserAttending && (
            <div className="mb-3 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded">
              You've cancelled twice for this venue. You can no longer sign up.
            </div>
          )}

          {/* Action Button - Pushed to Bottom */}
          <div className="mt-auto pt-3">
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

          {/* Sessions Toggle */}
          {venueSessions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {venueSessions.length} upcoming session{venueSessions.length !== 1 ? 's' : ''}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showSessions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Sessions List */}
              {showSessions && (
                <div className="mt-3 space-y-2">
                  {venueSessions.slice(0, 3).map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      compact
                    />
                  ))}
                  {venueSessions.length > 3 && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-1">
                      +{venueSessions.length - 3} more sessions
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Map Modal */}
        {SHOW_MAP && venue.latitude && venue.longitude && (
          <VenueMap
            latitude={venue.latitude}
            longitude={venue.longitude}
            venueName={venue.name}
            isOpen={showMap}
            onClose={() => setShowMap(false)}
          />
        )}
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
        // Fetch venues and upcoming sessions in parallel
        await Promise.all([
          venueStore.fetchVenues(),
          sessionStore.fetchUpcomingSessions(50),
        ]);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 dark:bg-dark-bg transition-colors duration-300">
      <div className="flex justify-center items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Available Venues
        </h1>
      </div>

      {venues.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No venues available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Check back later for new venues or contact an admin to add venues.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
