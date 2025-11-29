import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import { authStore } from "../../stores/AuthStore";
import { useTheme } from "../../contexts/ThemeContext";

type FontSize = "normal" | "large" | "larger";

const fontSizeOptions: { value: FontSize; label: string; description: string }[] = [
  { value: "normal", label: "Compact", description: "Smaller text" },
  { value: "large", label: "Medium", description: "Balanced size" },
  { value: "larger", label: "Large", description: "Default" },
];

const SettingsPage = observer(() => {
  const { fontSize, setFontSize, theme, toggleTheme } = useTheme();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  // Check if user uses Google login (no password)
  const isGoogleUser = !authStore.user?.email?.includes("@") || false;

  // Load email preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get("/auth/email-preferences");
        setEmailNotifications(response.data.emailNotifications);
      } catch (err) {
        console.error("Failed to load email preferences:", err);
      } finally {
        setLoadingPrefs(false);
      }
    };

    fetchPreferences();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await axios.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailPrefsChange = async (value: boolean) => {
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);

    try {
      await axios.put("/auth/email-preferences", { emailNotifications: value });
      setEmailNotifications(value);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err: any) {
      setEmailError(err.response?.data?.error || "Failed to update preferences");
      // Revert on error
      setEmailNotifications(!value);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

        {/* Display Settings Section */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Display
          </h2>

          {/* Font Size */}
          <div className="mb-6">
            <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2">
              Text Size
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Choose a comfortable text size for better readability
            </p>
            <div className="grid grid-cols-3 gap-3">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    fontSize === option.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span
                    className={`block font-semibold mb-1 ${
                      fontSize === option.value
                        ? "text-brand-700 dark:text-brand-300"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                    style={{
                      fontSize: option.value === "normal" ? "1rem" : option.value === "large" ? "1.125rem" : "1.25rem"
                    }}
                  >
                    Aa
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 block">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Dark Mode
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark themes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={toggleTheme}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Change Password
          </h2>

          {isGoogleUser ? (
            <p className="text-gray-600 dark:text-gray-400">
              You signed in with Google. Password change is not available for Google accounts.
            </p>
          ) : (
            <>
              {passwordSuccess && (
                <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/30 p-3 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Password changed successfully
                  </p>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md dark:bg-dark-muted dark:border-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border rounded-md dark:bg-dark-muted dark:border-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md dark:bg-dark-muted dark:border-gray-700 dark:text-gray-100"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.
                </p>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Email Preferences Section */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Email Preferences
          </h2>

          {loadingPrefs ? (
            <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          ) : (
            <>
              {emailSuccess && (
                <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/30 p-3 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Preferences saved
                  </p>
                </div>
              )}

              {emailError && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{emailError}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Session Confirmations
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive email confirmations when you join sessions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => handleEmailPrefsChange(e.target.checked)}
                    disabled={emailLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Account Information
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span>{" "}
              {authStore.user?.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">Display Name:</span>{" "}
              {authStore.user?.displayName || "Not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SettingsPage;

