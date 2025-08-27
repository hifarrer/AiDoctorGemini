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
        <div className="loading-skeleton" style={{ height: '20px', borderRadius: '8px', marginBottom: '16px', width: '60%' }}></div>
        <div className="loading-skeleton" style={{ height: '16px', borderRadius: '8px', width: '80%' }}></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{
        background: 'linear-gradient(180deg, #12182c, #0f1325)',
        border: '1px solid #1e2541',
        borderRadius: '20px',
        padding: '32px',
        height: 'fit-content'
      }}>
        <style jsx>{`
          .no-subscription {
            text-align: center;
            color: #9aa4b2;
          }
          .no-subscription h3 {
            color: #e7ecf5;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .no-subscription p {
            font-size: 14px;
            line-height: 1.5;
          }
        `}</style>
        <div className="no-subscription">
          <h3>No Active Subscription</h3>
          <p>You&apos;re currently on the free plan. Upgrade to unlock premium features.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { background: 'linear-gradient(90deg, #10b981, #059669)', color: '#ffffff' };
      case 'incomplete':
        return { background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: '#ffffff' };
      case 'past_due':
        return { background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: '#ffffff' };
      case 'canceled':
        return { background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: '#ffffff' };
      default:
        return { background: 'linear-gradient(90deg, #6b7280, #4b5563)', color: '#ffffff' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'incomplete':
        return 'Incomplete';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      default:
        return status;
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #12182c, #0f1325)',
      border: '1px solid #1e2541',
      borderRadius: '20px',
      padding: '32px',
      height: 'fit-content'
    }}>
      <style jsx>{`
        .subscription-header {
          margin-bottom: 24px;
        }
        .subscription-title {
          font-size: 18px;
          font-weight: 700;
          color: #e7ecf5;
          margin-bottom: 16px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .subscription-details {
          margin-bottom: 24px;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #1e2541;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #9aa4b2;
          font-size: 14px;
          font-weight: 500;
        }
        .detail-value {
          color: #e7ecf5;
          font-size: 14px;
          font-weight: 600;
        }
        .cancel-btn {
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cancel-btn:hover {
          background: linear-gradient(90deg, #ff5252, #ff7676);
        }
        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="subscription-header">
        <h3 className="subscription-title">Subscription Status</h3>
        <span 
          className="status-badge"
          style={getStatusColor(subscription.status)}
        >
          {getStatusText(subscription.status)}
        </span>
      </div>

      <div className="subscription-details">
        <div className="detail-item">
          <span className="detail-label">Current Plan</span>
          <span className="detail-value">{subscription.plan}</span>
        </div>
        
        {subscription.nextBillingDate && (
          <div className="detail-item">
            <span className="detail-label">Next Billing</span>
            <span className="detail-value">
              {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {subscription.status === 'active' && subscription.subscriptionId && (
        <button
          onClick={handleCancelSubscription}
          className="cancel-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Canceling...' : 'Cancel Subscription'}
        </button>
      )}
    </div>
  );
}
