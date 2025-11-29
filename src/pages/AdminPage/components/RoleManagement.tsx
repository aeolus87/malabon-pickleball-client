import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import Avatar from "../../../components/Avatar";
import CoachBadge from "../../../components/CoachBadge";

interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: string;
}

const RoleManagement: React.FC = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/users/all");
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleSetRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    setError("");
    setSuccess("");

    try {
      await axios.post(`/users/set-role/${userId}`, { role });
      setSuccess(`User role updated to ${role}`);
      setTimeout(() => setSuccess(""), 3000);
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update role");
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (user: User) => {
    if (user.isSuperAdmin) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          Super Admin
        </span>
      );
    }
    if (user.isAdmin) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Admin
        </span>
      );
    }
    if (user.role === "coach") {
      return <CoachBadge role="coach" size="sm" />;
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Player
      </span>
    );
  };

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {isOpen ? "Hide Role Management" : "Manage User Roles (Promote to Coach)"}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="mt-4 bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Manage User Roles
          </h3>

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Current Role
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.photoURL}
                            name={user.displayName}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.displayName || "Unnamed"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!user.isSuperAdmin && (
                          <div className="flex items-center justify-end gap-2">
                            {user.role !== "coach" && (
                              <button
                                onClick={() => handleSetRole(user.id, "coach")}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? "..." : "Make Coach"}
                              </button>
                            )}
                            {user.role === "coach" && (
                              <button
                                onClick={() => handleSetRole(user.id, "player")}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? "..." : "Remove Coach"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default RoleManagement;







