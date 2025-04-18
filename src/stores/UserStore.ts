import { makeAutoObservable, runInAction, action, computed } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";
import { Club } from "./ClubStore";

// Import User type from AuthStore
import { User } from "./AuthStore";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  coverPhoto: string | null;
  bio: string | null;
  isProfileComplete: boolean;
  clubs?: Club[];
}

class UserStore {
  profile: UserProfile | null = null;
  loading = false;
  error: string | null = null;
  lastFetchTimestamp: number = 0;
  fetchPromise: Promise<boolean> | null = null;

  constructor() {
    makeAutoObservable(this, {
      loadProfile: action,
      updateProfile: action,
      clearProfile: action,
      hasProfile: computed,
    });
  }

  /**
   * Computed property to check if profile exists
   */
  get hasProfile(): boolean {
    return this.profile !== null;
  }

  /**
   * Load user profile from auth store or fetch from API
   * Implements caching and request deduplication
   */
  async loadProfile(): Promise<boolean> {
    // If we already have a profile and it was fetched recently (last 60 seconds), use it
    const CACHE_TTL = 60000; // 60 seconds in milliseconds
    const now = Date.now();

    // Read observable values inside runInAction to ensure proper tracking
    let isCacheValid = false;
    let isUserAuthenticated = false;
    let existingPromise: Promise<boolean> | null = null;

    runInAction(() => {
      isCacheValid =
        !!this.profile && now - this.lastFetchTimestamp < CACHE_TTL;
      isUserAuthenticated = authStore.isAuthenticated;
      existingPromise = this.fetchPromise;
    });

    if (isCacheValid) {
      return true;
    }

    // If there's already a fetch in progress, return that promise instead of starting a new request
    if (existingPromise) {
      return existingPromise;
    }

    // If auth store has user data and we don't have profile data yet, use it
    let hasAuthUserData = false;
    let authUser: User | null = null;

    runInAction(() => {
      if (authStore.user && !this.profile) {
        hasAuthUserData = true;
        authUser = authStore.user;
      }
    });

    if (hasAuthUserData && authUser) {
      runInAction(() => {
        this.profile = {
          id: authUser!.id,
          email: authUser!.email,
          displayName: authUser!.displayName,
          photoURL: authUser!.photoURL,
          coverPhoto: authUser!.coverPhoto,
          bio: authUser!.bio,
          isProfileComplete: authUser!.isProfileComplete,
          clubs: (authUser as any).clubs || [],
        };
      });
      return true;
    }

    // If not authenticated, don't try to fetch profile
    if (!isUserAuthenticated) {
      return false;
    }

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    // Create and store the fetch promise
    const fetchPromise = this.fetchProfileFromAPI();
    runInAction(() => {
      this.fetchPromise = fetchPromise;
    });

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      // Clear the promise reference when done
      runInAction(() => {
        this.fetchPromise = null;
      });
    }
  }

  /**
   * Internal method to fetch profile from API
   */
  private async fetchProfileFromAPI(): Promise<boolean> {
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
          isProfileComplete: response.data.isProfileComplete || false,
          clubs: response.data.clubs || [],
        };
        this.loading = false;
        this.lastFetchTimestamp = Date.now();
      });

      return true;
    } catch (error) {
      console.error("Failed to load user profile:", error);
      runInAction(() => {
        this.error = "Failed to load user profile";
        this.loading = false;
      });
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    displayName?: string;
    bio?: string;
    photoURL?: string;
    coverPhoto?: string;
    isProfileComplete?: boolean;
  }): Promise<boolean> {
    let isAuthenticated = false;
    runInAction(() => {
      isAuthenticated = authStore.isAuthenticated;
    });

    if (!isAuthenticated) return false;

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      const response = await axios.put("/users/profile", updates);

      runInAction(() => {
        if (this.profile) {
          // Apply immediate updates from the input as well as response data
          this.profile = {
            ...this.profile,
            ...updates,
            ...response.data.user,
          };

          // Force update the lastFetchTimestamp to prevent cached data from overriding
          this.lastFetchTimestamp = Date.now();
        } else {
          this.profile = response.data.user;
        }
        this.loading = false;
      });

      // Only update the auth store if it's already initialized to keep in sync
      let hasUser = false;
      runInAction(() => {
        hasUser = !!authStore.user;
      });

      if (hasUser) {
        await authStore.updateUserProfile(updates);
      }

      return true;
    } catch (error) {
      console.error("Failed to update profile:", error);
      runInAction(() => {
        this.error = "Failed to update profile";
        this.loading = false;
      });
      return false;
    }
  }

  /**
   * Clear user profile data (usually on logout)
   */
  clearProfile(): void {
    runInAction(() => {
      this.profile = null;
      this.error = null;
      this.lastFetchTimestamp = 0;
      this.fetchPromise = null;
    });
  }
}

export const userStore = new UserStore();
export default UserStore;
