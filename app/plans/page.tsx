"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SubscriptionModal from "@/components/SubscriptionModal";
import toast from "react-hot-toast";

export default function PlansPage() {
  const { data: session } = useSession();
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPlansList(data);
        } else {
          console.error('Failed to fetch plans');
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = (plan: Plan) => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = "/auth/login";
      return;
    }
    
    // Open subscription modal for paid plans
    if (plan.title !== 'Free') {
      setSelectedPlan(plan);
      setIsSubscriptionModalOpen(true);
    } else {
      // Handle free plan subscription
      console.log(`User ${session.user?.email} wants to subscribe to ${plan.title}`);
      toast.success('Free plan activated!');
    }
  };

  const handleSubscriptionSuccess = () => {
    // Refresh user data or update UI
    toast.success('Subscription successful! Welcome to your new plan.');
  };

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSiteName(data.siteName || "");
          setLogoUrl(data.logoUrl || "");
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSiteSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Site Name */}
            <div className="flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName || "Medical AI Assistant"} className="h-8 w-auto object-contain" />
              ) : (
                <HeartPulseIcon className="w-8 h-8 text-teal-500" />
              )}
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {siteName || "Medical AI Assistant"}
                </h1>
              </Link>
            </div>

            {/* Navigation - Only show if user is logged in */}
            {session && (
              <nav className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                    Chat
                  </Button>
                </Link>
                <Link href="/dashboard?tab=profile">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                    Profile
                  </Button>
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Get the perfect AI medical assistance plan for your needs. 
              Start with our free plan and upgrade as you grow.
            </p>
          </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plansList.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${
                plan.isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
              } transition-transform duration-200 hover:scale-105`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center space-x-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/month</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ${plan.yearlyPrice}/year
                    {plan.monthlyPrice > 0 && (
                      <span className="text-green-600 dark:text-green-400 ml-1">
                        (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <div className="text-center">
                  {session ? (
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                        plan.isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      }`}
                    >
                      {plan.title === 'Free' ? 'Get Started' : 'Subscribe Now'}
                    </Button>
                  ) : (
                    <Link href="/auth/login">
                      <Button
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                          plan.isPopular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                        }`}
                      >
                        {plan.title === 'Free' ? 'Get Started' : 'Subscribe Now'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We offer a free plan with limited features. You can upgrade to a paid plan anytime to unlock more features.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, debit cards, and PayPal. All payments are processed securely.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join thousands of users who trust our AI medical assistance platform.
            </p>
            {session ? (
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>
                 </div>
       </div>
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

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function HeartPulseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.7-1.5L11.5 12H16" />
    </svg>
  )
}
