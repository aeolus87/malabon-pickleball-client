import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";
import { Club } from "./ClubStore";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  coverPhoto: string | null;
  bio: string | null;
  clubs?: Club[];
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  coverPhoto?: string;
}

class UserStore {
  profile: UserProfile | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get hasProfile(): boolean {
    return this.profile !== null;
  }

  private setLoadingState = (loading: boolean, error: string | null = null) => {
    this.loading = loading;
    this.error = error;
  };

  // Convert auth store user to profile format
  private createProfileFromAuth = (authUser: any): UserProfile => ({
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.displayName,
    photoURL: authUser.photoURL,
    coverPhoto: authUser.coverPhoto,
    bio: authUser.bio,
    clubs: authUser.clubs || [],
  });

  async loadProfile(): Promise<boolean> {
    // If we already have a profile, return it
    if (this.profile) return true;

    // If auth store has user data, use it directly
    if (authStore.user && authStore.isAuthenticated) {
      runInAction(() => {
        this.profile = this.createProfileFromAuth(authStore.user);
      });
      return true;
    }

    // If not authenticated, don't try to fetch
    if (!authStore.isAuthenticated) {
      return false;
    }

    // Fetch from API
    this.setLoadingState(true);

    try {
      const response = await axios.get("/users/profile");

      runInAction(() => {
        this.profile = {
          id: response.data.id,
          email: response.data.email,
          displayName: response.data.displayName || null,
          photoURL: response.data.photoURL || null,
          coverPhoto: response.data.coverPhoto || null,
          bio: response.data.bio || null,
          clubs: response.data.clubs || [],
        };
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Failed to load user profile:", error);
      this.setLoadingState(false, "Failed to load user profile");
      return false;
    }
  }

  /**
   * Updates the user profile. This is the single source of truth for profile updates.
   * It updates both the UserStore and syncs changes to AuthStore.
   */
  async updateProfile(updates: ProfileUpdateData): Promise<boolean> {
    if (!authStore.isAuthenticated) return false;

    this.setLoadingState(true);

    try {
      const response = await axios.put("/users/profile", updates);

      runInAction(() => {
        // Update UserStore profile
        if (this.profile) {
          this.profile = {
            ...this.profile,
            ...updates,
            ...response.data.user,
          };
        } else {
          this.profile = response.data.user;
        }

        // Sync to AuthStore to keep user data consistent
        if (authStore.user) {
          authStore.syncUserData({
            ...updates,
            ...response.data.user,
          });
        }

        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      this.setLoadingState(false, error.response?.data?.error || "Failed to update profile");
      return false;
    }
  }

  clearProfile(): void {
    runInAction(() => {
      this.profile = null;
      this.error = null;
    });
  }
}

export const userStore = new UserStore();
export default UserStore;
