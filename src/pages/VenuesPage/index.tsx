import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { venueStore, Venue } from "../../stores/VenueStore";
import { sessionStore, Session } from "../../stores/SessionStore";
import { authStore } from "../../stores/AuthStore";
import OptimizedImage from "../../components/OptimizedImage";
import Avatar from "../../components/Avatar";

// Tab type
type TabType = "today" | "upcoming";

// ============================================
// Simple Venue Card - Just info, no actions
// ============================================
interface VenueCardProps {
  venue: Venue;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-md overflow-hidden dark:border dark:border-dark-border">
      {/* Image */}
      <div className="relative h-32 w-full">
        <OptimizedImage
          src={venue.photoURL || ""}
          alt={venue.name}
          className="w-full h-full object-cover"
          fallbackText={venue.name}
        />
        {/* Status Badge */}
        <span
          className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
            venue.status === "Available"
              ? "bg-green-500 text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          {venue.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          {venue.name}
        </h3>
      </div>
    </div>
  );
};

// ============================================
// Event Card for Sessions
// ============================================
interface EventCardProps {
  session: Session;
  onJoin: (sessionId: string) => void;
  onLeave: (sessionId: string) => void;
}

const EventCard: React.FC<EventCardProps> = observer(({ session, onJoin, onLeave }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isAttending = sessionStore.isUserAttending(session._id);
  const isFull = session.attendees.length >= session.maxPlayers;
  const spotsLeft = session.maxPlayers - session.attendees.length;

  // Check if session has ended
  const isEnded = () => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [endHours, endMinutes] = session.endTime.split(":").map(Number);
    const sessionEndTime = new Date(sessionDate);
    sessionEndTime.setHours(endHours, endMinutes, 0, 0);
    return now > sessionEndTime;
  };

  const hasEnded = isEnded();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const sessionDateFormatted = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleJoinClick = () => {
    setShowConfirmModal(true);
  };

  const confirmJoin = () => {
    setShowConfirmModal(false);
    onJoin(session._id);
  };

  return (
    <>
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-md overflow-hidden dark:border dark:border-dark-border h-full flex flex-col">
        <div className="p-4 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                {formatDate(session.date)}
              </span>
              {session.title && (
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-2">
                  {session.title}
                </h3>
              )}
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${isFull ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                {spotsLeft} spots
              </span>
            </div>
          </div>

          {/* Time & Venue */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{session.venueId?.name || "TBD"}</span>
            </div>
          </div>

          {/* Coach - shows placeholder if no coach to maintain consistent height */}
          <div className="mb-3 min-h-[52px]">
            {session.coachId ? (
              <Link 
                to={`/profile/${session.coachId._id}`}
                className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                <Avatar
                  src={session.coachId.photoURL}
                  name={session.coachId.displayName}
                  size="sm"
                />
                <div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Coach</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline">
                    {session.coachId.displayName || "Coach"}
                  </p>
                </div>
              </Link>
            ) : null}
          </div>

          {/* Attendees & Action - pushed to bottom */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex -space-x-2">
              {session.attendees.slice(0, 5).map((attendee) => (
                <Link
                  key={attendee._id}
                  to={`/profile/${attendee._id}`}
                  className="hover:z-10"
                >
                  <Avatar
                    src={attendee.photoURL}
                    name={attendee.displayName}
                    size="xs"
                    className="ring-2 ring-white dark:ring-gray-800"
                  />
                </Link>
              ))}
              {session.attendees.length > 5 && (
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-[10px] font-medium">
                  +{session.attendees.length - 5}
                </span>
              )}
              {session.attendees.length === 0 && (
                <span className="text-xs text-gray-400">No attendees yet</span>
              )}
            </div>

            {/* Action */}
            {authStore.isAuthenticated && !hasEnded && (
              isAttending ? (
                <button
                  onClick={() => onLeave(session._id)}
                  className="px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={handleJoinClick}
                  disabled={isFull}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg ${
                    isFull
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isFull ? "Full" : "Join"}
                </button>
              )
            )}
            {hasEnded && (
              <span className="px-4 py-1.5 text-sm font-medium text-gray-400 dark:text-gray-500">
                Ended
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Confirm Attendance
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You're about to join this session:
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              {session.title && (
                <p className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{session.title}</p>
              )}
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>📅 {sessionDateFormatted}</p>
                <p>🕐 {formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
                {session.venueId && <p>📍 {session.venueId.name}</p>}
                {session.coachId && <p>👤 Coach: {session.coachId.displayName}</p>}
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
              A confirmation email will be sent to your registered email address.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmJoin}
                disabled={sessionStore.loading}
                className="flex-1 py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {sessionStore.loading ? "Joining..." : "Confirm & Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// ============================================
// Main Venues Page
// ============================================
const VenuesPage: React.FC = observer(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // Check for password change modal flag (after account unlock)
  useEffect(() => {
    const shouldShow = sessionStorage.getItem("showPasswordChangeModal");
    if (shouldShow === "true") {
      setShowPasswordChangeModal(true);
      sessionStorage.removeItem("showPasswordChangeModal");
    }
  }, []);

  const handlePasswordChangeChoice = (changePassword: boolean) => {
    setShowPasswordChangeModal(false);
    if (changePassword) {
      navigate("/settings");
    }
  };

  const venues = venueStore.venues;
  const allSessions = sessionStore.sessions.filter(s => s.status !== "cancelled");
  const venuesLoading = venueStore.loading;

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Separate today's sessions from future sessions
  const todaySessions = allSessions.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  const upcomingSessions = allSessions.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() > today.getTime();
  });

  // Format today's date for display
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const initializePage = async () => {
      try {
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

  const handleJoinSession = async (sessionId: string) => {
    try {
      const success = await sessionStore.attendSession(sessionId);
      if (success) {
        setIsError(false);
        setConfirmationMessage("Joined session!");
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
      } else {
        setIsError(true);
        setConfirmationMessage(sessionStore.error || "Failed to join.");
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
      }
    } catch (error) {
      setIsError(true);
      setConfirmationMessage("An error occurred.");
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    }
  };

  const handleLeaveSession = async (sessionId: string) => {
    try {
      const success = await sessionStore.leaveSession(sessionId);
      if (success) {
        setIsError(false);
        setConfirmationMessage("Left session.");
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
      }
    } catch (error) {
      setIsError(true);
      setConfirmationMessage("Failed to leave.");
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    }
  };

  if (loading || venuesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
      {/* Header with Tabs */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Play Pickleball
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {todayFormatted}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "today"
                  ? "bg-gray-50 dark:bg-dark-bg text-green-600 dark:text-green-400 border-b-2 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Today
              {(venues.length > 0 || todaySessions.length > 0) && (
                <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  {venues.length} venues{todaySessions.length > 0 ? ` • ${todaySessions.length} sessions` : ""}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "upcoming"
                  ? "bg-gray-50 dark:bg-dark-bg text-green-600 dark:text-green-400 border-b-2 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming
              {upcomingSessions.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                  {upcomingSessions.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "today" ? (
          // Today's View - Venues + Today's Sessions
          <div className="space-y-8">
            {/* Today's Sessions */}
            {todaySessions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    LIVE TODAY
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Today's Sessions
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaySessions.map((session) => (
                    <EventCard
                      key={session._id}
                      session={session}
                      onJoin={handleJoinSession}
                      onLeave={handleLeaveSession}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Venues */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Venues
                </h2>
              </div>
              {venues.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl">
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No venues available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          // Upcoming Tab - Future Sessions
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upcoming Sessions
              </h2>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">No upcoming sessions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Future sessions will appear here when scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <EventCard
                    key={session._id}
                    session={session}
                    onJoin={handleJoinSession}
                    onLeave={handleLeaveSession}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showConfirmation && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            isError
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {confirmationMessage}
        </div>
      )}

      {/* Password Change Modal (after account unlock) */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome Back!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your account has been unlocked successfully.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Security Recommendation
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Your account was locked due to multiple failed login attempts. We recommend changing your password for security.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handlePasswordChangeChoice(true)}
                className="w-full py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={() => handlePasswordChangeChoice(false)}
                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default VenuesPage;
