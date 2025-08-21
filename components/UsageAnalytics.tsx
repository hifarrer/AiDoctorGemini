"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface UsageStats {
  totalInteractions: number;
  totalPrompts: number;
  uniqueUsers: number;
  chartData: Array<{
    date: string;
    interactions: number;
    prompts: number;
    uniqueUsers: number;
    // Optional: type breakdown could be added later
  }>;
}

interface UsageRecord {
  id: string;
  userId: string;
  userEmail: string;
  date: string;
  interactions: number;
  prompts: number;
  // type?: string; // if present we can build donut breakdown
}

export default function UsageAnalytics() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchUsageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const response = await fetch(`/api/admin/usage?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Usage data received:", data);
        setStats(data.stats);
        setRecords(data.records);
      } else {
        console.error("Failed to fetch usage data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching usage data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const handleDateFilter = () => fetchUsageData();
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchUsageData();
  };

  const dates = useMemo(() => (stats?.chartData || []).map(d => new Date(d.date).toLocaleDateString()), [stats]);
  const interactionsSeries = useMemo(() => (stats?.chartData || []).map(d => d.interactions), [stats]);
  const promptsSeries = useMemo(() => (stats?.chartData || []).map(d => d.prompts), [stats]);

  // Donut breakdown: if records have a "type" we can group by it; else derive a simple split interactions vs prompts
  const donutData = useMemo(() => {
    if (!records || records.length === 0) {
      return {
        labels: ["Interactions", "Prompts"],
        datasets: [
          {
            data: [stats?.totalInteractions || 0, stats?.totalPrompts || 0],
            backgroundColor: ["#3B82F6", "#10B981"],
            borderWidth: 0,
          },
        ],
      };
    }
    // If we had record.type we could build by type; fallback to same as above
    return {
      labels: ["Interactions", "Prompts"],
      datasets: [
        {
          data: [stats?.totalInteractions || 0, stats?.totalPrompts || 0],
          backgroundColor: ["#3B82F6", "#10B981"],
          borderWidth: 0,
        },
      ],
    };
  }, [records, stats]);

  const lineData = useMemo(() => ({
    labels: dates,
    datasets: [
      {
        label: "Interactions",
        data: interactionsSeries,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.35,
        pointRadius: 2,
        borderWidth: 2,
        fill: true,
      },
      {
        label: "Prompts",
        data: promptsSeries,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        tension: 0.35,
        pointRadius: 2,
        borderWidth: 2,
        fill: true,
      },
    ],
  }), [dates, interactionsSeries, promptsSeries]);

  const barData = useMemo(() => ({
    labels: dates,
    datasets: [
      {
        label: "Daily Total",
        data: (stats?.chartData || []).map(d => d.interactions + d.prompts),
        backgroundColor: "#22C55E",
        borderRadius: 6,
      },
    ],
  }), [dates, stats]);

  const darkGrid = {
    color: "rgba(148,163,184,0.15)",
    borderDash: [4, 4],
  } as const;

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#CBD5E1",
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: "#0F172A",
        titleColor: "#E2E8F0",
        bodyColor: "#E2E8F0",
        borderColor: "#1F2937",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "#94A3B8" },
        grid: darkGrid,
      },
      y: {
        ticks: { color: "#94A3B8" },
        grid: darkGrid,
      },
    },
  } as const;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Usage Analytics</h3>

      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDateFilter}>Filter</Button>
            <Button onClick={clearFilters} variant="outline">Clear</Button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-800/30 dark:bg-slate-800 rounded-lg border border-slate-700">
            <div className="text-3xl font-extrabold text-blue-400">{stats.totalInteractions}</div>
            <div className="text-sm text-slate-300">Total Interactions</div>
          </div>
          <div className="p-4 bg-slate-800/30 dark:bg-slate-800 rounded-lg border border-slate-700">
            <div className="text-3xl font-extrabold text-emerald-400">{stats.totalPrompts}</div>
            <div className="text-sm text-slate-300">Total Prompts</div>
          </div>
          <div className="p-4 bg-slate-800/30 dark:bg-slate-800 rounded-lg border border-slate-700">
            <div className="text-3xl font-extrabold text-purple-400">{stats.uniqueUsers}</div>
            <div className="text-sm text-slate-300">Active Users</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-1 bg-slate-900/40 dark:bg-slate-900 rounded-xl p-4 border border-slate-700 h-[300px]">
          <div className="text-slate-200 text-sm mb-2">Daily Interactions</div>
          <div className="h-[240px]">
            <Line data={lineData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }} />
          </div>
        </div>
        <div className="col-span-1 lg:col-span-1 bg-slate-900/40 dark:bg-slate-900 rounded-xl p-4 border border-slate-700 h-[300px]">
          <div className="text-slate-200 text-sm mb-2">Usage Breakdown</div>
          <div className="h-[240px] flex items-center">
            <Doughnut data={donutData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { color: '#CBD5E1' } } } }} />
          </div>
        </div>
        <div className="col-span-1 lg:col-span-1 bg-slate-900/40 dark:bg-slate-900 rounded-xl p-4 border border-slate-700 h-[300px]">
          <div className="text-slate-200 text-sm mb-2">Daily Total</div>
          <div className="h-[240px]">
            <Bar data={barData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Recent Usage Records</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interactions</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prompts</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {records.slice(-10).map((record) => (
                <tr key={record.id}>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.userEmail}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.interactions}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.prompts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
