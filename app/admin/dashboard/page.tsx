"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from "react-hot-toast";

interface User {
  id: string;
  email: string;
  createdAt: string;
  lastLogin: string | null;
}

interface UsageStats {
  total: {
    chats: number;
    users: number;
    images: number;
    pdfs: number;
  };
  today: {
    chats: number;
    users: number;
    images: number;
    pdfs: number;
  };
  thisMonth: {
    chats: number;
    users: number;
    images: number;
    pdfs: number;
  };
  dailyHistory: Array<{
    date: string;
    chats: number;
    users: number;
    images: number;
    pdfs: number;
  }>;
}

interface AdminConfig {
  username: string;
  email: string;
  siteSettings: {
    siteName: string;
    contactEmail: string;
    supportEmail: string;
    maxUsersPerDay: number;
    maintenanceMode: boolean;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [siteForm, setSiteForm] = useState({
    contactEmail: "",
    supportEmail: "",
    maxUsersPerDay: 1000,
    maintenanceMode: false,
  });
  const [siteName, setSiteName] = useState("Health Consultant AI");
  const router = useRouter();

  const fetchData = useCallback(async () => {
    console.log("🔄 Starting admin dashboard data fetch...");
    try {
      console.log("📡 Fetching users, stats, and settings...");
      const [usersRes, statsRes, configRes, settingsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/config"),
        fetch("/api/settings"),
      ]);

      console.log("📊 API Response Status:", {
        users: usersRes.status,
        stats: statsRes.status,
        config: configRes.status,
        settings: settingsRes.status
      });

      if (!usersRes.ok || !statsRes.ok || !configRes.ok || !settingsRes.ok) {
        console.error("❌ API Error Details:", {
          users: { status: usersRes.status, statusText: usersRes.statusText },
          stats: { status: statsRes.status, statusText: statsRes.statusText },
          config: { status: configRes.status, statusText: configRes.statusText },
          settings: { status: settingsRes.status, statusText: settingsRes.statusText }
        });
        
        if (usersRes.status === 401 || statsRes.status === 401 || configRes.status === 401 || settingsRes.status === 401) {
          console.log("🔒 Unauthorized - redirecting to login");
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      console.log("✅ All API calls successful, parsing responses...");
      const [usersData, statsData, configData, settingsData] = await Promise.all([
        usersRes.json(),
        statsRes.json(),
        configRes.json(),
        settingsRes.json(),
      ]);

      console.log("📋 Parsed Data:", {
        users: usersData,
        stats: statsData,
        config: configData,
        settings: settingsData
      });

      setUsers(usersData.users || []);
      setStats(statsData);
      setConfig(configData);
      setSiteName(settingsData.siteName || "Health Consultant AI");
      setSiteForm({
        contactEmail: configData?.siteSettings?.contactEmail || "",
        supportEmail: configData?.siteSettings?.supportEmail || "",
        maxUsersPerDay: configData?.siteSettings?.maxUsersPerDay || 1000,
        maintenanceMode: configData?.siteSettings?.maintenanceMode || false,
      });
      console.log("✅ Admin dashboard data loaded successfully");
    } catch (error) {
      console.error("❌ Admin data fetch error:", error);
      toast.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Password updated successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleSiteSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "site",
          ...siteForm,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Site settings updated successfully");
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchData(); // Refresh data
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {siteName} Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome, {config?.username}
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => router.push("/")}
                variant="outline"
              >
                View Site
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", name: "Overview" },
              { id: "users", name: "Users" },
              { id: "settings", name: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Chats</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total.chats}</p>
                <p className="text-sm text-gray-500">Today: {stats.today.chats}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
                <p className="text-3xl font-bold text-green-600">{stats.total.users}</p>
                <p className="text-sm text-gray-500">Active today: {stats.today.users}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Images Processed</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.total.images}</p>
                <p className="text-sm text-gray-500">Today: {stats.today.images}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">PDFs Processed</h3>
                <p className="text-3xl font-bold text-red-600">{stats.total.pdfs}</p>
                <p className="text-sm text-gray-500">Today: {stats.today.pdfs}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Daily Activity (Last 10 Days)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Active Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Images
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PDFs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.dailyHistory.slice(-10).reverse().map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {day.chats}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {day.users}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {day.images}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {day.pdfs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Registered Users ({users.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Change Admin Password
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </div>

            {/* Site Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Site Settings
              </h3>
              <form onSubmit={handleSiteSettingsUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={siteForm.contactEmail}
                    onChange={(e) =>
                      setSiteForm((prev) => ({
                        ...prev,
                        contactEmail: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={siteForm.supportEmail}
                    onChange={(e) =>
                      setSiteForm((prev) => ({
                        ...prev,
                        supportEmail: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxUsersPerDay">Max Users Per Day</Label>
                  <Input
                    id="maxUsersPerDay"
                    type="number"
                    value={siteForm.maxUsersPerDay}
                    onChange={(e) =>
                      setSiteForm((prev) => ({
                        ...prev,
                        maxUsersPerDay: parseInt(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="maintenanceMode"
                    type="checkbox"
                    checked={siteForm.maintenanceMode}
                    onChange={(e) =>
                      setSiteForm((prev) => ({
                        ...prev,
                        maintenanceMode: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>
                <Button type="submit">Update Site Settings</Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}