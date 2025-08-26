"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function MaintenancePage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExportDatabase = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/admin/maintenance/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-export-${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setLastExport(new Date().toISOString());
        toast.success('Database exported successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to export database');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An error occurred while exporting the database');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExportStructure = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 150);

      const response = await fetch('/api/admin/maintenance/export-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-structure-${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setLastExport(new Date().toISOString());
        toast.success('Database structure exported successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to export database structure');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An error occurred while exporting the database structure');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Database Maintenance
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Export database structure and data for backup and migration purposes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Database Export */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <DatabaseIcon className="w-5 h-5" />
              Full Database Export
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Export complete database including structure and all data
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                Complete Backup
              </span>
              <span className="px-2 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded">
                SQL Format
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will export the entire database including all tables, data, and relationships.
              Use this for complete backups or migrations.
            </p>
            
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleExportDatabase}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Exporting...' : 'Export Full Database'}
            </Button>
          </div>
        </div>

        {/* Structure Only Export */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <TableIcon className="w-5 h-5" />
              Structure Only Export
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Export database structure without data
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                Schema Only
              </span>
              <span className="px-2 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded">
                SQL Format
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export only the database structure (tables, indexes, constraints) without any data.
              Useful for setting up new environments.
            </p>
            
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleExportStructure}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              {isExporting ? 'Exporting...' : 'Export Structure Only'}
            </Button>
          </div>
        </div>
      </div>

      {/* Export History */}
      {lastExport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Last Export
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Information about the most recent database export
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Export completed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(lastExport).toLocaleString()}
                </p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                Success
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-yellow-200 dark:border-yellow-800">
        <div className="p-6 border-b border-yellow-200 dark:border-yellow-800">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            <AlertTriangleIcon className="w-5 h-5" />
            Important Notes
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <span>Exports may take several minutes depending on database size</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <span>Keep exported files secure as they contain sensitive data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <span>Test imports in a safe environment before production use</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
              <span>Consider database size limits when importing to new environments</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

function TableIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
