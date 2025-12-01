import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const response = await axios.get(`/auth/verify-reset-token?token=${token}`);
        if (response.data.valid) {
          setValid(true);
          setEmail(response.data.email || "");
        }
      } catch (err) {
        setValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // No token or invalid token
  if (!token || !valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4">
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Invalid or Expired Link
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block mt-4 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4">
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Password Reset!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-block mt-4 px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center">
          <img
            src="/mplogos.png"
            alt="Malabon PickleBallers Logo"
            className="h-16 w-16 mb-2"
          />
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            Reset Password
          </h2>
          {email && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              for {email}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-md dark:bg-dark-card dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-dark-card dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;






