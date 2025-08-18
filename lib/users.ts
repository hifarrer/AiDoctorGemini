export interface User {
  id: string;
  email: string;
  firstName?: string;
  password: string;
  plan?: string;
  isActive?: boolean;
  createdAt?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
}

// In-memory storage for users (will be persisted through API routes)
export const users: User[] = [
  {
    id: "1",
    email: "test@example.com",
    password: "password", // In a real app, this should be a hashed password
    firstName: "Test",
    plan: "Free",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    email: "admin@ai-doctor.info",
    password: "admin123", // In a real app, this should be a hashed password
    firstName: "Admin",
    plan: "Premium",
    isActive: true,
    createdAt: "2024-01-01",
  },
]; 