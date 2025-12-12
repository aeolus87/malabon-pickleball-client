import React, { useState } from "react";
import OptimizedImage from "../../../components/OptimizedImage";
import { useImageUpload } from "../hooks/useImageUpload";
import { Venue } from "../types";

interface VenueCardProps {
  venue: Venue;
  loading: boolean;
  onStatusChange: (venueId: string, currentStatus: string) => void;
  onDelete: (venueId: string, name: string) => void;
  onShowAttendees: (venue: { id: string; name: string; status: string }) => void;
  onImageUpload: (venueId: string, photoURL: string) => Promise<void>;
}

const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  loading,
  onStatusChange,
  onDelete,
  onShowAttendees,
  onImageUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const imageUpload = useImageUpload();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    imageUpload.handleFileChange(e);
  };

  const handleUpload = async () => {
    if (!imageUpload.file) return;

    setIsUploading(true);
    try {
      const photoURL = await imageUpload.uploadToCloudinary("venue_images");
      await onImageUpload(venue.id, photoURL);
      imageUpload.reset();
    } catch (error) {
      console.error("Error uploading venue image:", error);
      alert("Failed to upload venue image: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = loading || isUploading;

  return (
    <div className="group border border-gray-200 dark:border-dark-border rounded-lg shadow-sm bg-white dark:bg-dark-card hover:shadow-md transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
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
              ref={imageUpload.inputRef}
              onChange={handleImageChange}
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
            onClick={() => onStatusChange(venue.id, venue.status)}
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
          onClick={() => onShowAttendees({ id: venue.id, name: venue.name, status: venue.status })}
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
        {imageUpload.file && (
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              {imageUpload.preview && (
                <img
                  src={imageUpload.preview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                />
              )}
              <button
                onClick={handleUpload}
                className="flex-1 bg-gray-700 dark:bg-gray-800 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
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
            onClick={() => onDelete(venue.id, venue.name)}
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
  );
};

export default VenueCard;











