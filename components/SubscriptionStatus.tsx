"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface UserSubscription {
  plan: string;
  status: string;
  subscriptionId?: string;
  nextBillingDate?: string;
}

export default function SubscriptionStatus() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSubscriptionStatus();
    }
  }, [session]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
        
        // Sync removed – webhook drives updates now
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync removed – webhook drives updates now

  const handleCancelSubscription = async () => {
    if (!subscription?.subscriptionId) return;

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.subscriptionId,
        }),
      });

      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        fetchSubscriptionStatus();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('An error occurred while cancelling subscription');
    }
  };

         

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'incomplete':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'canceled':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'active':
        return 'Your subscription is active and working properly.';
      case 'incomplete':
        return 'Your payment is being processed. This usually takes a few minutes. Please refresh the page in a moment.';
      case 'past_due':
        return 'Your payment is past due. Please update your payment method.';
      case 'canceled':
        return 'Your subscription has been canceled.';
      default:
        return 'Subscription status unknown.';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subscription Status
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Current Plan:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {subscription.plan}
          </span>
        </div>



        {subscription.nextBillingDate && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Next Billing:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </span>
          </div>
        )}

                                               {subscription.subscriptionId && subscription.status !== 'canceled' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Button
                      onClick={handleCancelSubscription}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      Cancel Subscription
                    </Button>
                    {/* Sync button removed */}
                  </div>
                )}

                        {(subscription.plan === 'Free' || subscription.status === 'canceled') && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Button
                      onClick={() => window.location.href = '/plans'}
                      className="w-full"
                    >
                      Upgrade Plan
                    </Button>
                    {/* Sync button removed */}
                  </div>
                )}
      </div>
    </div>
  );
}
