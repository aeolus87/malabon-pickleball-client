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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [idleLogout, setIdleLogout] = useState(false);
  
  // Account lockout state
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState("");
  const [unlockCode, setUnlockCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Access the observables directly in the render function to make the observer HOC work properly
  // The component will now re-render when these change
  const isAuthenticated = authStore.isAuthenticated;
  const isLoading = authStore.loading;
  const authError = authStore.error;

  // Check URL query parameters and sessionStorage for deleted account or idle logout status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("deleted") === "true" || deletedAccount) {
      setAccountDeleted(true);
    }
    // Check both URL param and sessionStorage for idle logout
    if (params.get("idle") === "true" || sessionStorage.getItem("idleLogout") === "true") {
      setIdleLogout(true);
      sessionStorage.removeItem("idleLogout"); // Clear flag after reading
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const user = await authStore.loginWithPassword(identifier.trim(), password);
      if (user) navigate("/venues");
    } catch (err: any) {
      console.error(err);
      // Check if error is EMAIL_NOT_VERIFIED
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email before logging in. Check your inbox for the verification code.");
      } else if (err.code === "ACCOUNT_LOCKED") {
        setIsAccountLocked(true);
        setLockedEmail(err.email || identifier);
        // Don't store password - user will re-enter after unlock
        setError(null);
      } else {
        setError(err.message || "Invalid username or password");
      }
    }
  };

  const handleUnlockAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const user = await authStore.unlockAccount(lockedEmail, unlockCode);
      
      // Unlock successful - user is now logged in, redirect
      if (user) {
        // Set flag to show password change modal on venues page
        sessionStorage.setItem("showPasswordChangeModal", "true");
        navigate("/venues");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to unlock account";
      
      // If account is not locked (lockout expired), reset to login form
      if (errorMessage.toLowerCase().includes("not locked")) {
        setIsAccountLocked(false);
        setUnlockCode("");
        setError("Your lockout has expired. Please try logging in again.");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleResendUnlockCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setError(null);
      await authStore.resendUnlockCode(lockedEmail);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend unlock code");
    }
  };

  const handleBackToLogin = () => {
    setIsAccountLocked(false);
    setUnlockCode("");
    setError(null);
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If user is authenticated, show loading while redirecting
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

        {idleLogout && (
          <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              You were logged out due to inactivity
            </p>
          </div>
        )}

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
              {error.includes("verify your email") && (
                <div className="mt-2">
                  <button
                    onClick={() => navigate("/verify-email", { state: { email: identifier } })}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Go to verification page →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {authError && !isAccountLocked && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300">
              {authError}
            </div>
          </div>
        )}

        {isAccountLocked ? (
          <>
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800 mb-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                <strong>Account Locked</strong> - Too many failed login attempts.
                <br />
                We've sent an unlock code to <strong>{lockedEmail}</strong>.
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleUnlockAccount}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter 6-digit unlock code
                </label>
                <input
                  type="text"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border rounded-md dark:bg-dark-card dark:border-gray-700 text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || unlockCode.length !== 6}
                className="w-full py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Unlocking..." : "Unlock Account"}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handleBackToLogin}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                ← Back to login
              </button>
              <button
                onClick={handleResendUnlockCode}
                disabled={resendCooldown > 0}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </>
        ) : (
          <>
            <form className="space-y-3" onSubmit={handlePasswordLogin}>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Username"
                className="w-full px-3 py-2 border rounded-md dark:bg-dark-card dark:border-gray-700"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 border rounded-md dark:bg-dark-card dark:border-gray-700"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 dark:text-gray-400">or</div>

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

            <div className="text-center mt-2 text-sm space-y-1">
              <a href="/forgot-password" className="text-gray-500 dark:text-gray-400 hover:underline block">
                Forgot password?
              </a>
              <a href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline block">
                Create an account
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default LoginPage;
