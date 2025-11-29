import React from "react";
import VenueCard from "./VenueCard";
import { Venue } from "../types";

interface VenueGridProps {
  venues: Venue[];
  loading: boolean;
  onStatusChange: (venueId: string, currentStatus: string) => void;
  onDelete: (venueId: string, name: string) => void;
  onShowAttendees: (venue: { id: string; name: string; status: string }) => void;
  onImageUpload: (venueId: string, photoURL: string) => Promise<void>;
}

const VenueGrid: React.FC<VenueGridProps> = ({
  venues,
  loading,
  onStatusChange,
  onDelete,
  onShowAttendees,
  onImageUpload,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Manage Venues
      </h2>

      {venues.length === 0 ? (
        <div className="p-6 border rounded-lg bg-white dark:bg-dark-card dark:border-dark-border shadow-md">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No venues available. Add your first venue using the form above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              loading={loading}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onShowAttendees={onShowAttendees}
              onImageUpload={onImageUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueGrid;







