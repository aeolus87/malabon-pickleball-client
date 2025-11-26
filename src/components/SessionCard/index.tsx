import React from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { Session, sessionStore } from "../../stores/SessionStore";
import { authStore } from "../../stores/AuthStore";
import Avatar from "../Avatar";
import CoachBadge from "../CoachBadge";

interface SessionCardProps {
  session: Session;
  onAttend?: () => void;
  onLeave?: () => void;
  showVenue?: boolean;
  compact?: boolean;
}

/**
 * SessionCard - Displays a session with time, coach, and attendee info
 */
const SessionCard: React.FC<SessionCardProps> = observer(({
  session,
  onAttend,
  onLeave,
  showVenue = false,
  compact = false,
}) => {
  const isAttending = sessionStore.isUserAttending(session._id);
  const isAuthenticated = authStore.isAuthenticated;
  const isFull = session.status === "full";
  const isCancelled = session.status === "cancelled";
  const spotsLeft = session.maxPlayers - session.attendees.length;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleAttendClick = async () => {
    if (onAttend) {
      onAttend();
    } else {
      await sessionStore.attendSession(session._id);
    }
  };

  const handleLeaveClick = async () => {
    if (onLeave) {
      onLeave();
    } else {
      await sessionStore.leaveSession(session._id);
    }
  };

  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between p-3 rounded-lg border
          ${isCancelled
            ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-medium">
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>
          {session.coachId && (
            <div className="flex items-center gap-1">
              <Avatar
                src={session.coachId.photoURL}
                name={session.coachId.displayName}
                size="xs"
              />
              <CoachBadge role="coach" size="xs" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {session.attendees.length}/{session.maxPlayers}
          </span>
          {isAuthenticated && !isCancelled && (
            isAttending ? (
              <button
                onClick={handleLeaveClick}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                Leave
              </button>
            ) : !isFull ? (
              <button
                onClick={handleAttendClick}
                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
              >
                Join
              </button>
            ) : (
              <span className="text-xs text-gray-500">Full</span>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-xl border overflow-hidden
        ${isCancelled
          ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            {session.title && (
              <h3 className="font-semibold text-lg mb-1">{session.title}</h3>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                {formatTime(session.startTime)} - {formatTime(session.endTime)}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div>
            {isCancelled ? (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                Cancelled
              </span>
            ) : isFull ? (
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Full
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {spotsLeft} spots left
              </span>
            )}
          </div>
        </div>

        {showVenue && session.venueId && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {session.venueId.name}
          </div>
        )}

        {session.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {session.description}
          </p>
        )}
      </div>

      {/* Coach section */}
      {session.coachId && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${session.coachId._id}`} className="flex-shrink-0">
              <Avatar
                src={session.coachId.photoURL}
                name={session.coachId.displayName}
                size="sm"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${session.coachId._id}`}
                  className="font-medium text-sm hover:underline truncate"
                >
                  {session.coachId.displayName || "Coach"}
                </Link>
                <CoachBadge
                  role="coach"
                  size="xs"
                  isAvailable={session.coachId.coachProfile?.isAvailable}
                  showAvailability
                />
              </div>
              {session.coachId.coachProfile?.specialization && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session.coachId.coachProfile.specialization}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendees section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attendees ({session.attendees.length}/{session.maxPlayers})
          </span>
        </div>

        {session.attendees.length > 0 ? (
          <div className="flex -space-x-2 overflow-hidden">
            {session.attendees.slice(0, 8).map((attendee) => (
              <Link
                key={attendee._id}
                to={`/profile/${attendee._id}`}
                className="relative inline-block"
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
            {session.attendees.length > 8 && (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-xs font-medium">
                +{session.attendees.length - 8}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No attendees yet. Be the first to join!
          </p>
        )}
      </div>

      {/* Action button */}
      {isAuthenticated && !isCancelled && (
        <div className="px-4 pb-4">
          {isAttending ? (
            <button
              onClick={handleLeaveClick}
              disabled={sessionStore.loading}
              className="w-full py-2 px-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {sessionStore.loading ? "Leaving..." : "Leave Session"}
            </button>
          ) : !isFull ? (
            <button
              onClick={handleAttendClick}
              disabled={sessionStore.loading}
              className="w-full py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {sessionStore.loading ? "Joining..." : "Join Session"}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2 px-4 rounded-lg bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 font-medium text-sm cursor-not-allowed"
            >
              Session Full
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default SessionCard;

