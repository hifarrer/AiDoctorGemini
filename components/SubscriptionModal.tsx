"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface SubscriptionModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionModal({
  plan,
  isOpen,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  // Stripe Elements flow removed; using Checkout Session only

  // Stripe Elements flow removed

  // Stripe Elements flow removed

  // Stripe Elements flow removed

  // Stripe Elements flow removed

  // Stripe Elements flow removed

  if (!isOpen) return null;

  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const savings = billingCycle === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subscribe to {plan.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Billing Cycle Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Billing Cycle
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                Monthly
                <div className="text-lg font-bold">${plan.monthlyPrice}</div>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                Yearly
                <div className="text-lg font-bold">${plan.yearlyPrice}</div>
                {savings > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Save ${savings.toFixed(2)}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Plan Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {plan.title} Plan ({billingCycle})
                </span>
                <span className="font-medium">${price}</span>
              </div>
              {billingCycle === 'yearly' && savings > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Yearly Savings</span>
                  <span>-${savings.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${price}</span>
              </div>
            </div>
          </div>

          {/* Payment: Stripe Checkout only */}
          <form className="space-y-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId: plan.id, billingCycle }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || 'Failed to start Checkout');
                  }
                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    throw new Error('Checkout session not returned');
                  }
                } catch (err: any) {
                  console.error('Checkout redirect failed:', err);
                  toast.error(err.message || 'Checkout failed');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Redirecting to Stripe...
                </div>
              ) : (
                `Subscribe for $${price}/${billingCycle === 'monthly' ? 'month' : 'year'}`
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Your payment information is secure and encrypted. We use Stripe for payment processing.
          </div>
        </div>
      </div>
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
