"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  plan: string;
  reportsCount: number;
}

interface HealthReport {
  id: string;
  title: string;
  report_type: string;
  original_filename: string;
  ai_summary: string;
  key_findings: string[];
  recommendations: string[];
  risk_level: string;
  created_at: string;
  updated_at: string;
  image_data?: string;
  image_filename?: string;
  image_mime_type?: string;
  analysis_type?: string;
}

export default function AdminHealthReports() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/health-reports");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserReports = async (userId: string) => {
    setIsLoadingReports(true);
    try {
      const response = await fetch(`/api/admin/health-reports?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHealthReports(data.healthReports || []);
        setShowReportsModal(true);
      } else {
        toast.error("Failed to fetch health reports");
      }
    } catch (error) {
      console.error("Error fetching health reports:", error);
      toast.error("Error fetching health reports");
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleViewReports = (user: User) => {
    setSelectedUser(user);
    fetchUserReports(user.id);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeDisplayName = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const viewPDF = async (reportId: string, title: string) => {
    setDownloadingPdfId(reportId);
    try {
      const response = await fetch(`/api/admin/health-reports/${reportId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}_summary.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF downloaded successfully');
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error downloading PDF');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Health Reports Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage user health reports
        </p>
      </div>

      {/* Search */}
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
          {filteredUsers.length} of {users.length} users
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
                    Reports Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user.reportsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        onClick={() => handleViewReports(user)}
                        disabled={isLoadingReports || user.reportsCount === 0}
                        variant="outline"
                        size="sm"
                      >
                        {isLoadingReports && selectedUser?.id === user.id ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            Loading...
                          </>
                        ) : (
                          "View Reports"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Health Reports for {selectedUser.email}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Plan: {selectedUser.plan}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportsModal(false);
                    setSelectedUser(null);
                    setHealthReports([]);
                  }}
                >
                  Close
                </Button>
              </div>

              {healthReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No health reports found for this user.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {healthReports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {report.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(
                                report.risk_level
                              )}`}
                            >
                              {report.risk_level.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {getTypeDisplayName(report.report_type)}
                            </span>
                            {report.analysis_type === "image" && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                📷 IMAGE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Original file: {report.original_filename}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Created: {new Date(report.created_at).toLocaleDateString()} at{" "}
                            {new Date(report.created_at).toLocaleTimeString()}
                          </p>
                          {report.ai_summary && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                              {report.ai_summary}
                            </p>
                          )}
                          {report.key_findings && report.key_findings.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Key Findings:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {report.key_findings.map((finding, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded"
                                  >
                                    {finding}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {report.recommendations && report.recommendations.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Recommendations:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {report.recommendations.map((rec, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded"
                                  >
                                    {rec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewPDF(report.id, report.title)}
                            disabled={downloadingPdfId === report.id}
                            className="flex items-center"
                          >
                            {downloadingPdfId === report.id ? (
                              <>
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

