import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { FcGoogle } from "react-icons/fc";
import { authStore } from "../../stores/AuthStore";
import { useNavigate, useLocation } from "react-router-dom";

interface LoginPageProps {
  deletedAccount?: boolean;
}

const LoginPage = observer(({ deletedAccount }: LoginPageProps = {}) => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [accountDeleted, setAccountDeleted] = useState(false);

  // Access the observables directly in the render function to make the observer HOC work properly
  // The component will now re-render when these change
  const isAuthenticated = authStore.isAuthenticated;
  const isLoading = authStore.loading;
  const authError = authStore.error;

  // Check URL query parameters for deleted account status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("deleted") === "true" || deletedAccount) {
      setAccountDeleted(true);
    }
  }, [location.search, deletedAccount]);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/venues");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const authUrl = await authStore.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate Google login:", error);
      setError("Failed to connect to Google. Please try again.");
    }
  };

  // If user is authenticated, show loading instead of login form
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center">
          <img
            src="/mplogos.png"
            alt="Malabon PickleBallers Logo"
            className="h-16 w-16 mb-2"
          />
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to Malabon PickleBallers
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to join the community
          </p>
        </div>

        {accountDeleted && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Account Deleted</strong> - Your account has been deleted.
              Please sign in with Google to create a new account.
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {authError && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300">
              {authError}
            </div>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-dark-bg focus:ring-brand-500 disabled:opacity-50 transition-colors duration-200"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
            <FcGoogle size={20} />
          </span>
          {isLoading ? "Connecting..." : "Sign in with Google"}
        </button>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
});

export default LoginPage;
