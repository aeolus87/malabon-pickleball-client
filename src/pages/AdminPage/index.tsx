import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { venueStore } from "../../stores/VenueStore";
import { authStore } from "../../stores/AuthStore";
import { socketStore } from "../../stores/SocketStore";

import AddVenueForm from "./components/AddVenueForm";
import VenueGrid from "./components/VenueGrid";
import AttendeesModal from "./components/AttendeesModal";
import StatusConfirmModal from "./components/StatusConfirmModal";
import { PendingStatusAction, SelectedVenue, Attendee } from "./types";

const AdminPage: React.FC = observer(() => {
  const isAdmin = authStore.isAdmin;
  const isAuthenticated = authStore.isAuthenticated;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [selectedVenueForAttendees, setSelectedVenueForAttendees] = useState<SelectedVenue | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingStatusAction | null>(null);

  // Initialize page
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        await authStore.checkSession();

        if (!authStore.isAuthenticated) {
          navigate("/login");
          return;
        }

        if (!authStore.isAdmin) {
          navigate("/");
          return;
        }

        await venueStore.fetchVenues();
      } catch (error) {
        console.error("Failed to initialize admin page:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [navigate, isAuthenticated, isAdmin]);

  // Handlers
  const handleAddVenue = async (data: {
    name: string;
    status: string;
    photoURL?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const success = await venueStore.createVenue(data);
    if (!success) {
      throw new Error("Failed to create venue");
    }
  };

  const handleStatusChange = (venueId: string, currentStatus: string) => {
    setPendingAction({ venueId, currentStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingAction) return;

    try {
      const newStatus = pendingAction.currentStatus === "Available" ? "Unavailable" : "Available";
      const success = await venueStore.updateVenueStatus(pendingAction.venueId, newStatus);

      if (success && newStatus === "Unavailable") {
        await venueStore.removeAllAttendees(pendingAction.venueId);
      }

      setPendingAction(null);
    } catch (error) {
      console.error("Error updating venue status:", error);
      alert("Failed to update venue status. Please check your permissions.");
    }
  };

  const handleCancelStatusChange = () => {
    setPendingAction(null);
  };

  const handleDeleteVenue = async (venueId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await venueStore.deleteVenue(venueId);
      } catch (error) {
        console.error("Error deleting venue:", error);
        alert("Failed to delete venue. Please check your permissions.");
      }
    }
  };

  const handleShowAttendees = async (venue: SelectedVenue) => {
    await venueStore.getVenueAttendees(venue.id);
    setSelectedVenueForAttendees(venue);
    socketStore.joinVenue(venue.id);
  };

  const handleCloseAttendeesModal = () => {
    if (selectedVenueForAttendees) {
      socketStore.leaveVenue(selectedVenueForAttendees.id);
    }
    setSelectedVenueForAttendees(null);
  };

  const handleImageUpload = async (venueId: string, photoURL: string) => {
    await axios.put(`/venues/${venueId}/photo`, { photoURL });
    await venueStore.fetchVenues();
  };

  // Loading state
  if (loading || venueStore.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 dark:border-gray-300"></div>
      </div>
    );
  }

  // Stats
  const totalVenues = venueStore.venues.length;
  const availableVenues = venueStore.venues.filter((v) => v.status === "Available").length;
  const unavailableVenues = totalVenues - availableVenues;

  // Get attendees for selected venue
  const currentAttendees: Attendee[] = selectedVenueForAttendees
    ? venueStore.attendees[selectedVenueForAttendees.id] || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Venues:</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalVenues}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-600 mr-2"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Available ({availableVenues})</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Unavailable ({unavailableVenues})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddVenueForm onSubmit={handleAddVenue} loading={venueStore.loading} />

        <VenueGrid
          venues={venueStore.venues}
          loading={venueStore.loading}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteVenue}
          onShowAttendees={handleShowAttendees}
          onImageUpload={handleImageUpload}
        />
      </main>

      {/* Modals */}
      {selectedVenueForAttendees && (
        <AttendeesModal
          venue={selectedVenueForAttendees}
          attendees={currentAttendees}
          onClose={handleCloseAttendeesModal}
        />
      )}

      {pendingAction && (
        <StatusConfirmModal
          pendingAction={pendingAction}
          onConfirm={handleConfirmStatusChange}
          onCancel={handleCancelStatusChange}
        />
      )}
    </div>
  );
});

export default AdminPage;
