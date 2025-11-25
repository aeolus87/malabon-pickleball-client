import React, { useState } from "react";
import { PendingStatusAction } from "../types";

interface StatusConfirmModalProps {
  pendingAction: PendingStatusAction;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const StatusConfirmModal: React.FC<StatusConfirmModalProps> = ({
  pendingAction,
  onConfirm,
  onCancel,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (confirmInput.toLowerCase() !== "confirm") {
      alert("Please type 'confirm' to proceed");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      setConfirmInput("");
    }
  };

  const isConfirmValid = confirmInput.toLowerCase() === "confirm";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" aria-hidden="true" onClick={onCancel}></div>

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
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {pendingAction.currentStatus === "Available"
                    ? "Making this venue unavailable will remove all current attendees. Are you sure you want to continue?"
                    : "Making this venue available will allow users to join it. Are you sure you want to continue?"}
                </p>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="confirm-text">
                  Type "confirm" to continue
                </label>
                <input
                  type="text"
                  id="confirm-text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:bg-dark-input dark:text-gray-800 transition-shadow duration-200"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="confirm"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:text-sm transition-all duration-200 ${
                isConfirmValid && !isSubmitting
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-dark-card"
                  : "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
              }`}
              disabled={!isConfirmValid || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-transparent text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-dark-card sm:text-sm transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusConfirmModal;

