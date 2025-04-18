import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../stores/AuthStore";

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState(
    "Processing Google authentication..."
  );
  const [hasAttemptedExchange, setHasAttemptedExchange] = useState(false);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      if (hasAttemptedExchange) {
        return; // Prevent duplicate exchange attempts
      }

      setHasAttemptedExchange(true);

      try {
        setIsLoading(true);
        setDebugMsg("Getting authentication code from URL...");

        // Get the code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          throw new Error("No authentication code received from Google");
        }

        setDebugMsg("Authentication code received, exchanging for token...");

        // Exchange code for token
        try {
          const user = await authStore.exchangeCodeForToken(code);
          console.log(
            "Token exchange successful, user:",
            user ? "exists" : "null"
          );

          if (user) {
            // Clear any previous errors
            authStore.clearError();
            setDebugMsg("Authentication successful, navigating...");

            // Navigate based on profile completion status
            if (user.isProfileComplete) {
              console.log("User profile is complete, navigating to venues");
              setTimeout(() => {
                navigate("/venues", { replace: true });
              }, 100);
            } else {
              console.log(
                "User profile is incomplete, navigating to profile completion"
              );
              setTimeout(() => {
                navigate("/profile/complete", { replace: true });
              }, 100);
            }
          } else {
            throw new Error("Failed to authenticate - user object is null");
          }
        } catch (error) {
          console.error("Error during code exchange:", error);

          // If we get invalid_grant, check if we're already logged in
          if (authStore.isAuthenticated) {
            console.log(
              "Already authenticated despite exchange error, continuing..."
            );
            setDebugMsg("Already logged in, redirecting...");

            // Navigate to appropriate page
            setTimeout(() => {
              if (authStore.isProfileComplete) {
                navigate("/venues", { replace: true });
              } else {
                navigate("/profile/complete", { replace: true });
              }
            }, 100);
            return;
          }

          throw error;
        }
      } catch (err) {
        console.error("Google auth callback error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during authentication"
        );
        setDebugMsg("Authentication error, redirecting to login...");

        // If there's an error, navigate to login page after a short delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    // Call the handler when component mounts
    handleGoogleCallback();
  }, [navigate, hasAttemptedExchange]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
        {debugMsg && <p className="text-xs text-gray-400 mt-2">{debugMsg}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 p-4 rounded-md mb-4 max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Authentication Failed
          </h2>
          <p className="text-red-600">{error}</p>
          <p className="text-gray-600 mt-4">Redirecting to login page...</p>
          {debugMsg && <p className="text-xs text-gray-400 mt-2">{debugMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <p className="text-gray-600">Finalizing authentication...</p>
        {debugMsg && <p className="text-xs text-gray-400 mt-2">{debugMsg}</p>}
      </div>
    </div>
  );
};

export default GoogleCallback;
