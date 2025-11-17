import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "../../stores/AuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { containsProfanity, getProfanityErrorMessage } from "../../utils/profanityFilter";
import { sanitizeFormInput, sanitizeEmail, containsDangerousPatterns } from "../../utils/securityUtils";

const RegisterPage: React.FC = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Handle redirect message from protected routes
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setError(state.message);
    }
  }, [location.state]);

  const validatePhilippinesPhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const cleaned = phone.replace(/[\s-]/g, '');
    return /^(\+639|09)\d{9}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Sanitize all inputs
    const sanitizedFirstName = sanitizeFormInput(firstName, 50);
    const sanitizedLastName = sanitizeFormInput(lastName, 50);
    const sanitizedUsername = sanitizeFormInput(username, 50);
    const sanitizedEmail = sanitizeEmail(email);
    
    // Validate profanity
    if (containsProfanity(sanitizedFirstName) || containsProfanity(sanitizedLastName) || 
        containsProfanity(sanitizedUsername)) {
      setError(getProfanityErrorMessage());
      return;
    }
    
    // Validate dangerous patterns
    if (containsDangerousPatterns(sanitizedFirstName) || containsDangerousPatterns(sanitizedLastName) ||
        containsDangerousPatterns(sanitizedUsername)) {
      setError("Input contains invalid characters");
      return;
    }
    
    if (!sanitizedEmail || !sanitizedEmail.includes("@")) {
      setError("Valid email address is required");
      return;
    }

    if (phoneNumber && !validatePhilippinesPhone(phoneNumber)) {
      setError("Phone number must be in Philippines format (+639XXXXXXXXX or 09XXXXXXXXX)");
      return;
    }

    const user = await authStore.registerLocal({
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      phoneNumber: phoneNumber.trim() || undefined,
      username: sanitizedUsername,
      password,
      email: sanitizedEmail,
    });
    
    if (user) {
      if (!user.isVerified) {
        // Clear form fields
        setFirstName("");
        setLastName("");
        setUsername("");
        setPhoneNumber("");
        setPassword("");
        // Clear auth data since user is not verified
        authStore.clearAuth();
        // Redirect to verification page with email
        navigate("/verify-email", { state: { email }, replace: true });
      } else {
        // User is verified (shouldn't happen normally, but handle it)
        navigate("/venues", { replace: true });
      }
    } else {
      setError(authStore.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center">
          <img src="/mplogos.png" alt="Malabon PickleBallers Logo" className="h-16 w-16 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create your account</h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Join the Malabon PickleBallers community</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(sanitizeFormInput(e.target.value, 50))}
              maxLength={50}
              required
            />
            <input
              className="border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(sanitizeFormInput(e.target.value, 50))}
              maxLength={50}
              required
            />
          </div>

          <input
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
            placeholder="Phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            type="tel"
          />

          <input
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(sanitizeFormInput(e.target.value, 50))}
            maxLength={50}
            required
          />

          <input
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
            type="email"
            maxLength={100}
            required
          />

          <input
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-card dark:text-gray-100"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-indigo-600 dark:bg-indigo-700 text-white font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
          >
            Create Account
          </button>
        </form>

        <div className="text-center text-sm">
          <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Already have an account? Sign in</a>
        </div>
      </div>
    </div>
  );
});

export default RegisterPage;
