"use client";

import { useState, useEffect } from "react";
import type { Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  firstName?: string;
  password: string;
  plan?: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function UsersManagement() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/list');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Only include active plans
        const activePlans = Array.isArray(data) ? data.filter((p: Plan) => p.isActive) : [];
        setAvailablePlans(activePlans);
      } else {
        console.error('Failed to fetch plans for users management');
        setAvailablePlans([]);
      }
    } catch (e) {
      console.error('Error fetching plans for users management:', e);
      setAvailablePlans([]);
    }
  };

  const filteredUsers = usersList.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsEditing(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingUser),
      });

      if (response.ok) {
        toast.success("User updated successfully!");
        setIsEditing(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the users list
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      toast.error("An error occurred while updating user");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUser(null);
  };

  const toggleUserStatus = async (userId: string) => {
    const user = usersList.find(u => u.id === userId);
    if (!user) return;

    const updatedUser = { ...user, isActive: !user.isActive };
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        toast.success(`User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchUsers(); // Refresh the users list
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      toast.error("An error occurred while updating user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsersList(prev => prev.filter(u => u.id !== userId));
        toast.success("User deleted successfully!");
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred while deleting user");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Users Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage user accounts and subscriptions
        </p>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredUsers.length} of {usersList.length} users
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.plan || "Free"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive !== false
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Edit Modal */}
      {isEditing && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Edit User: {editingUser.firstName || editingUser.email}
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editingUser.firstName || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, firstName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <select
                    id="plan"
                    value={editingUser.plan || "Free"}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, plan: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {/* Ensure the current value is present even if plan is inactive */}
                    {editingUser.plan && !availablePlans.some(p => p.title === editingUser.plan) && (
                      <option value={editingUser.plan}>{editingUser.plan}</option>
                    )}
                    {availablePlans.map((plan) => (
                      <option key={plan.id} value={plan.title}>
                        {plan.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingUser.isActive !== false}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active User</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
