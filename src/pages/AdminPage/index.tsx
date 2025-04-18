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
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    venueId: string;
    currentStatus: string;
  } | null>(null);
  const [expandedVenues, setExpandedVenues] = useState<Record<string, boolean>>(
    {}
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingVenueImage, setEditingVenueImage] = useState<{
    venueId: string;
    file: File | null;
  } | null>(null);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

  const navigate = useNavigate();
  const newVenueImageInputRef = useRef<HTMLInputElement>(null);
  const editVenueImageInputRef = useRef<HTMLInputElement>(null);

  // Join all expanded venue rooms for real-time updates
  useEffect(() => {
    Object.entries(expandedVenues).forEach(([venueId, isExpanded]) => {
      if (isExpanded) {
        socketStore.joinVenue(venueId);
      } else {
        socketStore.leaveVenue(venueId);
      }
    });

    return () => {
      Object.keys(expandedVenues).forEach((venueId) => {
        socketStore.leaveVenue(venueId);
      });
    };
  }, [expandedVenues]);

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

  const toggleExpandVenue = async (venueId: string) => {
    if (!expandedVenues[venueId]) {
      // Fetch attendees details only when expanding
      await venueStore.getVenueAttendees(venueId);
      // Join the venue room
      socketStore.joinVenue(venueId);
    } else {
      // Leave the venue room
      socketStore.leaveVenue(venueId);
    }

    setExpandedVenues((prev) => ({
      ...prev,
      [venueId]: !prev[venueId],
    }));
  };

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
      };

      const success = await venueStore.createVenue(venueData);

      if (!success) {
        throw new Error("Failed to create venue");
      }

      // Reset form
      setNewVenueName("");
      setNewVenueStatus("Available");
      setNewVenueImage(null);
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

  if (loading || venueStore.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 dark:border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-black transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Admin Dashboard
      </h1>

      {/* Add new venue form */}
      <div className="mb-12 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md dark:shadow-lg dark:border dark:border-gray-800">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
          Add New Venue
        </h2>
        <form onSubmit={handleAddVenue} className="space-y-6">
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
            {imagePreview && !editingVenueId && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-48 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-gray-700 dark:bg-gray-800 text-white px-5 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-900 transition shadow-sm font-medium"
            disabled={venueStore.loading}
          >
            {venueStore.loading ? "Adding..." : "Add Venue"}
          </button>
        </form>
      </div>

      {/* Venues list */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Manage Venues
          </h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-600 mr-2"></span>
              <span className="text-base text-gray-700 dark:text-gray-300">
                Available
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
              <span className="text-base text-gray-700 dark:text-gray-300">
                Unavailable
              </span>
            </div>
          </div>
        </div>
      </div>

      {venueStore.venues.length === 0 ? (
        <div className="p-6 border rounded-lg bg-white dark:bg-dark-card dark:border-dark-border shadow-md">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No venues available. Add your first venue using the form above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venueStore.venues.map((venue) => (
            <div
              key={venue.id}
              className="border border-gray-200 dark:border-dark-border rounded-md shadow-sm bg-white dark:bg-dark-card hover:shadow transition-shadow duration-200 overflow-hidden"
            >
              {/* Venue image with edit button */}
              <div className="relative group h-48 w-full">
                <OptimizedImage
                  src={venue.photoURL || ""}
                  alt={`${venue.name} venue`}
                  className="w-full h-full"
                  fallbackText={venue.name}
                />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer bg-white/90 dark:bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-medium shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200">
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

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 truncate">
                    {venue.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => initStatusChange(venue.id, venue.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        venue.status === "Available"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {venue.status}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => toggleExpandVenue(venue.id)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                      {expandedVenues[venue.id] ? "Hide" : "Show"} Attendees
                    </span>
                    <span
                      className={`ml-2 text-xs rounded-full px-2 py-1 ${
                        venue.status === "Available"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {venue.attendees?.length || 0}
                    </span>
                  </button>

                  {expandedVenues[venue.id] && (
                    <div className="mt-3 bg-gray-50 dark:bg-dark-muted rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
                      <div className="px-4 py-2 bg-gray-100 dark:bg-dark-input border-b border-gray-200 dark:border-dark-border">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Attendees (
                          {venueStore.attendees[venue.id]?.length || 0})
                        </h4>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {venueStore.attendees[venue.id] &&
                        venueStore.attendees[venue.id].length > 0 ? (
                          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                            {venueStore.attendees[venue.id].map((attendee) => (
                              <li key={attendee.id} className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  <Avatar
                                    src={attendee.photoURL}
                                    name={attendee.displayName}
                                    alt={attendee.displayName || "Attendee"}
                                    size="sm"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {attendee.displayName || "Anonymous"}
                                    </p>
                                    {attendee.email && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {attendee.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {venue.status === "Available"
                                ? "No attendees yet"
                                : "Venue is unavailable"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Only show upload button when an image is selected for this venue */}
                {editingVenueId === venue.id && editingVenueImage?.file && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                    <div className="flex items-center space-x-2">
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      )}
                      <button
                        onClick={() => handleUploadVenueImage(venue.id)}
                        className="flex-1 bg-gray-700 dark:bg-gray-800 text-white px-3 py-2 text-sm rounded-md hover:bg-gray-800 dark:hover:bg-gray-900 transition"
                        disabled={venueStore.loading}
                      >
                        {venueStore.loading ? "Uploading..." : "Upload Image"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <button
                    onClick={() => handleDeleteVenue(venue.id, venue.name)}
                    className="flex-1 bg-red-600 dark:bg-red-700 text-white px-4 py-2 text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition font-medium"
                  >
                    Delete Venue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full shadow-xl dark:border dark:border-dark-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Change Status Confirmation
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {pendingAction?.currentStatus === "Available"
                ? "Making this venue unavailable will remove all current attendees. Are you sure you want to continue?"
                : "Making this venue available will allow users to join it. Are you sure you want to continue?"}
            </p>
            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                htmlFor="confirm-text"
              >
                Type "confirm" to continue
              </label>
              <input
                type="text"
                id="confirm-text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-dark-input dark:text-gray-200"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="confirm"
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 rounded-md text-white transition ${
                  confirmInput.toLowerCase() === "confirm"
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                    : "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                }`}
                disabled={confirmInput.toLowerCase() !== "confirm"}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AdminPage;
