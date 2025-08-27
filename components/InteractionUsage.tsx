"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InteractionStats {
  currentMonth: number;
  limit: number | null;
  remaining: number | null;
  hasUnlimited: boolean;
}

export default function InteractionUsage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchInteractionStats();
    }
  }, [session]);

  const fetchInteractionStats = async () => {
    try {
      const response = await fetch('/api/user/interaction-limit');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch interaction stats');
      }
    } catch (error) {
      console.error('Error fetching interaction stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interaction Usage
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load usage statistics.
        </p>
      </div>
    );
  }

  const usagePercentage = stats.hasUnlimited ? 0 : stats.limit ? (stats.currentMonth / stats.limit) * 100 : 0;
  const isNearLimit = !stats.hasUnlimited && stats.limit && usagePercentage > 80;
  const isAtLimit = !stats.hasUnlimited && stats.remaining === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Monthly Interaction Usage
      </h3>
      
      {stats.hasUnlimited ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Current Usage:</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {stats.currentMonth} interactions
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Plan:</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">
              Unlimited
            </span>
          </div>
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✅ You have unlimited interactions with your current plan.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Current Usage:</span>
            <span className={`font-semibold ${isAtLimit ? 'text-red-600 dark:text-red-400' : isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {stats.currentMonth} / {stats.limit} interactions
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
            <span className={`font-semibold ${isAtLimit ? 'text-red-600 dark:text-red-400' : isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
              {stats.remaining} interactions
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>

          {/* Status Message */}
          {isAtLimit ? (
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm mb-2">
                🚫 You&apos;ve reached your monthly interaction limit.
              </p>
              <Link href="/plans">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          ) : isNearLimit ? (
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-2">
                ⚠️ You&apos;re approaching your monthly interaction limit.
              </p>
              <Link href="/plans">
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-md">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                ✅ You have {stats.remaining} interactions remaining this month.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Interactions reset monthly. Each chat message, image upload, and document analysis counts as one interaction.
        </p>
      </div>
    </div>
  );
}
