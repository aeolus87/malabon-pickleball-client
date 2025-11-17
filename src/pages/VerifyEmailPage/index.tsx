import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import { authStore } from "../../stores/AuthStore";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "code-entry">("verifying");
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const emailFromState = (location.state as { email?: string })?.email;

    // If token exists, verify via token (link-based)
    if (token) {
      verifyEmailByToken(token);
    } else if (emailFromState) {
      // If email from state (redirected from registration), show code entry form
      setEmail(emailFromState);
      setStatus("code-entry");
    } else {
      // No token and no email - show code entry form
      setStatus("code-entry");
    }
  }, [searchParams, location]);

  const verifyEmailByToken = async (token: string) => {
    try {
      const response = await axios.get(`/auth/verify-email?token=${token}`);
      if (response.data.success) {
        setStatus("success");
        
        // Check if auto-login is enabled (instant verification within 5 minutes)
        if (response.data.autoLogin && response.data.token && response.data.user) {
          // Set auth data and redirect to venues immediately
          authStore.setAuthData(response.data.token, response.data.user);
          navigate("/venues", { replace: true });
        } else {
          // Delayed verification - redirect to login
          setMessage("Your email has been verified successfully! Please log in to continue.");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      }
    } catch (error: any) {
      setStatus("error");
      const errorMessage = error.response?.data?.error || "Verification failed. The link may have expired or is invalid.";
      setMessage(errorMessage);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setMessage("Please enter both email and verification code");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post("/auth/verify-email-code", { email, code });
      if (response.data.success) {
        setStatus("success");
        
        // Check if auto-login is enabled (instant verification within 5 minutes)
        if (response.data.autoLogin && response.data.token && response.data.user) {
          // Set auth data and redirect to venues immediately
          authStore.setAuthData(response.data.token, response.data.user);
          navigate("/venues", { replace: true });
        } else {
          // Delayed verification - redirect to login
          setMessage("Your email has been verified successfully! Please log in to continue.");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      }
    } catch (error: any) {
      setStatus("error");
      const errorMessage = error.response?.data?.error || "Verification failed. Please check your code and try again.";
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center">
          <img src="/mplogos.png" alt="Malabon PickleBallers Logo" className="h-16 w-16 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {status === "verifying" && "Verifying Email"}
            {status === "code-entry" && "Verify Your Email"}
            {status === "success" && "Email Verified"}
            {status === "error" && "Verification Failed"}
          </h1>
        </div>

        <div className="text-center">
          {status === "verifying" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifying your email address...
              </p>
            </div>
          )}

          {status === "code-entry" && (
            <div className="space-y-4">
              <div className="text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We've sent a verification code to your email. Please enter it below to verify your account.
                </p>
              </div>
              {message && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  {message}
                </div>
              )}
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100 text-center text-2xl font-mono tracking-widest"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 rounded-md bg-indigo-600 dark:bg-indigo-700 text-white font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Verifying..." : "Verify Email"}
                </button>
              </form>
              <div className="text-center">
                <button
                  onClick={() => navigate("/login", { replace: true })}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {message.includes("log in") ? "Redirecting to login page..." : "Redirecting to venues page..."}
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                  <svg
                    className="h-8 w-8 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
              </div>
              {email && (
                <button
                  onClick={() => {
                    setStatus("code-entry");
                    setMessage("");
                    setCode("");
                  }}
                  className="w-full py-2 rounded-md bg-indigo-600 dark:bg-indigo-700 text-white font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="w-full py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

