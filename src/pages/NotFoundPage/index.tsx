import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Pickleball shape */}
            <div className="w-32 h-32 rounded-full bg-green-400 dark:bg-green-500 animate-bounce shadow-lg flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-green-400 dark:bg-green-500 flex items-center justify-center text-6xl font-bold text-white">
                  404
                </div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Out of Bounds!
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Looks like your shot landed outside the court. This page is as hard to
          find as a perfect third shot drop!
        </p>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-200"
          >
            Back to Home Court
          </Link>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            "In pickleball and web browsing, staying in bounds is key."
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
