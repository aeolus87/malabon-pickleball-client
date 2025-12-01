import {
  makeAutoObservable,
  runInAction,
  reaction,
  IReactionDisposer,
} from "mobx";
import axios from "axios";
import { socketStore } from "./SocketStore";
import { userStore } from "./UserStore";

// Types for the store
export type UserRole = "player" | "coach" | "admin" | "superadmin";

export interface CoachProfile {
  bio?: string;
  specialization?: string;
  isAvailable: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  coverPhoto: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isVerified: boolean;
  bio: string | null;
  clubs: string[];
  role: UserRole;
  coachProfile?: CoachProfile;
  isPublicProfile: boolean;
}

class AuthStore {
  user: User | null = null;
  token: string | null = null;
  loading = false;
  error: string | null = null;
  sessionChecked = false;

  constructor() {
    makeAutoObservable(this);
    this.loadUserFromStorage();
    this.setupAxiosInterceptors();
  }

  private setLoadingState = (loading: boolean, error: string | null = null) => {
    this.loading = loading;
    this.error = error;
  };

  setAuthData = (token: string, userData: User) => {
    this.token = token;
    this.user = userData;
    this.sessionChecked = true;
    this.setLoadingState(false);

    // Set token in axios defaults and save to storage
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    this.saveUserToStorage();
  };

  /**
   * Syncs user data from UserStore profile updates.
   * Called by UserStore after successful profile updates.
   */
  syncUserData = (updates: Partial<User>) => {
    if (this.user) {
      this.user = {
        ...this.user,
        ...updates,
      };
      this.saveUserToStorage();
    }
  };

