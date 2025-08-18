"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import SubscriptionModal from "@/components/SubscriptionModal";
import toast from "react-hot-toast";

interface UserSubscription {
  plan: string;
  status: string;
  subscriptionId?: string;
  nextBillingDate?: string;
}

export default function PlansManagement() {
  const { data: session } = useSession();
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch plans
      const plansResponse = await fetch('/api/plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlansList(plansData);
      }

      // Fetch current subscription
      const subscriptionResponse = await fetch('/api/user/subscription');
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setCurrentSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (plan: Plan) => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    // Don't allow changing to the same plan
    if (currentSubscription?.plan === plan.title) {
      toast(`You are already on the ${plan.title} plan`, { icon: 'ℹ️' });
      return;
    }

    // Handle free plan
    if (plan.title === 'Free') {
      if (confirm('Are you sure you want to downgrade to the Free plan? You will lose access to premium features.')) {
        handleDowngradeToFree();
      }
      return;
    }

    // Open subscription modal for paid plans
    setSelectedPlan(plan);
    setIsSubscriptionModalOpen(true);
  };

  const handleDowngradeToFree = async () => {
    try {
      if (currentSubscription?.subscriptionId) {
        // Cancel current subscription
        const response = await fetch('/api/user/subscription/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: currentSubscription.subscriptionId,
          }),
        });

        if (response.ok) {
          toast.success('Successfully downgraded to Free plan');
          fetchData(); // Refresh data
        } else {
          toast.error('Failed to downgrade plan');
        }
      } else {
        // Update user plan to Free
        const response = await fetch('/api/user/plan', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: 'Free',
          }),
        });

        if (response.ok) {
          toast.success('Successfully switched to Free plan');
          fetchData(); // Refresh data
        } else {
          toast.error('Failed to switch plan');
        }
      }
    } catch (error) {
      toast.error('An error occurred while changing plan');
    }
  };

  const handleSubscriptionSuccess = () => {
    toast.success('Subscription successful! Welcome to your new plan.');
    fetchData(); // Refresh data
  };



  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Plan Management
      </h3>

      {/* Current Plan Status */}
      {currentSubscription && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Current Plan
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentSubscription.plan}
            </span>
          </div>
          {currentSubscription.nextBillingDate && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Next billing: {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Available Plans
        </h4>
        {plansList.map((plan) => (
          <div
            key={plan.id}
            className={`p-4 border rounded-lg transition-colors ${
              currentSubscription?.plan === plan.title
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {plan.title}
                  </h5>
                  {currentSubscription?.plan === plan.title && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {plan.description}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">${plan.monthlyPrice}/month</span>
                  {plan.monthlyPrice > 0 && (
                    <span className="ml-2">
                      or <span className="font-medium">${plan.yearlyPrice}/year</span>
                      <span className="text-green-600 dark:text-green-400 ml-1">
                        (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                {currentSubscription?.plan === plan.title ? (
                  <Button
                    variant="outline"
                    disabled
                    className="text-gray-500"
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePlanChange(plan)}
                    variant={plan.title === 'Free' ? 'outline' : 'default'}
                    className={
                      plan.title === 'Free'
                        ? 'text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20'
                        : ''
                    }
                  >
                    {plan.title === 'Free' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Modal */}
      {selectedPlan && (
        <SubscriptionModal
          plan={selectedPlan}
          isOpen={isSubscriptionModalOpen}
          onClose={() => {
            setIsSubscriptionModalOpen(false);
            setSelectedPlan(null);
          }}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </div>
  );
}
