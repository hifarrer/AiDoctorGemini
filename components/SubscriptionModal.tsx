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
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [paymentElement, setPaymentElement] = useState<any>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Load Stripe
      const loadStripe = async () => {
        try {
          const { loadStripe } = await import('@stripe/stripe-js');
          const response = await fetch('/api/stripe/config');
          const { publishableKey } = await response.json();
          
          if (!publishableKey) {
            toast.error('Stripe not configured. Please contact support.');
            return;
          }

          // Log the environment for debugging
          const isLiveMode = publishableKey.startsWith('pk_live_');
          console.log('Frontend Stripe environment:', isLiveMode ? 'LIVE' : 'TEST');

          const stripeInstance = await loadStripe(publishableKey);
          setStripe(stripeInstance);
        } catch (error) {
          console.error('Error loading Stripe:', error);
          toast.error('Failed to load payment system');
        }
      };

      loadStripe();
    }
  }, [isOpen]);

  useEffect(() => {
    if (stripe && isOpen) {
      const options = {
        mode: 'subscription',
        amount: billingCycle === 'monthly' ? plan.monthlyPrice * 100 : plan.yearlyPrice * 100,
        currency: 'usd',
        appearance: {
          theme: 'stripe',
        },
      };

      const elementsInstance = stripe.elements(options);
      setElements(elementsInstance);

      const paymentElementInstance = elementsInstance.create('payment');
      paymentElementInstance.mount('#payment-element');
      setPaymentElement(paymentElementInstance);
    }
  }, [stripe, isOpen, billingCycle, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !session) {
      return;
    }

    setIsLoading(true);

    try {
      // First, submit the elements to validate the payment method
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // 1) Create a SetupIntent to collect and confirm a payment method on localhost reliably
      const siRes = await fetch('/api/stripe/setup-intent', { method: 'POST' });
      if (!siRes.ok) {
        const errorData = await siRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initialize payment setup.');
      }
      const { clientSecret: setupClientSecret } = await siRes.json();
      if (!setupClientSecret) {
        throw new Error('No setup client secret received from server.');
      }

      const setupResult = await stripe.confirmSetup({
        elements,
        clientSecret: setupClientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?subscription=success`,
        },
        redirect: 'if_required',
      });
      
      if (setupResult.error) {
        // Handle specific setup intent errors
        if (setupResult.error.code === 'resource_missing' || 
            setupResult.error.message?.includes('No such setupintent')) {
          console.log('Setup intent expired or invalid, retrying...');
          
          // Submit elements again before retry
          const { error: retrySubmitError } = await elements.submit();
          if (retrySubmitError) {
            throw new Error(retrySubmitError.message);
          }
          
          // Retry once with a fresh setup intent
          const retryRes = await fetch('/api/stripe/setup-intent', { method: 'POST' });
          if (!retryRes.ok) {
            throw new Error('Failed to create fresh setup intent.');
          }
          const { clientSecret: retryClientSecret } = await retryRes.json();
          
          const retryResult = await stripe.confirmSetup({
            elements,
            clientSecret: retryClientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/dashboard?subscription=success`,
            },
            redirect: 'if_required',
          });
          
          if (retryResult.error) {
            throw new Error(retryResult.error.message || 'Failed to confirm payment method after retry');
          }
          
          // Use the retry result
          const paymentMethodId = (retryResult.setupIntent as any)?.payment_method;
          if (!paymentMethodId) {
            throw new Error('No payment method returned by Stripe after retry.');
          }
          
          // Continue with subscription creation using the retry payment method
          await createSubscription(paymentMethodId);
        } else {
          throw new Error(setupResult.error.message || 'Failed to confirm payment method');
        }
      } else {
        const paymentMethodId = (setupResult.setupIntent as any)?.payment_method;
        if (!paymentMethodId) {
          throw new Error('No payment method returned by Stripe.');
        }
        
        // Continue with subscription creation
        await createSubscription(paymentMethodId);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const createSubscription = async (paymentMethodId: string) => {
    // 2) Create subscription on server with the confirmed payment method
    const response = await fetch('/api/stripe/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: plan.id,
        billingCycle,
        paymentMethodId,
      }),
    });

    const { subscription, message } = await response.json();

    if (!response.ok) {
      throw new Error(message || 'Failed to create subscription');
    }

    // If Stripe still requires payment confirmation, confirm using the returned client secret
    if (subscription?.clientSecret) {
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: subscription.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?subscription=success`,
        },
        redirect: 'if_required',
      });
      if (error) {
        throw new Error(error.message);
      }
    }

    toast.success('Subscription created successfully!');
    onSuccess();
    onClose();
    
    // Redirect to profile page after successful subscription
    window.location.href = '/dashboard?tab=profile';
  };

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

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Information
              </Label>
              <div id="payment-element" className="mt-2" />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !stripe}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
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
