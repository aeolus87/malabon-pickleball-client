import React from "react";

const MaintenancePage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 text-center dark:bg-dark-bg">
      <div className="max-w-md space-y-6">
        <div className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
          We'll be back soon
        </div>
        <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
          Malabon Pickleballers is temporarily down for maintenance while we make
          improvements. Please check back later.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Thank you for your patience - we'll reopen the app as soon as possible.
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
