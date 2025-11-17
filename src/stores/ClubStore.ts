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

  private setLoadingState = (loading: boolean, error: string | null = null) => {
    this.loading = loading;
    this.error = error;
  };

  private setClubMembersLoadingState = (loading: boolean, error: string | null = null) => {
    this.clubMembersLoading = loading;
    if (error) this.error = error;
  };

  async fetchClubs(): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.get("/clubs");
      
      runInAction(() => {
        this.clubs = response.data;
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, "Failed to fetch clubs");
      return false;
    }
  }

  async fetchClubsWithMemberCount(): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.get("/clubs/with-counts");
      
      runInAction(() => {
        this.clubs = response.data;
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, "Failed to fetch clubs with member counts");
      return false;
    }
  }

  async fetchClubById(clubId: string): Promise<boolean> {
    this.setLoadingState(true);

    try {
      const response = await axios.get(`/clubs/${clubId}`);
      
      runInAction(() => {
        this.currentClub = response.data;
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, "Failed to fetch club details");
      return false;
    }
  }

  async fetchClubMembers(clubId: string): Promise<boolean> {
    this.setClubMembersLoadingState(true);

    try {
      const response = await axios.get(`/clubs/${clubId}/members`);
      
      runInAction(() => {
        this.clubMembers = response.data;
        this.setClubMembersLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setClubMembersLoadingState(false, "Failed to fetch club members");
      return false;
    }
  }

  async fetchClubWithMembers(clubId: string): Promise<boolean> {
    this.setLoadingState(true);
    this.setClubMembersLoadingState(true);

    try {
      const response = await axios.get(`/clubs/${clubId}/with-members`);
      
      runInAction(() => {
        this.currentClub = response.data.club;
        this.clubMembers = response.data.members;
        this.setLoadingState(false);
        this.setClubMembersLoadingState(false);
      });

      return true;
    } catch (error: any) {
      this.setLoadingState(false, "Failed to fetch club with members");
      this.setClubMembersLoadingState(false);
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

  async submitSelectedClubs(): Promise<boolean> {
    if (!authStore.isAuthenticated) return false;

    this.setLoadingState(true);

    try {
      const response = await axios.post("/clubs/user-clubs", {
        clubIds: this.selectedClubs,
      });

      runInAction(() => {
        if (response.data.clubs && Array.isArray(response.data.clubs)) {
          this.userClubs = response.data.clubs;
        }
        this.setLoadingState(false);
      });


      return true;
    } catch (error: any) {
      console.error("Failed to save club selections:", error);
      this.setLoadingState(false, "Failed to save club selections");
      return false;
    }
  }

  async joinClub(clubId: string): Promise<boolean> {
    if (!authStore.isAuthenticated) return false;

    this.setLoadingState(true);

    try {
      const response = await axios.post(`/clubs/${clubId}/join`);

      // Update local user clubs with the response
      runInAction(() => {
        if (response.data.clubs) {
          this.userClubs = response.data.clubs;
        }
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Failed to join club:", error);
      this.setLoadingState(false, "Failed to join club");
      return false;
    }
  }

  async leaveClub(clubId: string): Promise<boolean> {
    if (!authStore.isAuthenticated) return false;

    this.setLoadingState(true);

    try {
      const response = await axios.post(`/clubs/${clubId}/leave`);

      // Update local user clubs with the response
      runInAction(() => {
        if (response.data.clubs) {
          this.userClubs = response.data.clubs;
        }
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Failed to leave club:", error);
      this.setLoadingState(false, "Failed to leave club");
      return false;
    }
  }

  async fetchUserClubs(): Promise<boolean> {
    if (!authStore.isAuthenticated) return false;

    this.setLoadingState(true);

    try {
      const response = await axios.get("/users/clubs");

      runInAction(() => {
        this.userClubs = response.data;
        this.setLoadingState(false);
      });

      return true;
    } catch (error: any) {
      console.error("Failed to fetch user clubs:", error);
      this.setLoadingState(false, "Failed to fetch your clubs");
      return false;
    }
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  getFilteredClubs(showUserClubs: boolean = false): Club[] {
    const clubList = showUserClubs ? this.userClubs : this.clubs;

    if (!this.searchQuery.trim()) {
      return clubList;
    }

      const searchLower = this.searchQuery.toLowerCase();
    return clubList.filter(
        (club) =>
          club.name.toLowerCase().includes(searchLower) ||
        (club.description && club.description.toLowerCase().includes(searchLower))
      );
  }
}

export const clubStore = new ClubStore();
