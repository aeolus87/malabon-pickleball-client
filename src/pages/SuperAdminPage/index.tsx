import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authStore } from "../../stores/AuthStore";
import { observer } from "mobx-react-lite";
import Avatar from "../../components/Avatar";

interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
}

const SuperAdminPage: React.FC = observer(() => {
  // Access MobX observable directly in the component body for proper tracking
  const user = authStore.user;
  const isSuperAdmin = user?.isSuperAdmin;

  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is super admin
    if (!isSuperAdmin) {
      navigate("/");
      return;
    }

    fetchUsers();
    fetchAdmins();
  }, [navigate, isSuperAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/users/all");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await axios.get("/users/admins");
      setAdminUsers(response.data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const handleGrantAdmin = async (userId: string) => {
    try {
      await axios.post(`/users/grant-admin/${userId}`);
      setSuccessMessage("Admin privileges granted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
      fetchAdmins();
    } catch (error) {
      console.error("Error granting admin privileges:", error);
      setError("Failed to grant admin privileges");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRevokeAdmin = async (userId: string) => {
    try {
      await axios.post(`/users/revoke-admin/${userId}`);
      setSuccessMessage("Admin privileges revoked successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
      fetchAdmins();
    } catch (error) {
      console.error("Error revoking admin privileges:", error);
      setError("Failed to revoke admin privileges");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    // Confirm deletion
    if (
      !window.confirm(
        `Are you sure you want to delete user ${email}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/users/${userId}`);
      setSuccessMessage("User deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
      fetchAdmins();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setError(error.response?.data?.error || "Failed to delete user");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAddAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail.trim()) {
      setError("Please enter an email address");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      // Find if user exists
      const user = users.find(
        (user) => user.email.toLowerCase() === newAdminEmail.toLowerCase()
      );

      if (!user) {
        setError("User with this email not found");
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (user.isAdmin) {
        setError("User is already an admin");
        setTimeout(() => setError(""), 3000);
        return;
      }

      await handleGrantAdmin(user.id);
      setNewAdminEmail("");
    } catch (error) {
      console.error("Error adding admin by email:", error);
      setError("Failed to add admin");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 dark:border-brand-400"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-dark-bg min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Super Admin Control Panel
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
            {successMessage}
          </div>
        )}

        {/* Add Admin by Email Form */}
        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden mb-6 dark:border dark:border-dark-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-muted">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add Admin by Email
            </h2>
          </div>
          <div className="p-6">
            <form
              onSubmit={handleAddAdminByEmail}
              className="flex items-end space-x-4"
            >
              <div className="flex-grow">
                <label
                  htmlFor="adminEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:text-gray-100"
                  placeholder="Enter user email to grant admin privileges"
                />
              </div>
              <button
                type="submit"
                className="bg-brand-600 dark:bg-brand-700 text-white px-4 py-2 rounded-md hover:bg-brand-700 dark:hover:bg-brand-600 transition duration-150"
              >
                Add Admin
              </button>
            </form>
          </div>
        </div>

        {/* Current Admins List */}
        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden mb-6 dark:border dark:border-dark-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-muted">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Current Admins
            </h2>
          </div>
          <div className="p-6">
            {adminUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No admin users found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                  <thead className="bg-gray-50 dark:bg-dark-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                    {adminUsers.map((admin) => (
                      <tr
                        key={admin.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-muted/30"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Avatar
                                src={admin.photoURL}
                                name={admin.displayName}
                                alt={admin.displayName || "Admin"}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {admin.displayName || "Unknown admin"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {admin.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {admin.isSuperAdmin ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              Super Admin
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!admin.isSuperAdmin && (
                            <button
                              onClick={() => handleRevokeAdmin(admin.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            >
                              Revoke Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* All Users List */}
        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden dark:border dark:border-dark-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-muted">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Users
            </h2>
          </div>
          <div className="p-6">
            {users.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No users found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                  <thead className="bg-gray-50 dark:bg-dark-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-muted/30"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Avatar
                                src={user.photoURL}
                                name={user.displayName}
                                alt={user.displayName || "User"}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user.displayName || "No name"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isSuperAdmin ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              Super Admin
                            </span>
                          ) : user.isAdmin ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!user.isAdmin && (
                            <button
                              onClick={() => handleGrantAdmin(user.id)}
                              className="text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 mr-3"
                            >
                              Make Admin
                            </button>
                          )}
                          {user.isAdmin && !user.isSuperAdmin && (
                            <button
                              onClick={() => handleRevokeAdmin(user.id)}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 mr-3"
                            >
                              Revoke Admin
                            </button>
                          )}
                          {!user.isSuperAdmin && (
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SuperAdminPage;
