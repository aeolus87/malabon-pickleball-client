import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../stores/AuthStore";

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [hasAttemptedExchange, setHasAttemptedExchange] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    // Add a small delay before processing to ensure backend is ready
    const processingDelay = setTimeout(() => {
      handleGoogleCallback();
    }, 300);

    return () => clearTimeout(processingDelay);
  }, [retryCount]);

  const handleGoogleCallback = async () => {
    if (hasAttemptedExchange && retryCount === 0) {
      return; // Prevent duplicate exchange attempts on first try
    }

    if (retryCount === 0) {
      setHasAttemptedExchange(true);
    }

    try {
      // First check if already authenticated
      if (authStore.isAuthenticated) {
        console.log("Already authenticated, redirecting...");
        navigateToAppropriateRoute();
        return;
      }

      // Get the code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (!code) {
        throw new Error("No authentication code received from Google");
      }

      // Exchange code for token - optimized flow without delays
      try {
        const user = await authStore.exchangeCodeForToken(code);

        if (user) {
          // Clear any previous errors
          authStore.clearError();
          navigateToAppropriateRoute();
        } else {
          throw new Error("Failed to authenticate");
        }
      } catch (error: any) {
        console.error("Error during code exchange:", error);

        // If we get a 401 error but we're still in retry attempts, try again
        if (error.response?.status === 401 && retryCount < MAX_RETRIES) {
          console.log(
            `Authentication retry attempt ${retryCount + 1}/${MAX_RETRIES}`
          );
          setRetryCount((prev) => prev + 1);
          return;
        }

        // If we get invalid_grant, check if we're already logged in
        if (authStore.isAuthenticated) {
          console.log("Already authenticated despite error, continuing...");
          navigateToAppropriateRoute();
          return;
        }

        throw error;
      }
    } catch (err) {
      console.error("Google auth callback error:", err);

      // If we've exhausted retries and still failed
      if (retryCount >= MAX_RETRIES) {
        console.log("Max retries reached, redirecting to login");
      }

      // If there's an error, navigate to login page immediately
      navigate("/login", { replace: true });
    }
  };

  // Helper function to navigate based on profile completion
  const navigateToAppropriateRoute = () => {
    if (authStore.isProfileComplete) {
      navigate("/venues", { replace: true });
    } else {
      navigate("/profile/complete", { replace: true });
    }
  };

  // Show a clean loading spinner without debug messages
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-dark-bg">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-500 dark:border-brand-400"></div>
        <img
          src="/mplogos.png"
          alt="Malabon Logo"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8"
        />
      </div>
      {retryCount > 0 && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Retrying authentication... ({retryCount}/{MAX_RETRIES})
        </p>
      )}
    </div>
  );
};

export default GoogleCallback;
