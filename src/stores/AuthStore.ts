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

  private preserveUserPhotos = (newUserData: User): User => {
    // Preserve custom photos when updating user data
    return {
      ...newUserData,
      photoURL: this.user?.photoURL || newUserData.photoURL,
      coverPhoto: this.user?.coverPhoto || newUserData.coverPhoto,
    };
  };

  @action
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

  @action
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

  @action
  clearError() {
    this.error = null;
  }

  @action
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
        const userData = this.preserveUserPhotos(response.data.user);
        this.user = userData;
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

  @action
  async getGoogleAuthUrl(): Promise<string> {
    try {
      const codeVerifier = this.generateCodeVerifier();
      localStorage.setItem("codeVerifier", codeVerifier);

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

  @action
  async exchangeCodeForToken(code: string): Promise<User | null> {
    if (this.isAuthenticated) {
      return this.user;
    }

    this.setLoadingState(true);

    try {
      const codeVerifier = localStorage.getItem("codeVerifier");

      if (!codeVerifier) {
        throw new Error("Code verifier not found. Please try logging in again.");
      }

      const response = await axios.post("/auth/google/exchange", {
        code,
        codeVerifier,
      });

      localStorage.removeItem("codeVerifier");

      runInAction(() => {
        const userData = this.preserveUserPhotos(response.data.user);
        this.setAuthData(response.data.token, userData);
      });

      return this.user;
    } catch (error: any) {
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

  @action
  async signInWithGoogle(token: string): Promise<User | null> {
    this.setLoadingState(true);

    try {
      const response = await axios.post("/auth/google/signin", { token });

      runInAction(() => {
        const userData = this.preserveUserPhotos(response.data.user);
        this.setAuthData(response.data.token, userData);
      });

      return this.user;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      this.setLoadingState(false, error.response?.data?.error || "Failed to sign in with Google");
      throw error;
    }
  }

  @action
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

  @action
  async updateUserProfile(updates: {
    displayName?: string;
    bio?: string;
    photoURL?: string;
    coverPhoto?: string;
    isProfileComplete?: boolean;
  }): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.put("/users/profile", updates);

      runInAction(() => {
        if (this.user) {
          this.user = {
            ...this.user,
            ...updates,
            ...response.data.user,
          };
          this.setLoadingState(false);
          this.saveUserToStorage();
        }
      });

      return true;
    } catch (error: any) {
      console.error("Profile update error:", error);
      this.setLoadingState(false, error.response?.data?.error || "Failed to update profile");
      return false;
    }
  }

  @action
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

  get isAuthenticated() {
    return !!this.user && !!this.token;
  }

  get isAdmin() {
    return !!this.user?.isAdmin;
  }

  get isProfileComplete() {
    return !!this.user?.isProfileComplete;
  }

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
