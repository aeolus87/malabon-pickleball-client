import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";

export interface Club {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  memberCount?: number;
}

export interface ClubMember {
  _id: string;
  displayName: string | null;
  photoURL: string | null;
  email: string;
}

class ClubStore {
  clubs: Club[] = [];
  selectedClubs: string[] = [];
  loading = false;
  error: string | null = null;
  userClubs: Club[] = [];
  searchQuery: string = "";
  currentClub: Club | null = null;
  clubMembers: ClubMember[] = [];
  clubMembersLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Removed isUserInClub getter/method since we'll handle this in the component

  async fetchClubs() {
    this.loading = true;
    try {
      const response = await axios.get("/clubs");
      runInAction(() => {
        this.clubs = response.data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = "Failed to fetch clubs";
        this.loading = false;
      });
    }
  }

  async fetchClubsWithMemberCount() {
    this.loading = true;
    try {
      const response = await axios.get("/clubs/with-counts");
      runInAction(() => {
        this.clubs = response.data;
        this.loading = false;
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = "Failed to fetch clubs with member counts";
        this.loading = false;
      });
      return false;
    }
  }

  async fetchClubById(clubId: string) {
    this.loading = true;
    try {
      const response = await axios.get(`/clubs/${clubId}`);
      runInAction(() => {
        this.currentClub = response.data;
        this.loading = false;
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = "Failed to fetch club details";
        this.loading = false;
      });
      return false;
    }
  }

  async fetchClubMembers(clubId: string) {
    this.clubMembersLoading = true;
    try {
      const response = await axios.get(`/clubs/${clubId}/members`);
      runInAction(() => {
        this.clubMembers = response.data;
        this.clubMembersLoading = false;
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = "Failed to fetch club members";
        this.clubMembersLoading = false;
      });
      return false;
    }
  }

  toggleClubSelection(clubId: string) {
    if (this.selectedClubs.includes(clubId)) {
      this.selectedClubs = this.selectedClubs.filter((id) => id !== clubId);
    } else {
      this.selectedClubs.push(clubId);
    }
  }

  clearSelectedClubs() {
    this.selectedClubs = [];
  }

  setSelectedClubs(clubIds: string[]) {
    this.selectedClubs = [...clubIds];
  }

  async submitSelectedClubs() {
    // Read observable in runInAction to ensure proper reactive context
    let isUserAuthenticated = false;
    runInAction(() => {
      isUserAuthenticated = authStore.isAuthenticated;
    });

    if (!isUserAuthenticated) return false;

    this.loading = true;
    this.error = null;

    try {
      console.log("Submitting club selections to API:", this.selectedClubs);

      // Update the user's clubs
      const response = await axios.post("/clubs/user-clubs", {
        clubIds: this.selectedClubs,
      });

      console.log("Club selections saved successfully");

      // Update local userClubs from the response instead of making another call
      runInAction(() => {
        if (response.data.clubs && Array.isArray(response.data.clubs)) {
          this.userClubs = response.data.clubs;
        }
        this.loading = false;
      });

      // Update the user's profile completion status
      let isProfileComplete = false;
      runInAction(() => {
        isProfileComplete = !!authStore.user?.isProfileComplete;
      });

      if (!isProfileComplete) {
        await authStore.updateUserProfile({ isProfileComplete: true });
      }

      return true;
    } catch (error) {
      console.error("Failed to save club selections:", error);
      runInAction(() => {
        this.error = "Failed to save club selections";
        this.loading = false;
      });
      return false;
    }
  }

  async joinClub(clubId: string) {
    // Read observable in runInAction to ensure proper reactive context
    let isUserAuthenticated = false;
    runInAction(() => {
      isUserAuthenticated = authStore.isAuthenticated;
    });

    if (!isUserAuthenticated) return false;

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      await axios.post(`/clubs/${clubId}/join`);

      // Refresh the user's clubs
      await this.fetchUserClubs();

      // Set loading to false in runInAction
      runInAction(() => {
        this.loading = false;
      });

      return true;
    } catch (error) {
      console.error("Failed to join club:", error);
      runInAction(() => {
        this.error = "Failed to join club";
        this.loading = false;
      });
      return false;
    }
  }

  async leaveClub(clubId: string) {
    // Read observable in runInAction to ensure proper reactive context
    let isUserAuthenticated = false;
    runInAction(() => {
      isUserAuthenticated = authStore.isAuthenticated;
    });

    if (!isUserAuthenticated) return false;

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      await axios.post(`/clubs/${clubId}/leave`);

      // Refresh the user's clubs
      await this.fetchUserClubs();

      // Set loading to false in runInAction
      runInAction(() => {
        this.loading = false;
      });

      return true;
    } catch (error) {
      console.error("Failed to leave club:", error);
      runInAction(() => {
        this.error = "Failed to leave club";
        this.loading = false;
      });
      return false;
    }
  }

  async fetchUserClubs() {
    // Read observable in runInAction to ensure proper reactive context
    let isUserAuthenticated = false;
    runInAction(() => {
      isUserAuthenticated = authStore.isAuthenticated;
    });

    if (!isUserAuthenticated) return false;

    this.loading = true;
    try {
      // First get all clubs with member counts
      const countsResponse = await axios.get("/clubs/with-counts");
      const clubsWithCounts = countsResponse.data;

      // Then get the user profile to get their club IDs
      const profileResponse = await axios.get("/users/profile");

      let userClubs: Club[] = [];

      // Extract club IDs from the profile response
      if (
        profileResponse.data.clubs &&
        Array.isArray(profileResponse.data.clubs)
      ) {
        const clubIds = profileResponse.data.clubs.map(
          (club: Club) => club._id
        );

        // If user has clubs, filter from the clubs with counts
        if (clubIds.length > 0) {
          // Filter for just the user's clubs from the already fetched clubs with counts
          userClubs = clubsWithCounts.filter((club: Club) =>
            clubIds.includes(club._id.toString())
          );
        }
      }

      runInAction(() => {
        this.userClubs = userClubs;
        this.loading = false;
      });

      return true;
    } catch (error) {
      console.error("Failed to fetch user clubs:", error);
      runInAction(() => {
        this.error = "Failed to fetch your clubs";
        this.loading = false;
      });
      return false;
    }
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  getFilteredClubs(showUserClubs: boolean = false) {
    let filteredClubs = showUserClubs ? [...this.userClubs] : [...this.clubs];

    if (this.searchQuery.trim()) {
      const searchLower = this.searchQuery.toLowerCase();
      filteredClubs = filteredClubs.filter(
        (club) =>
          club.name.toLowerCase().includes(searchLower) ||
          (club.description &&
            club.description.toLowerCase().includes(searchLower))
      );
    }

    return filteredClubs;
  }
}

export const clubStore = new ClubStore();
