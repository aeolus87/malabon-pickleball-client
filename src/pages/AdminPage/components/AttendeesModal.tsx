import React from "react";
import Avatar from "../../../components/Avatar";
import { Attendee, SelectedVenue } from "../types";

interface AttendeesModalProps {
  venue: SelectedVenue;
  attendees: Attendee[];
  onClose: () => void;
}

const AttendeesModal: React.FC<AttendeesModalProps> = ({ venue, attendees, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-dark-card rounded-xl w-full max-w-2xl transform transition-all sm:w-full sm:mx-auto shadow-xl dark:border dark:border-dark-border overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {venue.name} - Attendees
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  venue.status === "Available"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {venue.status}
                </span>
              </div>
              <button
                onClick={onClose}
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
            {attendees.length > 0 ? (
              <div className="space-y-4">
                {attendees.map((attendee) => (
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
                  {venue.status === "Available" ? "No attendees yet" : "Venue is currently unavailable"}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeesModal;









