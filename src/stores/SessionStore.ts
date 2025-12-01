import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";
import { userStore, UserRole, CoachProfile } from "./UserStore";

export type SessionStatus = "open" | "full" | "cancelled";

export interface SessionAttendee {
  _id: string;
  displayName: string | null;
  photoURL: string | null;
  email?: string;
  role: UserRole;
  coachProfile?: CoachProfile;
}

export interface SessionVenue {
  _id: string;
  name: string;
  photoURL?: string;
  status: string;
}

export interface SessionCoach {
  _id: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  coachProfile?: CoachProfile;
}

export interface Session {
  _id: string;
  venueId: SessionVenue;
  date: string;
  startTime: string;
  endTime: string;
  coachId: SessionCoach | null;
  maxPlayers: number;
  attendees: SessionAttendee[];
  status: SessionStatus;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  coachId?: string;
  maxPlayers?: number;
  title?: string;
  description?: string;
}

class SessionStore {
  sessions: Session[] = [];
  loading = false;
  error: string | null = null;
  private fetchInProgress = false;

  constructor() {
    makeAutoObservable(this);
  }

  private getCurrentUserId(): string | null {
    return userStore.profile?.id || authStore.user?.id || null;
  }

  private setLoadingState(loading: boolean, error: string | null = null) {
    this.loading = loading;
    this.error = error;
  }

  // ============================================
  // Fetch Methods
  // ============================================

  async fetchSessions(filters?: {
    venueId?: string;
    coachId?: string;
    date?: string;
    status?: string;
  }): Promise<void> {
    if (this.fetchInProgress) return;

    this.fetchInProgress = true;
    this.setLoadingState(true);

    try {
      const params = new URLSearchParams();
      if (filters?.venueId) params.append("venueId", filters.venueId);
      if (filters?.coachId) params.append("coachId", filters.coachId);
      if (filters?.date) params.append("date", filters.date);
      if (filters?.status) params.append("status", filters.status);

      const url = `/sessions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await axios.get(url);

      runInAction(() => {
        this.sessions = response.data;
        this.setLoadingState(false);
      });
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to fetch sessions");
      });
    } finally {
      this.fetchInProgress = false;
    }
  }

  async fetchSessionsByVenue(venueId: string, date?: string): Promise<void> {
    this.setLoadingState(true);

    try {
      const params = date ? `?date=${date}` : "";
      const response = await axios.get(`/sessions/venue/${venueId}${params}`);

      runInAction(() => {
        this.sessions = response.data;
        this.setLoadingState(false);
      });
    } catch (error: any) {
      console.error("Error fetching venue sessions:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to fetch sessions");
      });
    }
  }

  async fetchUpcomingSessions(limit: number = 10): Promise<void> {
    this.setLoadingState(true);

    try {
      const response = await axios.get(`/sessions/upcoming?limit=${limit}`);

      runInAction(() => {
        this.sessions = response.data;
        this.setLoadingState(false);
      });
    } catch (error: any) {
      console.error("Error fetching upcoming sessions:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to fetch sessions");
      });
    }
  }

  // ============================================
  // CRUD Methods
  // ============================================

  async createSession(data: CreateSessionData): Promise<Session | null> {
    this.setLoadingState(true);

    try {
      const response = await axios.post("/sessions", data);

      runInAction(() => {
        this.sessions.unshift(response.data);
        this.setLoadingState(false);
      });

      return response.data;
    } catch (error: any) {
      console.error("Error creating session:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to create session");
      });
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<CreateSessionData>): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.put(`/sessions/${sessionId}`, updates);

      runInAction(() => {
        const index = this.sessions.findIndex((s) => s._id === sessionId);
        if (index !== -1) {
          this.sessions[index] = response.data;
        }
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Error updating session:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to update session");
      });
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      await axios.delete(`/sessions/${sessionId}`);

      runInAction(() => {
        this.sessions = this.sessions.filter((s) => s._id !== sessionId);
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting session:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to delete session");
      });
      return false;
    }
  }

  // ============================================
  // Attendance Methods
  // ============================================

  async attendSession(sessionId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.post(`/sessions/${sessionId}/attend`);

      runInAction(() => {
        const index = this.sessions.findIndex((s) => s._id === sessionId);
        if (index !== -1) {
          this.sessions[index] = response.data;
        }
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Error attending session:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to attend session");
      });
      return false;
    }
  }

  async leaveSession(sessionId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.post(`/sessions/${sessionId}/leave`);

      runInAction(() => {
        const index = this.sessions.findIndex((s) => s._id === sessionId);
        if (index !== -1) {
          this.sessions[index] = response.data;
        }
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Error leaving session:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to leave session");
      });
      return false;
    }
  }

  // ============================================
  // Coach Methods
  // ============================================

  async assignCoach(sessionId: string, coachId: string | null): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.post(`/sessions/${sessionId}/assign-coach`, { coachId });

      runInAction(() => {
        const index = this.sessions.findIndex((s) => s._id === sessionId);
        if (index !== -1) {
          this.sessions[index] = response.data;
        }
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Error assigning coach:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to assign coach");
      });
      return false;
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  isUserAttending(sessionId: string): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const session = this.sessions.find((s) => s._id === sessionId);
    return session?.attendees.some((a) => a._id === userId) || false;
  }

  getSessionById(sessionId: string): Session | undefined {
    return this.sessions.find((s) => s._id === sessionId);
  }

  getSessionsByVenueId(venueId: string): Session[] {
    return this.sessions.filter((s) => s.venueId._id === venueId);
  }

  getSessionsForDate(date: string): Session[] {
    const targetDate = new Date(date).toDateString();
    return this.sessions.filter((s) => new Date(s.date).toDateString() === targetDate);
  }

  clearSessions(): void {
    runInAction(() => {
      this.sessions = [];
      this.error = null;
    });
  }
}

export const sessionStore = new SessionStore();
export default SessionStore;









