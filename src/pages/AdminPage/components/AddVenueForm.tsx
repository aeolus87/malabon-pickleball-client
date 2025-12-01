import React, { useState, FormEvent } from "react";
import { useImageUpload } from "../hooks/useImageUpload";

// Temporary feature flag: hide manual location inputs
const SHOW_LOCATION_FIELDS = false;

interface AddVenueFormProps {
  onSubmit: (data: {
    name: string;
    status: string;
    photoURL?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  loading: boolean;
}

const AddVenueForm: React.FC<AddVenueFormProps> = ({ onSubmit, loading }) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Available");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageUpload = useImageUpload();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a venue name");
      return;
    }

    setIsSubmitting(true);

    try {
      let photoURL: string | undefined;

      if (imageUpload.file) {
        photoURL = await imageUpload.uploadToCloudinary("venue_images");
      }

      await onSubmit({
        name,
        status,
        photoURL,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      // Reset form on success
      setName("");
      setStatus("Available");
      setLatitude("");
      setLongitude("");
      imageUpload.reset();
    } catch (error) {
      console.error("Error adding venue:", error);
      alert("Failed to add venue: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  id="venueName"
                  placeholder="Enter venue name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="venueStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Status
                </label>
                <select
                  id="venueStatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100"
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label htmlFor="venueImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Image (Optional)
                </label>
                <input
                  type="file"
                  id="venueImage"
                  ref={imageUpload.inputRef}
                  accept="image/*"
                  onChange={imageUpload.handleFileChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition dark:bg-zinc-800 dark:text-gray-200"
                />
              </div>

              {SHOW_LOCATION_FIELDS && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="venueLatitude" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Latitude (Optional)
                    </label>
                    <input
                      type="number"
                      id="venueLatitude"
                      placeholder="e.g., 14.5995"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="venueLongitude" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Longitude (Optional)
                    </label>
                    <input
                      type="number"
                      id="venueLongitude"
                      placeholder="e.g., 120.9842"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-800 rounded-md focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all duration-200 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gray-700 dark:bg-gray-800 text-white px-5 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-900 transition shadow-sm font-medium flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
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
              {imageUpload.preview ? (
                <img src={imageUpload.preview} alt="Preview" className="w-full h-full object-cover" />
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
                  {name || "Venue Name"}
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status === "Available"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {status}
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
  );
};

export default AddVenueForm;