  private setupAxiosInterceptors() {
    // Add token to requests
    axios.interceptors.request.use((config) => {
      const token = this.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && error.response?.data?.code === "USER_DELETED") {
          this.clearAuth(true);
          window.location.replace("/login?deleted=true");
        }
        return Promise.reject(error);
      }
    );
  }

  private loadUserFromStorage() {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        this.user = JSON.parse(storedUser);
        this.token = storedToken;
        this.sessionChecked = true;
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        this.clearAuth();
      }
    }
  }

  private saveUserToStorage() {
    if (this.user && this.token) {
      localStorage.setItem("user", JSON.stringify(this.user));
      localStorage.setItem("token", this.token);
    }
  }

  private clearStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  }

  clearAuth(isAccountDeleted = false) {
    this.user = null;
    this.token = null;
    this.error = null;
    this.sessionChecked = false;

    if (isAccountDeleted) {
      localStorage.clear();
    } else {
      this.clearStorage();
    }
  }

  clearError() {
    this.error = null;
  }

  async checkSession(): Promise<boolean> {
    if (this.sessionChecked) {
      return this.isAuthenticated;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      this.clearAuth();
      this.sessionChecked = true;
      return false;
    }

    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get("/auth/session");

      if (!response.data.user) {
        this.clearAuth(true);
        this.sessionChecked = true;
        return false;
      }

      runInAction(() => {
        this.user = response.data.user;
        this.token = token;
        this.error = null;
        this.sessionChecked = true;
        this.saveUserToStorage();
      });

      return true;
    } catch (error: any) {
      console.error("Session check error:", error);

      if (error.response?.data?.code === "USER_DELETED") {
        this.clearAuth(true);
        window.location.replace("/login?deleted=true");
        return false;
      }

      this.clearAuth();
      this.sessionChecked = true;
      return false;
    }
  }

  // ============================================
  // Google OAuth
  // ============================================

  async getGoogleAuthUrl(): Promise<string> {
    try {
      // Clear any stale code verifier first
      sessionStorage.removeItem("codeVerifier");
      
      const codeVerifier = this.generateCodeVerifier();
      // Use sessionStorage to prevent cross-tab issues
      sessionStorage.setItem("codeVerifier", codeVerifier);

      const response = await axios.get("/auth/google/url", {
        params: { codeVerifier },
      });

      return response.data.authUrl;
    } catch (error) {
      console.error("Failed to get Google auth URL:", error);
      this.setLoadingState(false, "Failed to initiate Google login");
      throw error;
    }
  }

  private generateCodeVerifier(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const length = 64;
    let result = "";

    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }

    return result;
  }

  async exchangeCodeForToken(code: string): Promise<User | null> {
    if (this.isAuthenticated) {
      return this.user;
    }

    this.setLoadingState(true);

    try {
      // Try sessionStorage first (new), then localStorage (legacy fallback)
      const codeVerifier = sessionStorage.getItem("codeVerifier") || localStorage.getItem("codeVerifier");

      if (!codeVerifier) {
        throw new Error("Code verifier not found. Please try logging in again.");
      }

      const response = await axios.post("/auth/google/exchange", {
        code,
        codeVerifier,
      });

      // Clean up both storages
      sessionStorage.removeItem("codeVerifier");
      localStorage.removeItem("codeVerifier");

      runInAction(() => {
        this.setAuthData(response.data.token, response.data.user);
      });

      return this.user;
    } catch (error: any) {
      // Clean up both storages on error
      sessionStorage.removeItem("codeVerifier");
      localStorage.removeItem("codeVerifier");

      // Check if we're already authenticated despite the error
      if (this.isAuthenticated) {
        this.setLoadingState(false);
        return this.user;
      }

      console.error("Code exchange error:", error);
      this.setLoadingState(false, "Authentication failed. Please try logging in again.");
      throw error;
    }
  }

  async signInWithGoogle(token: string): Promise<User | null> {
    this.setLoadingState(true);

    try {
      const response = await axios.post("/auth/google/signin", { token });

      runInAction(() => {
        this.setAuthData(response.data.token, response.data.user);
      });

      return this.user;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      this.setLoadingState(false, error.response?.data?.error || "Failed to sign in with Google");
      throw error;
    }
  }

  // ============================================
  // Local Authentication
  // ============================================

  async registerLocal(input: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    username: string;
    password: string;
    email: string;
  }): Promise<User | null> {
    this.setLoadingState(true);
    try {
      const response = await axios.post("/auth/register", input);
      runInAction(() => {
        this.setAuthData(response.data.token, response.data.user);
      });
      return this.user;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Registration failed");
      return null;
    }
  }

  async loginWithPassword(identifier: string, password: string): Promise<User | null> {
    this.setLoadingState(true);
    try {
      const response = await axios.post("/auth/login", { identifier, password });
      runInAction(() => {
        this.setAuthData(response.data.token, response.data.user);
      });
      
      // Ensure full profile is loaded after login to get complete user data including role
      if (this.user) {
        userStore.loadProfile();
      }
      
      return this.user;
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error || "Invalid credentials";
      const email = error.response?.data?.email;

      // Preserve EMAIL_NOT_VERIFIED error code for LoginPage to handle
      if (errorCode === "EMAIL_NOT_VERIFIED") {
        const customError: any = new Error(errorMessage);
        customError.code = "EMAIL_NOT_VERIFIED";
        this.setLoadingState(false, errorMessage);
        throw customError;
      }

      // Preserve ACCOUNT_LOCKED error code for LoginPage to handle
      if (errorCode === "ACCOUNT_LOCKED") {
        const customError: any = new Error(errorMessage);
        customError.code = "ACCOUNT_LOCKED";
        customError.email = email;
        this.setLoadingState(false, errorMessage);
        throw customError;
      }

      this.setLoadingState(false, errorMessage);
      return null;
    }
  }

  async unlockAccount(email: string, code: string): Promise<User | null> {
    this.setLoadingState(true);
    try {
      const response = await axios.post("/auth/unlock", { email, code });
      // Unlock returns token + user - log them in directly
      runInAction(() => {
        this.setAuthData(response.data.token, response.data.user);
      });
      return this.user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to unlock account";
      this.setLoadingState(false, errorMessage);
      throw new Error(errorMessage);
    }
  }

  async resendUnlockCode(email: string): Promise<boolean> {
    try {
      await axios.post("/auth/resend-unlock-code", { email });
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to resend unlock code";
      throw new Error(errorMessage);
    }
  }

  // ============================================
  // Admin Operations
  // ============================================

  async makeUserAdmin(email: string): Promise<boolean> {
    if (!this.isAdmin) {
      this.setLoadingState(false, "Only admins can make other users admin");
      return false;
    }

    try {
      const response = await axios.post("/admin/make-admin", { email });
      return response.data.success;
    } catch (error: any) {
      this.setLoadingState(false, error.response?.data?.error || "Failed to make user admin");
      return false;
    }
  }

  // ============================================
  // Session Management
  // ============================================

  async logout() {
    if (!this.isAuthenticated) return;

    this.setLoadingState(true);

    try {
      await axios.post("/auth/logout");
    } catch (error) {
      console.log("Logout API call failed, continuing with client logout");
    }

    this.clearAuth();
    socketStore.disconnect();
    window.location.href = "/login";
  }

  // ============================================
  // Computed Properties
  // ============================================

  get isAuthenticated() {
    return !!this.user && !!this.token;
  }

  get isAdmin() {
    return !!this.user?.isAdmin;
  }

  // ============================================
  // Reactions
  // ============================================

  onAuthStateChange(callback: (isAuthenticated: boolean) => void): IReactionDisposer {
    return reaction(
      () => this.isAuthenticated,
      (isAuthenticated) => callback(isAuthenticated),
      { fireImmediately: true }
    );
  }
}

// Create and export a singleton instance
export const authStore = new AuthStore();

// Export the class for testing purposes
export default AuthStore;
