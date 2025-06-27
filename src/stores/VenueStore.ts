import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";
import { userStore } from "./UserStore";

interface Attendee {
  id: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
}

export interface Venue {
  id: string;
  name: string;
  status: string;
  photoURL?: string;
  attendees: Attendee[];
  createdAt: string;
  updatedAt: string;
  timeRange?: string;
  day?: string;
  cancellationCounts?: Record<string, number>; // Track user cancellations
}

class VenueStore {
  venues: Venue[] = [];
  loading = false;
  error: string | null = null;
  private fetchInProgress = false;
  // Track attendees for each venue
  attendees: Record<string, Attendee[]> = {};

  constructor() {
    makeAutoObservable(this);
  }

  // Helper methods
  private getCurrentUserId(): string | null {
    return userStore.profile?.id || authStore.user?.id || null;
  }

  private processAttendee = (attendee: any): Attendee => ({
              id: attendee._id || attendee.id,
              displayName: attendee.displayName || "Anonymous",
              photoURL: attendee.photoURL,
              email: attendee.email,
  });

  private processVenue = (venue: any): Venue => ({
            id: venue._id,
            name: venue.name,
            status: venue.status,
            photoURL: venue.photoURL,
    attendees: venue.attendees?.map(this.processAttendee) || [],
            createdAt: venue.createdAt,
            updatedAt: venue.updatedAt,
            timeRange: venue.timeRange,
            day: venue.day,
            cancellationCounts: venue.cancellationCounts || {},
  });

  private updateVenueInList = (updatedVenue: any) => {
    const index = this.venues.findIndex((v) => v.id === updatedVenue._id);
    if (index !== -1) {
      this.venues[index] = this.processVenue(updatedVenue);
    }
  };

  private setLoadingState = (loading: boolean, error: string | null = null) => {
    this.loading = loading;
    this.error = error;
  };

  async fetchVenues() {
    if (this.fetchInProgress) return;
    
    this.fetchInProgress = true;
    this.setLoadingState(true);

    try {
      const response = await axios.get("/venues");
      
      runInAction(() => {
        this.venues = response.data.map(this.processVenue);
        this.setLoadingState(false);
      });
    } catch (error: any) {
      console.error("Error fetching venues:", error);
      runInAction(() => {
        this.setLoadingState(false, error.response?.data?.error || "Failed to fetch venues");
      });
    } finally {
      this.fetchInProgress = false;
    }
  }

  async attendVenue(venueId: string): Promise<boolean> {
    // Check cancellation limit before API call
      if (this.hasReachedCancellationLimit(venueId)) {
      this.error = "You've cancelled attendance twice. Cannot sign up again.";
        return false;
      }

    this.setLoadingState(true);

    try {
      const response = await axios.post(`/venues/${venueId}/attend`);

      if (response.data.error) {
        this.setLoadingState(false, response.data.error);
        return false;
      }

      runInAction(() => {
        this.updateVenueInList(response.data);
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to attend venue");
      return false;
    }
  }

  async cancelAttendance(venueId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.post(`/venues/${venueId}/cancel`);

      if (response.data.error) {
        this.setLoadingState(false, response.data.error);
        return false;
      }

      runInAction(() => {
        this.updateVenueInList(response.data);
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to cancel attendance");
      return false;
    }
  }

  isUserAttending(venueId: string): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const venue = this.venues.find((v) => v.id === venueId);
    return venue?.attendees.some((attendee) => attendee.id === userId) || false;
    }

  hasReachedCancellationLimit(venueId: string): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const venue = this.venues.find((v) => v.id === venueId);
    const cancellationCount = venue?.cancellationCounts?.[userId] || 0;
    return cancellationCount >= 2;
  }

  // Admin methods
  async updateVenueStatus(venueId: string, status: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.put(`/venues/${venueId}/status`, { status });

      runInAction(() => {
        this.updateVenueInList(response.data);
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to update venue status");
      return false;
    }
  }

  async createVenue(venueData: { name: string; status: string; photoURL?: string }): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.post("/venues", venueData);

      runInAction(() => {
        this.venues.push(this.processVenue(response.data));
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to create venue");
      return false;
    }
  }

  async deleteVenue(venueId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      await axios.delete(`/venues/${venueId}`);

      runInAction(() => {
        this.venues = this.venues.filter((v) => v.id !== venueId);
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to delete venue");
      return false;
    }
  }

  async uploadVenueImage(venueId: string, imageFile: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await axios.post(`/venues/${venueId}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data.photoURL;
    } catch (error: any) {
      console.error("Error uploading venue image:", error);
      this.error = error.response?.data?.error || "Failed to upload image";
      return null;
    }
  }

  async removeAllAttendees(venueId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.post(`/venues/${venueId}/remove-all-attendees`);

      runInAction(() => {
        this.updateVenueInList(response.data);
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to remove attendees");
      return false;
    }
  }

  async getVenueAttendees(venueId: string): Promise<boolean> {
    try {
      const response = await axios.get(`/venues/${venueId}/attendees`);
      
      runInAction(() => {
        this.attendees[venueId] = response.data.map(this.processAttendee);
      });

      return true;
    } catch (error: any) {
      console.error("Error fetching venue attendees:", error);
      return false;
    }
  }
}

export const venueStore = new VenueStore();
export default VenueStore;
