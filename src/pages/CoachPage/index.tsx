import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../stores/AuthStore";
import { venueStore } from "../../stores/VenueStore";
import { sessionStore, CreateSessionData } from "../../stores/SessionStore";
import SessionCard from "../../components/SessionCard";

type SessionType = "open" | "coached";

const CoachPage: React.FC = observer(() => {
  const navigate = useNavigate();
  const user = authStore.user;
  // Coach, admin, and super admin can access this page
  const canAccessCoachPanel = user?.role === "coach" || user?.isAdmin || user?.isSuperAdmin;

  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [sessionType, setSessionType] = useState<SessionType>("coached"); // Default to coached for coaches
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {

    if (!canAccessCoachPanel) {
      console.log("Cannot access Coach Panel, redirecting to /");
      navigate("/venues");
      return;
    }

    const initialize = async () => {
      try {
        console.log("Initializing Coach Page...");
        // For admins/super admins, fetch all sessions; for coaches, fetch their own
        const filters = user?.role === "coach" ? { coachId: user?.id } : {};
        console.log("Session filters:", filters);
        await Promise.all([
          venueStore.fetchVenues(),
          sessionStore.fetchSessions(filters),
        ]);
      } catch (err) {
        console.error("Failed to initialize coach page:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [canAccessCoachPanel, navigate, user?.id, user?.role]);

  const resetForm = () => {
    setSessionType("coached");
    setVenueId("");
    setDate("");
    setStartTime("09:00");
    setEndTime("12:00");
    setMaxPlayers(20);
    setTitle("");
    setDescription("");
    setError("");
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    if (!venueId || !date || !startTime || !endTime) {
      setError("Please fill in all required fields");
      setCreating(false);
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time");
      setCreating(false);
      return;
    }

    try {
      const sessionData: CreateSessionData = {
        venueId,
        date,
        startTime,
        endTime,
        maxPlayers,
        // Only assign coach if coached session
        ...(sessionType === "coached" && { coachId: user?.id }),
        title: title || (sessionType === "open" ? "Open Play" : undefined),
        ...(description && { description }),
      };

      const result = await sessionStore.createSession(sessionData);

      if (result) {
        setSuccess("Session created successfully!");
        resetForm();
        setShowCreateForm(false);
        // Refresh sessions
        await sessionStore.fetchSessions({ coachId: user?.id });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(sessionStore.error || "Failed to create session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Get sessions - for coaches show their own, for admins show all
  const mySessions = user?.role === "coach"
    ? sessionStore.sessions.filter((s) => s.coachId?._id === user?.id)
    : sessionStore.sessions;

  const upcomingSessions = mySessions.filter(
    (s) => new Date(s.date) >= new Date() && s.status !== "cancelled"
  );

  const pastSessions = mySessions.filter(
    (s) => new Date(s.date) < new Date() || s.status === "cancelled"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 15h-4v-1h4v1zm1.13-4.47l-.63.44V14h-5v-1.03l-.63-.44C8.21 11.68 7 10.39 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.39-1.21 2.68-2.87 3.53z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Coach Panel</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your coaching sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Upcoming:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{upcomingSessions.length}</span>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Session Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create New Session
            </h2>

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Session Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionType("open")}
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
                      <p className="text-xs opacity-75">No coach, casual</p>
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
                      <p className="text-xs opacity-75">You as instructor</p>
                    </div>
                  </button>
                </div>
              </div>

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
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a venue</option>
                    {venueStore.venues
                      .filter((v) => v.status === "Available")
                      .map((venue) => (
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
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
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
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
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
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
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
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Beginner Clinic, Advanced Drills"
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
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
                  placeholder="What will players learn in this session?"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    sessionType === "open"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {creating ? "Creating..." : `Create ${sessionType === "open" ? "Open Play" : "Coached Session"}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Sessions */}
        <div className="space-y-8">
          {/* Upcoming Sessions */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Upcoming Sessions ({upcomingSessions.length})
            </h2>
            {upcomingSessions.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 text-amber-600 dark:text-amber-400 font-medium hover:underline"
                >
                  Create your first session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session._id} session={session} showVenue />
                ))}
              </div>
            )}
          </section>

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Past Sessions ({pastSessions.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {pastSessions.slice(0, 6).map((session) => (
                  <SessionCard key={session._id} session={session} showVenue />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
});

export default CoachPage;

