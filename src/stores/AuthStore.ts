import {
  makeAutoObservable,
  action,
  runInAction,
  reaction,
  IReactionDisposer,
} from "mobx";
import axios from "axios";
import { socketStore } from "./SocketStore";

// Types for the store
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  coverPhoto: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isProfileComplete: boolean;
  bio: string | null;
  clubs: string[];
}

class AuthStore {
  user: User | null = null;
  token: string | null = null;
  loading = false;
  error: string | null = null;
  sessionChecked = false;

  // Track interceptor ids for proper cleanup
  private requestInterceptorId: number | null = null;
  private responseInterceptorId: number | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadUserFromStorage();
    this.setupAxiosInterceptors();

    // Set up periodic session verification to detect deleted accounts quickly
    if (typeof window !== "undefined") {
      this.setupPeriodicSessionCheck();
    }
  }

  @action
  private setupAxiosInterceptors() {
    // Add token to all requests
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Store the original interceptor for removal during logout
    this.responseInterceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Skip auth checks for network errors (like CORS)
        if (!error.response) {
          console.warn("Network error occurred:", error.message);
          return Promise.reject(error);
        }

        // Get URL and status code for debugging
        const url = error.config?.url || "";
        const status = error.response?.status;

        // Log all auth errors for debugging without logging out
        if (status === 401 || status === 403) {
          console.warn(
            `Auth error (${status}) detected for URL: ${url}`,
            error.response?.data
          );

          // If it's a 401 error, try to refresh the token
          if (status === 401 && !error.config._retry) {
            error.config._retry = true;
            return this.refreshToken()
              .then((token) => {
                error.config.headers.Authorization = `Bearer ${token}`;
                return axios(error.config);
              })
              .catch(() => {
                // If token refresh fails, clear auth and redirect to login
                this.clearAuth();
                socketStore.disconnect();
                window.location.href = "/login";
                return Promise.reject(error);
              });
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Safe getter for token to avoid MobX warnings
  private getToken(): string | null {
    return this.token;
  }

  @action
  private loadUserFromStorage() {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    console.log("Loading from storage:", {
      storedUser: storedUser ? JSON.parse(storedUser) : null,
      storedToken: storedToken ? "Token exists" : "No token",
    });

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure all user properties are properly set when loading from storage
        this.user = {
          id: parsedUser.id,
          email: parsedUser.email,
          displayName: parsedUser.displayName || null,
          photoURL: parsedUser.photoURL || null,
          coverPhoto: parsedUser.coverPhoto || null,
          isAdmin: parsedUser.isAdmin || false,
          isSuperAdmin: parsedUser.isSuperAdmin || false,
          isProfileComplete: parsedUser.isProfileComplete || false,
          bio: parsedUser.bio || null,
          clubs: parsedUser.clubs || [],
        };
        this.token = storedToken;
        // Set the token in axios defaults
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;
        this.sessionChecked = true; // Mark session as checked after loading from storage
      } catch (error) {
        console.error("Error parsing stored user:", error);
        this.clearAuth();
      }
    }
  }

  @action
  private saveUserToStorage() {
    if (this.user && this.token) {
      localStorage.setItem("user", JSON.stringify(this.user));
      localStorage.setItem("token", this.token);
    }
  }

  @action
  private clearStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  }

  @action
  clearAuth(isAccountDeleted = false) {
    console.log("Clearing auth state, deleted account:", isAccountDeleted);

    // Clear interceptors first
    if (this.requestInterceptorId !== null) {
      axios.interceptors.request.eject(this.requestInterceptorId);
      this.requestInterceptorId = null;
    }

    if (this.responseInterceptorId !== null) {
      axios.interceptors.response.eject(this.responseInterceptorId);
      this.responseInterceptorId = null;
    }

    // Then clear state and storage
    this.user = null;
    this.token = null;
    this.error = null;
    this.sessionChecked = false;

    // If account was deleted, do a more thorough cleanup
    if (isAccountDeleted) {
      // Clear all of localStorage, not just our tokens
      localStorage.clear();
      // Clear all axios headers
      delete axios.defaults.headers.common["Authorization"];
    } else {
      // Standard cleanup for normal logout
      this.clearStorage();
    }
  }

  @action
  clearError() {
    this.error = null;
  }

  @action
  setAuthData(token: string, userData: User) {
    this.token = token;
    this.user = userData;
    this.sessionChecked = true;
    this.error = null;

    // Set token in axios defaults
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Save to storage
    this.saveUserToStorage();
  }

  @action
  async checkSession() {
    try {
      console.log("checkSession: Starting session check");

      // Return early if already checked - this was causing the issue
      if (this.sessionChecked) {
        console.log(
          "checkSession: Already checked, auth state =",
          this.isAuthenticated
        );
        return this.isAuthenticated;
      }

      // First check for token using runInAction to properly handle observables
      let token: string | null = null;

      runInAction(() => {
        token = localStorage.getItem("token");
        console.log(
          "checkSession: Token from storage =",
          token ? "exists" : "null"
        );
      });

      if (!token) {
        runInAction(() => {
          this.clearAuth();
          this.sessionChecked = true; // Mark as checked even if no token
          console.log("checkSession: No token, cleared auth");
        });
        return false;
      }

      // Set the token in axios defaults
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("checkSession: Making API call to /auth/session");
      const response = await axios.get("/auth/session");
      console.log("Session check response:", response.data);

      // Check if we got a valid user response
      if (!response.data.user) {
        console.log("checkSession: No user data in response");
        runInAction(() => {
          this.clearAuth(true); // Treat as potential account deletion
          this.sessionChecked = true;
        });
        return false;
      }

      runInAction(() => {
        // Store current user values we want to preserve across session refreshes
        const currentPhotoURL = this.user?.photoURL;
        const currentCoverPhoto = this.user?.coverPhoto;

        // Ensure all user properties are properly set
        if (response.data.user) {
          console.log("checkSession: Got user data:", response.data.user);
          this.user = {
            id: response.data.user.id,
            email: response.data.user.email,
            displayName: response.data.user.displayName || null,
            // Preserve custom profile photo if we already have one
            photoURL: currentPhotoURL || response.data.user.photoURL || null,
            coverPhoto:
              currentCoverPhoto || response.data.user.coverPhoto || null,
            isAdmin: response.data.user.isAdmin || false,
            isSuperAdmin: response.data.user.isSuperAdmin || false,
            isProfileComplete: response.data.user.isProfileComplete || false,
            bio: response.data.user.bio || null,
            clubs: response.data.user.clubs || [],
          };
          console.log(
            "checkSession: Updated user object isAdmin =",
            this.user.isAdmin
          );
        }
        this.token = token;
        this.error = null;
        this.sessionChecked = true;
        // Save the updated user data to storage
        this.saveUserToStorage();
      });
      return true;
    } catch (error: any) {
      console.error("Session check error:", error);
      console.error("Session check error details:", {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      // Check for specific user deleted error code
      if (error.response?.data?.code === "USER_DELETED") {
        console.log("Account has been deleted, forcing logout");
        runInAction(() => {
          this.clearAuth(true); // Use the account deleted flag
          this.sessionChecked = true;
        });

        // Force immediate logout and redirection
        window.location.replace("/login?deleted=true");
        return false;
      }

      runInAction(() => {
        this.clearAuth();
        this.sessionChecked = true; // Mark as checked even if error
      });
      return false;
    }
  }

  @action
  async getGoogleAuthUrl() {
    try {
      // Generate a code verifier for PKCE
      const codeVerifier = this.generateCodeVerifier();
      // Store it in localStorage for later use
      localStorage.setItem("codeVerifier", codeVerifier);

      // Fix: Remove /api prefix since it's already in baseURL
      const response = await axios.get("/auth/google/url", {
        params: { codeVerifier },
      });
      return response.data.authUrl;
    } catch (error) {
      console.error("Failed to get Google auth URL:", error);
      runInAction(() => {
        this.error = "Failed to initiate Google login";
      });
      throw error;
    }
  }

  // Generate a random string for code verifier according to PKCE spec
  private generateCodeVerifier(): string {
    // Generate a random string of 43-128 characters
    // Using a-z, A-Z, 0-9, and "-", ".", "_", "~"
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const length = 64; // Good balance of security and practicality
    let result = "";

    // Use crypto.getRandomValues for better randomness
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }

    return result;
  }

  @action
  async exchangeCodeForToken(code: string) {
    // If we're already authenticated, don't try to exchange the code again
    if (this.isAuthenticated) {
      console.log("Already authenticated, skipping code exchange");
      return this.user;
    }

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      // Get the code verifier we stored earlier
      const codeVerifier = localStorage.getItem("codeVerifier");

      console.log("Exchanging code for token - details:", {
        codePresent: !!code,
        codeVerifierPresent: !!codeVerifier,
      });

      if (!codeVerifier) {
        throw new Error(
          "Code verifier not found. Please try logging in again."
        );
      }

      // Save existing user data before we make the API call
      let currentPhotoURL = null;
      let currentCoverPhoto = null;

      // Get existing user data from localStorage if available
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          currentPhotoURL = userData.photoURL;
          currentCoverPhoto = userData.coverPhoto;
        } catch (e) {
          console.error("Failed to parse saved user data", e);
        }
      }

      // Make API call to exchange the code - removing /api prefix
      console.log("Making API request to /auth/google/exchange");
      const response = await axios.post("/auth/google/exchange", {
        code,
        codeVerifier,
      });

      console.log("Auth exchange response received:", {
        success: true,
        hasToken: !!response.data.token,
        hasUserData: !!response.data.user,
      });

      // Clean up the code verifier as it's no longer needed
      localStorage.removeItem("codeVerifier");

      runInAction(() => {
        this.token = response.data.token;

        // Preserve custom profile photo if we already have one
        if (response.data.user) {
          this.user = {
            ...response.data.user,
            // Only use Google's image if we don't already have one
            photoURL: currentPhotoURL || response.data.user.photoURL,
            coverPhoto: currentCoverPhoto || response.data.user.coverPhoto,
          };
        } else {
          this.user = response.data.user;
        }

        this.sessionChecked = true;
        this.loading = false;
        this.saveUserToStorage();
      });

      console.log("Authentication successful, user data stored", {
        isAuthenticated: this.isAuthenticated,
        userId: this.user?.id,
        profileComplete: this.user?.isProfileComplete,
      });

      return this.user;
    } catch (error: any) {
      // Clean up the code verifier on error
      localStorage.removeItem("codeVerifier");

      // Get error info for better handling
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error || error.message;
      const isAuthError = status === 401 || status === 403;

      // Check for specific error conditions

      // Check if user is already authenticated despite the error
      if (this.isAuthenticated) {
        console.log(
          "Auth error but already authenticated, continuing with current session",
          { status, errorMsg }
        );
        runInAction(() => {
          this.loading = false;
          this.error = null; // Clear any error since we're already logged in
        });
        return this.user;
      }

      // Check if we need to try session check as a fallback
      if (isAuthError) {
        console.log("Received auth error, trying session check as fallback");
        try {
          // Try checking the session as a fallback
          const isValidSession = await this.checkSession();
          if (isValidSession && this.isAuthenticated) {
            console.log("Session check succeeded after code exchange failure");
            return this.user;
          }
        } catch (sessionError) {
          console.error("Session check also failed:", sessionError);
        }
      }

      console.error("Code exchange error details:", {
        message: error.message,
        status,
        data: error.response?.data,
      });

      runInAction(() => {
        this.error = isAuthError
          ? "Authentication failed. Please try logging in again."
          : errorMsg || "Failed to exchange code for token";
        this.loading = false;
        this.sessionChecked = true;
      });
      console.error("Code exchange error:", error);
      throw error;
    }
  }

  @action
  async signInWithGoogle(token: string) {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      // Save existing user data before we make the API call
      let currentPhotoURL = null;
      let currentCoverPhoto = null;

      // Get existing user data from localStorage if available
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          currentPhotoURL = userData.photoURL;
          currentCoverPhoto = userData.coverPhoto;
        } catch (e) {
          console.error("Failed to parse saved user data", e);
        }
      }

      const response = await axios.post("/auth/google/signin", { token });

      runInAction(() => {
        // Preserve custom profile photo if we already have one
        if (response.data.user) {
          this.user = {
            ...response.data.user,
            // Only use Google's image if we don't already have one
            photoURL: currentPhotoURL || response.data.user.photoURL,
            coverPhoto: currentCoverPhoto || response.data.user.coverPhoto,
          };
        } else {
          this.user = response.data.user;
        }

        this.token = response.data.token;
        this.loading = false;
        this.sessionChecked = true;
        this.saveUserToStorage();
      });

      return this.user;
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error.response?.data?.error || "Failed to sign in with Google";
        this.loading = false;
        this.sessionChecked = true;
      });
      console.error("Google sign in error:", error);
      throw error;
    }
  }

  @action
  async makeUserAdmin(email: string) {
    if (!this.isAdmin) {
      runInAction(() => {
        this.error = "Only admins can make other users admin";
      });
      return false;
    }

    try {
      const response = await axios.post("/admin/make-admin", { email });
      return response.data.success;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.error || "Failed to make user admin";
      });
      console.error("Make admin error:", error);
      return false;
    }
  }

  @action
  async updateUserProfile(updates: {
    displayName?: string;
    bio?: string;
    photoURL?: string;
    coverPhoto?: string;
    isProfileComplete?: boolean;
  }) {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      console.log("Sending profile updates:", updates);
      const response = await axios.put("/users/profile", updates);
      console.log("Profile update response:", response.data);

      runInAction(() => {
        if (this.user) {
          this.user = {
            ...this.user,
            ...updates,
            ...response.data.user,
          };

          if (updates.isProfileComplete !== undefined && this.user) {
            this.user.isProfileComplete = updates.isProfileComplete;
          }

          console.log("Updated user object:", this.user);
          this.loading = false;
          this.saveUserToStorage();
        }
      });
      return true;
    } catch (error: any) {
      console.error("Profile update error:", error);
      runInAction(() => {
        this.error = error.response?.data?.error || "Failed to update profile";
        this.loading = false;
      });
      return false;
    }
  }

  @action
  async logout() {
    // Prevent unnecessary API calls during logout
    if (!this.isAuthenticated) return;

    // Store user state locally before clearing
    const hadUser = !!this.user?.id;

    // First, temporarily disable our interceptors to prevent recursion during logout
    if (this.requestInterceptorId !== null) {
      axios.interceptors.request.eject(this.requestInterceptorId);
      this.requestInterceptorId = null;
    }

    if (this.responseInterceptorId !== null) {
      axios.interceptors.response.eject(this.responseInterceptorId);
      this.responseInterceptorId = null;
    }

    this.loading = true;

    try {
      if (hadUser) {
        try {
          await axios.post("/auth/logout");
        } catch (error) {
          console.log("Logout API call failed, continuing with client logout");
        }
      }

      // Clean up client state
      runInAction(() => {
        // Clear auth data first
        this.clearAuth();
        this.loading = false;
      });

      // Disconnect socket before page reload
      socketStore.disconnect();

      // Force a page reload to clear any internal state in other stores
      // This prevents unwanted API calls from other components
      window.location.href = "/login";
    } catch (error) {
      // Ensure we still clear local state even if server logout fails
      runInAction(() => {
        this.clearAuth();
        this.loading = false;
      });
    } finally {
      // Restore interceptors (though they'll be reinitialized on page reload)
      this.setupAxiosInterceptors();
    }
  }

  get isAuthenticated() {
    return !!this.user && !!this.token;
  }

  get isAdmin() {
    return !!this.user?.isAdmin;
  }

  get isProfileComplete() {
    return !!this.user?.isProfileComplete;
  }

  /**
   * Register a callback to be called when authentication state changes
   * @param callback Function to call when auth state changes
   * @returns A disposer function to cancel the reaction
   */
  onAuthStateChange(
    callback: (isAuthenticated: boolean) => void
  ): IReactionDisposer {
    return reaction(
      () => this.isAuthenticated,
      (isAuthenticated) => {
        callback(isAuthenticated);
      },
      { fireImmediately: true }
    );
  }

  @action
  private async refreshToken(): Promise<string> {
    try {
      const response = await axios.post("/auth/refresh-token");
      const { token } = response.data;
      if (!token) {
        throw new Error("No token received from refresh");
      }
      localStorage.setItem("token", token);
      return token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw error;
    }
  }

  private setupPeriodicSessionCheck() {
    // Check session every 30 seconds when the app is in the foreground
    const checkInterval = setInterval(() => {
      // Use runInAction to safely access observables
      runInAction(() => {
        if (document.visibilityState === "visible" && this.isAuthenticated) {
          console.log(
            "Running periodic session check to detect account deletion"
          );
          this.verifyUserExists().catch((err) => {
            console.error("Periodic session check failed:", err);
          });
        }
      });
    }, 30000);

    // Clean up interval when user navigates away
    window.addEventListener("beforeunload", () => {
      clearInterval(checkInterval);
    });

    // React to visibility changes to run check when user comes back to tab
    document.addEventListener("visibilitychange", () => {
      // Use runInAction to safely access observables
      runInAction(() => {
        if (document.visibilityState === "visible" && this.isAuthenticated) {
          console.log("Tab became visible, checking account status");
          this.verifyUserExists().catch((err) => {
            console.error("Visibility change session check failed:", err);
          });
        }
      });
    });
  }

  /**
   * Verify that the user still exists in the database
   * This is a lightweight check specifically for detecting deleted accounts
   */
  async verifyUserExists() {
    // Store the observable values in local variables inside runInAction
    let isUserAuthenticated = false;
    let userId: string | undefined = undefined;

    runInAction(() => {
      isUserAuthenticated = this.isAuthenticated;
      userId = this.user?.id;
    });

    if (!isUserAuthenticated || !userId) return true;

    try {
      const response = await axios.get("/auth/session");
      if (!response.data?.user?.id) {
        console.log(
          "User account appears to be deleted (from verification check)"
        );
        runInAction(() => {
          this.clearAuth(true);
        });
        window.location.replace("/login?deleted=true");
        return false;
      }
      return true;
    } catch (error: any) {
      if (error.response?.data?.code === "USER_DELETED") {
        console.log("User account confirmed deleted by server");
        runInAction(() => {
          this.clearAuth(true);
        });
        window.location.replace("/login?deleted=true");
        return false;
      }
      // For other errors, don't assume account deletion
      console.warn("Account verification failed with error:", error);
      return true;
    }
  }
}

// Create and export a singleton instance
export const authStore = new AuthStore();

// Export the class for testing purposes
export default AuthStore;
