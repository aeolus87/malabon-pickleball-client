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
  // Track attendees for each venue
  attendees: Record<string, Attendee[]> = {};

  constructor() {
    makeAutoObservable(this);
  }

  async fetchVenues() {
    this.loading = true;
    this.error = null;

    try {
      console.log("Fetching venues from /venues");
      const response = await axios.get("/venues");
      console.log("Received response:", response.data);

      runInAction(() => {
        // Make sure we're mapping MongoDB _id to id for frontend use
        this.venues = response.data.map((venue: any) => {
          // Process attendees to ensure they have correct format
          const attendees =
            venue.attendees?.map((attendee: any) => ({
              id: attendee._id || attendee.id,
              displayName: attendee.displayName || "Anonymous",
              photoURL: attendee.photoURL,
              email: attendee.email,
            })) || [];

          // Store attendees separately for easier access
          this.attendees[venue._id] = attendees;

          return {
            id: venue._id,
            name: venue.name,
            status: venue.status,
            photoURL: venue.photoURL,
            attendees: attendees,
            createdAt: venue.createdAt,
            updatedAt: venue.updatedAt,
            timeRange: venue.timeRange,
            day: venue.day,
            cancellationCounts: venue.cancellationCounts || {},
          };
        });
        this.loading = false;
      });
    } catch (error: any) {
      console.error("VenueStore: Error fetching venues:", error);
      console.error("VenueStore: Error response:", error.response?.data);
      console.error("VenueStore: Error status:", error.response?.status);
      console.error("VenueStore: Error URL:", error.config?.url);

      runInAction(() => {
        this.error = error.response?.data?.error || "Failed to fetch venues";
        this.loading = false;
      });
    }
  }

  async attendVenue(venueId: string) {
    try {
      this.loading = true;
      this.error = null;
      console.log(`Attempting to attend venue ${venueId}`);

      // Check if user has reached cancellation limit before making API call
      if (this.hasReachedCancellationLimit(venueId)) {
        this.error =
          "You've already cancelled attendance for this venue twice. You can't sign up again.";
        console.error(this.error);
        this.loading = false;
        return false;
      }

      const response = await axios.post(`/venues/${venueId}/attend`);
      console.log("Server response:", response.data);

      if (response.data.error) {
        this.error = response.data.error;
        this.loading = false;
        return false;
      }

      runInAction(() => {
        // Update the venue in the local list
        const index = this.venues.findIndex((v) => v.id === venueId);
        if (index !== -1) {
          // Process attendees to ensure they have correct format
          const attendees =
            response.data.attendees?.map((attendee: any) => ({
              id: attendee._id || attendee.id,
              displayName: attendee.displayName || "Anonymous",
              photoURL: attendee.photoURL,
              email: attendee.email,
            })) || [];

          console.log(
            `Processed ${attendees.length} attendees for venue ${venueId}`
          );

          // Store attendees separately for easier access
          this.attendees[venueId] = attendees;

          // Process cancellation counts if provided
          const cancellationCounts = response.data.cancellationCounts || {};

          // Create updated venue object with both _id and id for compatibility
          const updated = {
            ...response.data,
            id: response.data._id || response.data.id,
            _id: response.data._id || response.data.id,
            attendees: attendees,
            cancellationCounts,
          };

          this.venues[index] = updated;

          // Debug: Check if the current user is in the updated attendees list
          const userId = userStore.profile?.id || authStore.user?.id;
          if (userId) {
            const userFound = attendees.some((a: Attendee) => a.id === userId);
            console.log(
              `After attending: Current user found in attendees list: ${userFound}`
            );
          }
        } else {
          console.error(`Venue with ID ${venueId} not found in venues list`);
        }
        this.loading = false;
      });

      return true;
    } catch (error: any) {
      console.error("Error attending venue:", error);
      runInAction(() => {
        this.loading = false;
        this.error = error.response?.data?.error || "Failed to attend venue";
      });
      return false;
    }
  }

  async cancelAttendance(venueId: string) {
    try {
      this.loading = true;
      this.error = null;
      console.log(`Attempting to cancel attendance for venue ${venueId}`);

      const response = await axios.post(`/venues/${venueId}/cancel`);
      console.log("Server response:", response.data);

      if (response.data.error) {
        // Handle specific error for cancellation limit
        this.error = response.data.error;
        this.loading = false;
        return false;
      }

      runInAction(() => {
        // Update the venue in the local list
        const index = this.venues.findIndex((v) => v.id === venueId);
        if (index !== -1) {
          // Process attendees to ensure they have correct format
          const attendees =
            response.data.attendees?.map((attendee: any) => ({
              id: attendee._id || attendee.id,
              displayName: attendee.displayName || "Anonymous",
              photoURL: attendee.photoURL,
              email: attendee.email,
            })) || [];

          console.log(
            `Processed ${attendees.length} attendees for venue ${venueId}`
          );

          // Store attendees separately for easier access
          this.attendees[venueId] = attendees;

          // Process cancellation counts if provided
          const cancellationCounts = response.data.cancellationCounts || {};

          // Create updated venue object with both _id and id for compatibility
          const updated = {
            ...response.data,
            id: response.data._id || response.data.id,
            _id: response.data._id || response.data.id,
            attendees: attendees,
            cancellationCounts,
          };

          this.venues[index] = updated;

          // Debug: Check if the current user is still in the attendees list
          const userId = userStore.profile?.id || authStore.user?.id;
          if (userId) {
            const userFound = attendees.some((a: Attendee) => a.id === userId);
            console.log(
              `After cancellation: Current user found in attendees list: ${userFound}`
            );

            // Log cancellation count if available
            if (cancellationCounts && userId in cancellationCounts) {
              console.log(
                `User has cancelled ${cancellationCounts[userId]} times for this venue`
              );
            }
          }
        } else {
          console.error(`Venue with ID ${venueId} not found in venues list`);
        }
        this.loading = false;
      });

      return true;
    } catch (error: any) {
      console.error("Error canceling venue attendance:", error);
      runInAction(() => {
        this.loading = false;
        this.error =
          error.response?.data?.error || "Failed to cancel attendance";
      });
      return false;
    }
  }

  // Check if the current user is attending a venue
  isUserAttending(venueId: string) {
    // This method is called from a reactive context (component render)
    // so we can safely access observables here
    const venue = this.venues.find((v) => v.id === venueId);
    if (!venue || !venue.attendees) {
      console.log(`No venue found with ID ${venueId} or no attendees`);
      return false;
    }

    // Try to get user ID from userStore first (preferred)
    let userId: string | undefined;

    if (userStore.profile && userStore.profile.id) {
      userId = userStore.profile.id;
      console.log(`Using userStore profile ID: ${userId}`);
    }
    // Fall back to authStore if userStore profile isn't loaded
    else if (authStore.user && authStore.user.id) {
      userId = authStore.user.id;
      console.log(`Using authStore user ID: ${userId}`);
    } else {
      console.log(`No user ID found in userStore or authStore`);
      return false;
    }

    // Check if user is in the attendees list
    const isAttending = venue.attendees.some((attendee) => {
      // Make sure to compare both _id and id fields for flexibility
      const attendeeId = attendee.id || (attendee as any)._id;
      const matches = attendeeId === userId;
      if (matches) {
        console.log(`User ${userId} is attending venue ${venueId}`);
      }
      return matches;
    });

    return isAttending;
  }

  // For admin functions
  async updateVenueStatus(venueId: string, status: string) {
    try {
      this.loading = true;
      const response = await axios.put(`/venues/${venueId}/status`, {
        status,
      });

      runInAction(() => {
        const index = this.venues.findIndex((v) => v.id === venueId);
        if (index !== -1) {
          // Process attendees to ensure they have correct format
          const attendees =
            response.data.attendees?.map((attendee: any) => ({
              id: attendee._id || attendee.id,
              displayName: attendee.displayName || "Anonymous",
              photoURL: attendee.photoURL,
              email: attendee.email,
            })) || [];

          // Create updated venue object
          const updated = {
            ...response.data,
            id: response.data._id,
            attendees: attendees,
          };

          this.venues[index] = updated;
        }
        this.loading = false;
      });

      return true;
    } catch (error) {
      console.error("Error updating venue status:", error);
      runInAction(() => {
        this.loading = false;
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to update venue status";
      });
      return false;
    }
  }

  // Admin: Create a new venue
  async createVenue(venueData: {
    name: string;
    status: string;
    photoURL?: string;
  }) {
    try {
      this.loading = true;
      this.error = null;

      const response = await axios.post("/venues", venueData);

      runInAction(() => {
        const newVenue = {
          ...response.data,
          id: response.data._id,
          attendees: [],
        };

        this.venues.push(newVenue);
        this.loading = false;
      });

      return true;
    } catch (error) {
      console.error("Error creating venue:", error);
      runInAction(() => {
        this.loading = false;
        this.error =
          error instanceof Error ? error.message : "Failed to create venue";
      });
      return false;
    }
  }

  // Admin: Delete a venue
  async deleteVenue(venueId: string) {
    try {
      this.loading = true;
      this.error = null;

      await axios.delete(`/venues/${venueId}`);

      runInAction(() => {
        this.venues = this.venues.filter((venue) => venue.id !== venueId);
        delete this.attendees[venueId];
        this.loading = false;
      });

      return true;
    } catch (error) {
      console.error("Error deleting venue:", error);
      runInAction(() => {
        this.loading = false;
        this.error =
          error instanceof Error ? error.message : "Failed to delete venue";
      });
      return false;
    }
  }

  // Admin: Upload venue image
  async uploadVenueImage(venueId: string, imageFile: File) {
    try {
      this.loading = true;
      this.error = null;

      // Get Cloudinary credentials from env vars
      const CLOUDINARY_UPLOAD_PRESET = import.meta.env
        .VITE_CLOUDINARY_UPLOAD_PRESET;
      const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

      if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
        throw new Error(
          "Cloudinary credentials not found in environment variables"
        );
      }

      // Upload to Cloudinary directly
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "venue_images");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const photoURL = cloudinaryData.secure_url;

      // Update the venue in the database with the new image URL
      await axios.put(`/venues/${venueId}/photo`, { photoURL });

      runInAction(() => {
        const index = this.venues.findIndex((v) => v.id === venueId);
        if (index !== -1) {
          this.venues[index].photoURL = photoURL;
        }
        this.loading = false;
      });

      return photoURL;
    } catch (error) {
      console.error("Error uploading venue image:", error);
      runInAction(() => {
        this.loading = false;
        this.error =
          error instanceof Error ? error.message : "Failed to upload image";
      });
      return null;
    }
  }

  // Admin: Get detailed venue attendees
  async getVenueAttendees(venueId: string) {
    try {
      const response = await axios.get(`/venues/${venueId}/attendees`);

      const attendees = response.data.map((attendee: any) => ({
        id: attendee._id,
        displayName: attendee.displayName || "Anonymous",
        photoURL: attendee.photoURL,
        email: attendee.email,
      }));

      runInAction(() => {
        this.attendees[venueId] = attendees;
      });

      return attendees;
    } catch (error) {
      console.error("Error fetching venue attendees:", error);
      return [];
    }
  }

  // Admin: Remove all attendees when setting venue to unavailable
  async removeAllAttendees(venueId: string) {
    try {
      await axios.post(`/venues/${venueId}/remove-all-attendees`);

      runInAction(() => {
        const index = this.venues.findIndex((v) => v.id === venueId);
        if (index !== -1) {
          this.venues[index].attendees = [];
          this.attendees[venueId] = [];
        }
      });

      return true;
    } catch (error) {
      console.error("Error removing all attendees:", error);
      return false;
    }
  }

  // Check if a user has reached the cancellation limit for a venue
  hasReachedCancellationLimit(venueId: string): boolean {
    const venue = this.venues.find((v) => v.id === venueId);
    if (!venue || !venue.cancellationCounts) return false;

    const userId = userStore.profile?.id || authStore.user?.id;
    if (!userId) return false;

    return (venue.cancellationCounts[userId] || 0) >= 2; // 2 is the cancellation limit
  }
}

export const venueStore = new VenueStore();
export default VenueStore;
