import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import { sessionStore, CreateSessionData } from "../../../stores/SessionStore";
import { venueStore } from "../../../stores/VenueStore";

interface Coach {
  _id: string;
  displayName: string | null;
  photoURL: string | null;
}

type SessionType = "open" | "coached";

const CreateSessionForm: React.FC = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [sessionType, setSessionType] = useState<SessionType>("open");
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [coachId, setCoachId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Fetch coaches when form opens
  useEffect(() => {
    if (isOpen) {
      fetchCoaches();
    }
  }, [isOpen]);

  const fetchCoaches = async () => {
    try {
      const response = await axios.get("/users/coaches");
      setCoaches(response.data);
    } catch (err) {
      console.error("Failed to fetch coaches:", err);
    }
  };

  const resetForm = () => {
    setSessionType("open");
    setVenueId("");
    setDate("");
    setStartTime("09:00");
    setEndTime("12:00");
    setCoachId("");
    setMaxPlayers(20);
    setTitle("");
    setDescription("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!venueId || !date || !startTime || !endTime) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }

    if (sessionType === "coached" && !coachId) {
      setError("Please select a coach for coached sessions");
      setLoading(false);
      return;
    }

    try {
      const sessionData: CreateSessionData = {
        venueId,
        date,
        startTime,
        endTime,
        maxPlayers,
        ...(sessionType === "coached" && coachId && { coachId }),
        title: title || (sessionType === "open" ? "Open Play" : undefined),
        ...(description && { description }),
      };

      const result = await sessionStore.createSession(sessionData);

      if (result) {
        setSuccess(true);
        resetForm();
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 2000);
      } else {
        setError(sessionStore.error || "Failed to create session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {isOpen ? "Hide" : "Create Session"}
      </button>

      {/* Form */}
      {isOpen && (
        <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create New Session
          </h3>

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              Session created successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Session Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSessionType("open");
                    setCoachId("");
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    sessionType === "open"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Open Play</p>
                    <p className="text-xs opacity-75">No coach, casual play</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType("coached")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    sessionType === "coached"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 15h-4v-1h4v1zm1.13-4.47l-.63.44V14h-5v-1.03l-.63-.44C8.21 11.68 7 10.39 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.39-1.21 2.68-2.87 3.53z"/>
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Coached</p>
                    <p className="text-xs opacity-75">With instructor</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Coach Selection - Only show for coached sessions */}
            {sessionType === "coached" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Coach *
                </label>
                <select
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose a coach...</option>
                  {coaches.map((coach) => (
                    <option key={coach._id} value={coach._id}>
                      {coach.displayName || "Unnamed Coach"}
                    </option>
                  ))}
                </select>
                {coaches.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    No coaches available. Promote a user to coach first.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Venue *
                </label>
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select venue...</option>
                  {venueStore.venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Players
                </label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 20)}
                  min={1}
                  max={100}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title {sessionType === "open" && "(defaults to 'Open Play')"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={sessionType === "open" ? "Open Play" : "e.g., Beginner Clinic"}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={sessionType === "open" ? "Casual play for all skill levels..." : "What players will learn..."}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                  sessionType === "open"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {loading ? "Creating..." : `Create ${sessionType === "open" ? "Open Play" : "Coached Session"}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

export default CreateSessionForm;
