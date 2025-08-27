export interface Plan {
  id: string;
  title: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  isPopular?: boolean;
  interactionsLimit?: number | null; // null/undefined means unlimited
  // Stripe linkage (server-populated)
  stripeProductId?: string;
  stripePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
}

// In-memory storage for plans (will be persisted through API routes)
export const plans: Plan[] = [
  {
    id: "1",
    title: "Free",
    description: "Perfect for getting started",
    features: [
      "3 AI consultations per month",
      "Basic health information",
      "Email support",
      "Standard response time"
    ],
    monthlyPrice: 0,
    yearlyPrice: 0,
    isActive: true,
    isPopular: false,
    interactionsLimit: 3,
  },
  {
    id: "2",
    title: "Basic",
    description: "Great for regular users",
    features: [
      "50 AI consultations per month",
      "Priority health information",
      "Image analysis (5 per month)",
      "Email & chat support",
      "Faster response time",
      "Health history tracking"
    ],
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    isActive: true,
    isPopular: true,
    interactionsLimit: 50,
  },
  {
    id: "3",
    title: "Premium",
    description: "For healthcare professionals",
    features: [
      "Unlimited AI consultations",
      "Advanced health analysis",
      "Unlimited image analysis",
      "Priority support",
      "Fastest response time",
      "Advanced health tracking",
      "Custom health reports",
      "API access"
    ],
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    isActive: true,
    isPopular: false,
    interactionsLimit: null, // Unlimited
  },
];
