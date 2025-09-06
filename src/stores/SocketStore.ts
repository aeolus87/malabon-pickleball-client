import { makeAutoObservable, action, runInAction } from "mobx";
import { io, Socket } from "socket.io-client";
import { authStore } from "./AuthStore";
import { venueStore } from "./VenueStore";
import { SOCKET_URL } from "../config/env";
import { clubStore } from "./ClubStore";

class SocketStore {
  socket: Socket | null = null;
  connected = false;
  connectionAttempted = false;

  constructor() {
    makeAutoObservable(this);
  }

  @action
  connect() {
    // Only attempt to connect if not already connected or attempting connection
    if (this.socket || this.connectionAttempted || !authStore.token) return;

    console.log("Socket: Attempting to connect");
    this.connectionAttempted = true;

    // Connect sockets to the configured server origin
    const socketUrl = SOCKET_URL;

    console.log("Socket: Connecting to", socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token: authStore.token,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"], // Try websocket first, then polling
      // Avoid disconnections during temporary losses of connection
      forceNew: false,
    });

    this.socket.on("connect", () => {
      console.log("Socket: Connected successfully");
      runInAction(() => {
        this.connected = true;
        this.connectionAttempted = false;
      });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket: Connection error", error);
      // If it's an auth error, clear auth and redirect to login
      if (error.message.includes("Authentication error")) {
        authStore.clearAuth();
        window.location.href = "/login";
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket: Disconnected due to", reason);
      runInAction(() => {
        this.connected = false;

        // If the server closed the connection, reset connectionAttempted to try again
        if (reason === "io server disconnect") {
          this.connectionAttempted = false;
        }
      });
    });

    // Add authentication event listeners
    this.socket.on("auth:logout", (data) => {
      console.log("Socket: Received logout event", data);
      // Check if this logout event is for the current user
      if (authStore.user && data.userId === authStore.user.id) {
        console.log("Socket: Logging out current user");
        authStore.clearAuth();
        this.disconnect();
        // Force immediate redirect to login page
        window.location.replace("/login");
      }
    });

    this.socket.on("auth:account", (data) => {
      console.log("Socket: Received account action", data);
      // Check if this event is for the current user
      if (authStore.user && data.userId === authStore.user.id) {
        // Handle different account actions
        switch (data.action) {
          case "update":
            // Refresh user data
            authStore.checkSession();
            break;
          case "warning":
            // Show warning
            alert(`Account notification: ${data.message}`);
            break;
          case "delete":
            // Handle account deletion with more aggressive approach
            console.log("Socket: Account deleted, forcing immediate logout");

            // Clear auth data with account deletion flag
            authStore.clearAuth(true);

            // Disconnect socket
            this.disconnect();

            // Use multiple approaches to ensure redirection
            try {
              // First try: Regular history based redirect
              window.location.href = "/login?deleted=true";

              // Second try: More forceful redirect
              setTimeout(() => {
                window.location.replace("/login?deleted=true");
              }, 50);

              // Third try: Hard page reload after clearing storage
              setTimeout(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }, 100);

              // Final nuclear option
              setTimeout(() => {
                document.write(
                  '<meta http-equiv="refresh" content="0;url=/login?deleted=true">'
                );
              }, 150);
            } catch (e) {
              console.error("Failed to redirect, trying alternative method", e);
              window.location.replace("/login?deleted=true");
            }
            break;
          default:
            console.log("Socket: Unknown account action", data.action);
        }
      }
    });

    // Add error handling for other socket events
    this.socket.on("error", (error) => {
      console.error("Socket: Error event received", error);
    });

    // Add reconnection handling
    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket: Reconnected after ${attemptNumber} attempts`);
      runInAction(() => {
        this.connected = true;
      });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Socket: Attempting to reconnect (${attemptNumber})`);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Socket: Reconnection error", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Socket: Failed to reconnect");
      runInAction(() => {
        this.connectionAttempted = false;
      });
    });

    this.socket.on("venue:update", (venue) => {
      runInAction(() => {
        venueStore.venues = venueStore.venues.map((v) =>
          v.id === venue.id ? venue : v
        );
      });
    });

    this.socket.on("venue:delete", (venueId) => {
      runInAction(() => {
        venueStore.venues = venueStore.venues.filter((v) => v.id !== venueId);
      });
    });

    this.socket.on("venue:attendees:update", (data) => {
      const { venueId, attendees } = data;
      runInAction(() => {
        venueStore.attendees[venueId] = attendees;
      });
    });

    this.socket.on("club:update", (club) => {
      runInAction(() => {
        // Update club in the clubs list if it exists
        const existingClubIndex = clubStore.clubs.findIndex(c => c._id === club._id);
        if (existingClubIndex !== -1) {
          clubStore.clubs[existingClubIndex] = { ...clubStore.clubs[existingClubIndex], ...club };
        }
        
        // Refresh user clubs if this affects the current user
        if (authStore.user) {
          clubStore.fetchUserClubs();
        }
      });
    });

    this.socket.on("club:delete", (clubId) => {
      runInAction(() => {
        // Remove club from clubs list
        clubStore.clubs = clubStore.clubs.filter(c => c._id !== clubId);
        
        // Remove from user's clubs if present
        clubStore.userClubs = clubStore.userClubs.filter(c => c._id !== clubId);
        
        // Remove from selected clubs if present
        clubStore.selectedClubs = clubStore.selectedClubs.filter(id => id !== clubId);
      });
    });
  }

  @action
  disconnect() {
    if (this.socket) {
      console.log("Socket: Disconnecting manually");
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
    this.connectionAttempted = false;
  }

  @action
  joinVenue(venueId: string) {
    if (this.socket && this.connected) {
      console.log("Socket: Joining venue", venueId);
      this.socket.emit("join:venue", venueId);
    } else {
      console.warn("Socket: Cannot join venue, not connected");
    }
  }

  @action
  leaveVenue(venueId: string) {
    if (this.socket && this.connected) {
      console.log("Socket: Leaving venue", venueId);
      this.socket.emit("leave:venue", venueId);
    }
  }
}

export const socketStore = new SocketStore();
