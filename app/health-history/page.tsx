"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

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

export default function HealthHistoryPage() {
  const { data: session } = useSession();
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchHealthReports();
    }
  }, [session]);

  const fetchHealthReports = async () => {
    try {
      const response = await fetch('/api/health-reports');
      if (response.ok) {
        const data = await response.json();
        setHealthReports(data.healthReports || []);
      } else {
        toast.error('Failed to fetch health reports');
      }
    } catch (error) {
      console.error('Error fetching health reports:', error);
      toast.error('Error fetching health reports');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = healthReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.report_type === filterType;
    const matchesRisk = filterRisk === 'all' || report.risk_level === filterRisk;
    
    return matchesSearch && matchesType && matchesRisk;
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeDisplayName = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const downloadPDF = async (reportId: string, title: string) => {
    const toastId = toast.loading('Generating PDF...');
    setDownloadingId(reportId);
    try {
      const response = await fetch(`/api/health-reports/${reportId}/pdf`);
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
        toast.success('PDF ready and downloaded', { id: toastId });
      } else {
        toast.error('Failed to generate PDF', { id: toastId });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error downloading PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
      toast.dismiss(toastId);
    }
  };

  const deleteReport = async (reportId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading('Deleting report...');
    setDeletingId(reportId);
    try {
      const response = await fetch(`/api/health-reports/${reportId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setHealthReports(prev => prev.filter(report => report.id !== reportId));
        toast.success('Report deleted successfully', { id: toastId });
      } else {
        toast.error('Failed to delete report', { id: toastId });
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error deleting report', { id: toastId });
    } finally {
      setDeletingId(null);
      toast.dismiss(toastId);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Sign In</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be signed in to view your health history.</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track and manage your health reports and analysis history
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Reports
              </label>
              <Input
                type="text"
                placeholder="Search by title or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="lab_results">Lab Results</option>
                <option value="exam_results">Exam Results</option>
                <option value="imaging">Imaging</option>
                <option value="medical_report">Medical Report</option>
                <option value="general_report">General Report</option>
                <option value="image_analysis">Image Analysis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Level
              </label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading health reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Health Reports Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {healthReports.length === 0 
                  ? "You haven't uploaded any health reports yet. Upload your first report in the dashboard to get started."
                  : "No reports match your current filters. Try adjusting your search criteria."
                }
              </p>
              {healthReports.length === 0 && (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(report.risk_level)}`}>
                          {report.risk_level.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {getTypeDisplayName(report.report_type)}
                        </span>
                        {report.analysis_type === 'image' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            📷 IMAGE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Original file: {report.original_filename}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Uploaded: {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                        {report.ai_summary}
                      </p>
                      {report.key_findings && report.key_findings.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Key Findings:</p>
                          <div className="flex flex-wrap gap-1">
                            {report.key_findings.slice(0, 3).map((finding, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                                {finding}
                              </span>
                            ))}
                            {report.key_findings.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                                +{report.key_findings.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={downloadingId === report.id ? 'default' : 'outline'}
                        onClick={() => downloadPDF(report.id, report.title)}
                        className="w-full flex items-center justify-center"
                        disabled={downloadingId === report.id}
                      >
                        {downloadingId === report.id ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </>
                        )}
                      </Button>
                      <Link href={`/dashboard?report=${report.id}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Ask Questions
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteReport(report.id, report.title)}
                        className="w-full flex items-center justify-center"
                        disabled={deletingId === report.id}
                      >
                        {deletingId === report.id ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
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

        {/* Stats */}
        {healthReports.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{healthReports.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-red-600">{healthReports.filter(r => r.risk_level === 'critical' || r.risk_level === 'high').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">High Risk</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-blue-600">{healthReports.filter(r => r.report_type === 'lab_results').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lab Results</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-green-600">{healthReports.filter(r => r.report_type === 'imaging').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Imaging</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-purple-600">{healthReports.filter(r => r.analysis_type === 'image').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Image Analysis</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
