import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { venueStore } from "../../stores/VenueStore";
import { authStore } from "../../stores/AuthStore";
import { socketStore } from "../../stores/SocketStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import OptimizedImage from "../../components/OptimizedImage";
import Avatar from "../../components/Avatar";

const AdminPage: React.FC = observer(() => {
  // Add explicit access to MobX observables in component body for proper tracking
  const isAdmin = authStore.isAdmin;
  const isAuthenticated = authStore.isAuthenticated;

  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueStatus, setNewVenueStatus] = useState("Available");
  const [newVenueImage, setNewVenueImage] = useState<File | null>(null);
  const [newVenueLatitude, setNewVenueLatitude] = useState("");
  const [newVenueLongitude, setNewVenueLongitude] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    venueId: string;
    currentStatus: string;
  } | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingVenueImage, setEditingVenueImage] = useState<{
    venueId: string;
    file: File | null;
  } | null>(null);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [selectedVenueForAttendees, setSelectedVenueForAttendees] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);

  const navigate = useNavigate();
  const newVenueImageInputRef = useRef<HTMLInputElement>(null);
  const editVenueImageInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        console.log("Admin page init: starting session check");
        // First, check if the session is valid and user is admin
        await authStore.checkSession();
        console.log(
          "Admin page init: isAuthenticated =",
          authStore.isAuthenticated
        );

        // Check admin status using local variable that references the observable
        if (!isAuthenticated) {
          console.log(
            "Admin page init: Not authenticated, redirecting to login"
          );
          navigate("/login");
          return;
        }

        if (!isAdmin) {
          console.log("Admin page init: Not admin, redirecting to home");
          navigate("/");
          return;
        }

        console.log("Admin page init: Starting venue fetch");
        // Load venues
        try {
          await venueStore.fetchVenues();
          console.log("Admin page init: Venues fetched successfully");
        } catch (venueError) {
          console.error("Admin page init: Error fetching venues:", venueError);
        }
      } catch (error) {
        console.error("Failed to initialize admin page:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [navigate, isAuthenticated, isAdmin]);



  const initStatusChange = (id: string, status: string) => {
    setPendingAction({ venueId: id, currentStatus: status });
    setShowConfirmModal(true);
    setConfirmInput("");
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingAction) return;

    if (confirmInput.toLowerCase() !== "confirm") {
      alert("Please type 'confirm' to proceed");
      return;
    }

    try {
      const newStatus =
        pendingAction.currentStatus === "Available"
          ? "Unavailable"
          : "Available";

      // Update venue status
      const success = await venueStore.updateVenueStatus(
        pendingAction.venueId,
        newStatus
      );

      // If changing to unavailable, clear all attendees
      if (success && newStatus === "Unavailable") {
        await venueStore.removeAllAttendees(pendingAction.venueId);
      }

      setShowConfirmModal(false);
      setConfirmInput("");
      setPendingAction(null);
    } catch (error) {
      console.error("Error updating venue status:", error);
      alert("Failed to update venue status. Please check your permissions.");
    }
  };

  const handleNewVenueImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setNewVenueImage(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditVenueImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    venueId: string
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setEditingVenueImage({
        venueId,
        file: file,
      });
      setEditingVenueId(venueId);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) {
      alert("Please enter a venue name");
      return;
    }

    try {
      setLoading(true);

      let photoURL: string | undefined;

      // Upload image to Cloudinary if provided
      if (newVenueImage) {
        const CLOUDINARY_UPLOAD_PRESET = import.meta.env
          .VITE_CLOUDINARY_UPLOAD_PRESET;
        const CLOUDINARY_CLOUD_NAME = import.meta.env
          .VITE_CLOUDINARY_CLOUD_NAME;

        if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
          throw new Error("Cloudinary credentials not found");
        }

        const formData = new FormData();
        formData.append("file", newVenueImage);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "venue_images");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image to Cloudinary");
        }

        const data = await response.json();
        photoURL = data.secure_url;
      }

      // Create venue with image URL if uploaded
      const venueData = {
        name: newVenueName,
        status: newVenueStatus,
        photoURL,
        latitude: newVenueLatitude ? parseFloat(newVenueLatitude) : undefined,
        longitude: newVenueLongitude ? parseFloat(newVenueLongitude) : undefined,
      };

      const success = await venueStore.createVenue(venueData);

      if (!success) {
        throw new Error("Failed to create venue");
      }

      // Reset form
      setNewVenueName("");
      setNewVenueStatus("Available");
      setNewVenueImage(null);
      setNewVenueLatitude("");
      setNewVenueLongitude("");
      setImagePreview(null);
      if (newVenueImageInputRef.current) {
        newVenueImageInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error adding venue:", error);
      alert(
        "Failed to add venue: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVenueImage = async (venueId: string) => {
    if (!editingVenueImage?.file) {
      alert("Please select an image first");
      return;
    }

    try {
      setLoading(true);

      // Get Cloudinary credentials
      const CLOUDINARY_UPLOAD_PRESET = import.meta.env
        .VITE_CLOUDINARY_UPLOAD_PRESET;
      const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

      if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
        throw new Error("Cloudinary credentials not found");
      }

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", editingVenueImage.file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "venue_images");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const data = await response.json();
      const photoURL = data.secure_url;

      // Update venue with new image URL
      await axios.put(`/venues/${venueId}/photo`, { photoURL });

      // Update local state
      const updatedVenues = [...venueStore.venues];
      const venueIndex = updatedVenues.findIndex((v) => v.id === venueId);
      if (venueIndex !== -1) {
        updatedVenues[venueIndex].photoURL = photoURL;
      }

      // Reset the editing state
      setEditingVenueImage(null);
      setEditingVenueId(null);
      setImagePreview(null);
      if (editVenueImageInputRef.current) {
        editVenueImageInputRef.current.value = "";
      }

      // Refresh venues to get updated data
      await venueStore.fetchVenues();
    } catch (error) {
      console.error("Error uploading venue image:", error);
      alert(
        "Failed to upload venue image: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenue = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await venueStore.deleteVenue(id);
      } catch (error) {
        console.error("Error deleting venue:", error);
        alert("Failed to delete venue. Please check your permissions.");
      }
    }
  };

  const handleShowAttendees = async (venue: { id: string; name: string; status: string }) => {
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

  if (loading || venueStore.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 dark:border-gray-300"></div>
      </div>
    );
  }

  const totalVenues = venueStore.venues.length;
  const availableVenues = venueStore.venues.filter(v => v.status === "Available").length;
  const unavailableVenues = totalVenues - availableVenues;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Enhanced Header Section */}
      <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Venues:</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalVenues}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-600 mr-2"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Available ({availableVenues})
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Unavailable ({unavailableVenues})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add new venue form */}
        <div className="mb-12 bg-white dark:bg-zinc-900 rounded-lg shadow-md dark:shadow-lg dark:border dark:border-gray-800">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Form Column */}
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Venue
              </h2>
              <form onSubmit={handleAddVenue} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="venueName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Venue Name
                    </label>
                    <input
                      type="text"
                      id="venueName"
                      placeholder="Enter venue name"
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="venueStatus"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Status
                    </label>
                    <select
                      id="venueStatus"
                      value={newVenueStatus}
                      onChange={(e) => setNewVenueStatus(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100"
                    >
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="venueImage"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Venue Image (Optional)
                    </label>
                    <input
                      type="file"
                      id="venueImage"
                      ref={newVenueImageInputRef}
                      accept="image/*"
                      onChange={handleNewVenueImageChange}
                      className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition dark:bg-zinc-800 dark:text-gray-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="venueLatitude"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Latitude (Optional)
                      </label>
                      <input
                        type="number"
                        id="venueLatitude"
                        placeholder="e.g., 14.5995"
                        step="any"
                        value={newVenueLatitude}
                        onChange={(e) => setNewVenueLatitude(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="venueLongitude"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                      >
                        Longitude (Optional)
                      </label>
                      <input
                        type="number"
                        id="venueLongitude"
                        placeholder="e.g., 120.9842"
                        step="any"
                        value={newVenueLongitude}
                        onChange={(e) => setNewVenueLongitude(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-700 dark:bg-gray-800 text-white px-5 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-900 transition shadow-sm font-medium flex items-center justify-center"
                  disabled={venueStore.loading}
                >
                  {venueStore.loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    "Add Venue"
                  )}
                </button>
              </form>
            </div>

            {/* Preview Column */}
            <div className="p-6 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Preview</h3>
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="h-48 bg-gray-100 dark:bg-zinc-800 relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      {newVenueName || "Venue Name"}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      newVenueStatus === "Available"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {newVenueStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Preview of how the venue card will appear
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venues list */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Manage Venues
          </h2>

          {venueStore.venues.length === 0 ? (
            <div className="p-6 border rounded-lg bg-white dark:bg-dark-card dark:border-dark-border shadow-md">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No venues available. Add your first venue using the form above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venueStore.venues.map((venue) => (
                <div
                  key={venue.id}
                  className="group border border-gray-200 dark:border-dark-border rounded-lg shadow-sm bg-white dark:bg-dark-card hover:shadow-md transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Venue image with edit button */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <OptimizedImage
                      src={venue.photoURL || ""}
                      alt={`${venue.name} venue`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallbackText={venue.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <label className="cursor-pointer bg-white/90 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-md text-sm font-medium shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          ref={editVenueImageInputRef}
                          onChange={(e) => handleEditVenueImageChange(e, venue.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {venue.name}
                      </h3>
                      <button
                        onClick={() => initStatusChange(venue.id, venue.status)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                          venue.status === "Available"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/50"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {venue.status}
                      </button>
                    </div>

                    <button
                      onClick={() => handleShowAttendees(venue)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Attendees
                      </span>
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        venue.status === "Available"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {venue.attendees?.length || 0}
                      </span>
                    </button>

                    {/* Image upload preview */}
                    {editingVenueId === venue.id && editingVenueImage?.file && (
                      <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                        <div className="flex items-center gap-3">
                          {imagePreview && (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                            />
                          )}
                          <button
                            onClick={() => handleUploadVenueImage(venue.id)}
                            className="flex-1 bg-gray-700 dark:bg-gray-800 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center gap-2"
                            disabled={venueStore.loading}
                          >
                            {venueStore.loading ? (
                              <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload Image
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                      <button
                        onClick={() => handleDeleteVenue(venue.id, venue.name)}
                        className="w-full bg-red-600 dark:bg-red-700 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Venue
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendees Modal */}
        {selectedVenueForAttendees && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" aria-hidden="true"></div>

              <div className="relative bg-white dark:bg-dark-card rounded-xl w-full max-w-2xl transform transition-all sm:w-full sm:mx-auto shadow-xl dark:border dark:border-dark-border overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {selectedVenueForAttendees.name} - Attendees
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedVenueForAttendees.status === "Available"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {selectedVenueForAttendees.status}
                      </span>
                    </div>
                    <button
                      onClick={handleCloseAttendeesModal}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4">
                  {venueStore.attendees[selectedVenueForAttendees.id]?.length > 0 ? (
                    <div className="space-y-4">
                      {venueStore.attendees[selectedVenueForAttendees.id].map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        >
                          <Avatar
                            src={attendee.photoURL}
                            name={attendee.displayName}
                            alt={attendee.displayName || "Attendee"}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {attendee.displayName || "Anonymous"}
                            </p>
                            {attendee.email && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {attendee.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">
                        {selectedVenueForAttendees.status === "Available"
                          ? "No attendees yet"
                          : "Venue is currently unavailable"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-right">
                  <button
                    onClick={handleCloseAttendeesModal}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" aria-hidden="true"></div>

              <div className="relative bg-white dark:bg-dark-card rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6 dark:border dark:border-dark-border">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                      Change Status Confirmation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pendingAction?.currentStatus === "Available"
                          ? "Making this venue unavailable will remove all current attendees. Are you sure you want to continue?"
                          : "Making this venue available will allow users to join it. Are you sure you want to continue?"}
                      </p>
                    </div>
                    <div className="mt-4">
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        htmlFor="confirm-text"
                      >
                        Type "confirm" to continue
                      </label>
                      <input
                        type="text"
                        id="confirm-text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:bg-dark-input dark:text-gray-200 transition-shadow duration-200"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        placeholder="confirm"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmStatusChange}
                    className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:text-sm transition-all duration-200 ${
                      confirmInput.toLowerCase() === "confirm"
                        ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-dark-card"
                        : "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                    }`}
                    disabled={confirmInput.toLowerCase() !== "confirm"}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingAction(null);
                    }}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-transparent text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-dark-card sm:text-sm transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

export default AdminPage;
