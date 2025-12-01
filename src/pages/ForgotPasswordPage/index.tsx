import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post("/auth/forgot-password", { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4">
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Check Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            If an account exists with <strong>{email}</strong>, we've sent a password reset link. 
            Check your inbox and spam folder.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            The link will expire in 1 hour.
          </p>
          <Link
            to="/login"
            className="inline-block mt-4 text-brand-600 dark:text-brand-400 hover:underline"
          >
            ← Back to Login
          </Link>
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
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-dark-card dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;






