import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authStore } from "../../stores/AuthStore";
import { useTheme } from "../../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

const SuperAdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/auth/master-access", {
        username,
        password,
      });

      const { token, user } = response.data;

      authStore.setAuthData(token, user);

      navigate("/superadmin/page");
    } catch (err) {
      setError("Invalid credentials");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-300">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-gray-900/30">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Master Access
          </h2>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full px-3 py-2 mt-1 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full px-3 py-2 mt-1 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-brand-600 dark:focus:ring-offset-dark-bg transition-colors"
            >
              {loading ? "Authenticating..." : "Access Control"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
