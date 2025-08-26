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
      <div style={{
        background: 'linear-gradient(180deg, #12182c, #0f1325)',
        border: '1px solid #1e2541',
        borderRadius: '20px',
        padding: '32px',
        height: 'fit-content'
      }}>
        <style jsx>{`
          .loading-skeleton {
            background: linear-gradient(90deg, #1e2541 25%, #2a3463 50%, #1e2541 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div className="loading-skeleton" style={{ height: '24px', borderRadius: '8px', marginBottom: '16px', width: '40%' }}></div>
        <div className="loading-skeleton" style={{ height: '16px', borderRadius: '8px', marginBottom: '12px', width: '100%' }}></div>
        <div className="loading-skeleton" style={{ height: '16px', borderRadius: '8px', marginBottom: '12px', width: '75%' }}></div>
        <div className="loading-skeleton" style={{ height: '16px', borderRadius: '8px', width: '50%' }}></div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #12182c, #0f1325)',
      border: '1px solid #1e2541',
      borderRadius: '20px',
      padding: '32px',
      height: 'fit-content'
    }}>
      <style jsx>{`
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #e7ecf5;
          margin-bottom: 24px;
        }
        .current-plan {
          background: linear-gradient(180deg, #1a1f35, #0f1325);
          border: 1px solid #2a3463;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .current-plan-title {
          font-size: 14px;
          font-weight: 600;
          color: #9aa4b2;
          margin-bottom: 8px;
        }
        .current-plan-name {
          font-size: 20px;
          font-weight: 700;
          color: #e7ecf5;
          margin-bottom: 4px;
        }
        .current-plan-date {
          font-size: 12px;
          color: #9aa4b2;
        }
        .plans-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .plan-item {
          background: linear-gradient(180deg, #1a1f35, #0f1325);
          border: 1px solid #2a3463;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s ease;
        }
        .plan-item:hover {
          border-color: #3a4161;
        }
        .plan-item.current {
          border-color: #8856ff;
          background: linear-gradient(180deg, #1a1f35, #0f1325);
        }
        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .plan-info {
          flex: 1;
        }
        .plan-name {
          font-size: 16px;
          font-weight: 700;
          color: #e7ecf5;
          margin-bottom: 4px;
        }
        .plan-description {
          font-size: 12px;
          color: #9aa4b2;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .plan-pricing {
          font-size: 12px;
          color: #b7c1d6;
        }
        .plan-price-highlight {
          color: #6ae2ff;
          font-weight: 600;
        }
        .plan-actions {
          margin-left: 16px;
        }
        .plan-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .plan-btn.primary {
          background: linear-gradient(90deg, #8856ff, #a854ff);
          color: white;
        }
        .plan-btn.primary:hover {
          background: linear-gradient(90deg, #7a4bff, #9a44ff);
        }
        .plan-btn.secondary {
          background: #161a2c;
          color: #e8edfb;
          border: 1px solid #2a2f44;
        }
        .plan-btn.secondary:hover {
          background: #1e2541;
          border-color: #3a4161;
        }
        .plan-btn.danger {
          background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
          color: white;
        }
        .plan-btn.danger:hover {
          background: linear-gradient(90deg, #ff5252, #ff7676);
        }
        .plan-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .current-badge {
          background: linear-gradient(90deg, #8856ff, #a854ff);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-left: 8px;
        }
      `}</style>

      <h3 className="section-title">Plan Management</h3>

      {/* Current Plan Status */}
      {currentSubscription && (
        <div className="current-plan">
          <div className="current-plan-title">Current Plan</div>
          <div className="current-plan-name">{currentSubscription.plan}</div>
          {currentSubscription.nextBillingDate && (
            <div className="current-plan-date">
              Next billing: {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Available Plans */}
      <div className="plans-list">
        {plansList.map((plan) => (
          <div
            key={plan.id}
            className={`plan-item ${currentSubscription?.plan === plan.title ? 'current' : ''}`}
          >
            <div className="plan-header">
              <div className="plan-info">
                <div className="plan-name">
                  {plan.title}
                  {currentSubscription?.plan === plan.title && (
                    <span className="current-badge">Current</span>
                  )}
                </div>
                <div className="plan-description">{plan.description}</div>
                <div className="plan-pricing">
                  <span className="plan-price-highlight">${plan.monthlyPrice}/month</span>
                  {plan.monthlyPrice > 0 && (
                    <span>
                      {' '}or <span className="plan-price-highlight">${plan.yearlyPrice}/year</span>
                      <span style={{ color: '#10b981', marginLeft: '4px' }}>
                        (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="plan-actions">
                {currentSubscription?.plan === plan.title ? (
                  <button className="plan-btn secondary" disabled>
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanChange(plan)}
                    className={`plan-btn ${plan.title === 'Free' ? 'danger' : 'primary'}`}
                  >
                    {plan.title === 'Free' ? 'Downgrade' : 'Upgrade'}
                  </button>
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
