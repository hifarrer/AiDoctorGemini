const fs = require('fs');
const path = require('path');

// Create data directory
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

// Initialize default users
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) {
  const defaultUsers = [
    {
      id: "1",
      email: "test@example.com",
      password: "password",
      firstName: "Test",
      plan: "Free",
      isActive: true,
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      email: "admin@example.com",
      password: "admin123",
      firstName: "Admin",
      plan: "Premium",
      isActive: true,
      createdAt: "2024-01-01",
    },
  ];
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  console.log('Created default users file');
}

// Initialize default plans
const plansFile = path.join(dataDir, 'plans.json');
if (!fs.existsSync(plansFile)) {
  const defaultPlans = [
    {
      id: "1",
      title: "Free",
      description: "Perfect for getting started",
      features: [
        "5 AI consultations per month",
        "Basic health information",
        "Email support",
        "Standard response time"
      ],
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
      isPopular: false,
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
    },
  ];
  fs.writeFileSync(plansFile, JSON.stringify(defaultPlans, null, 2));
  console.log('Created default plans file');
}

// Initialize default settings
const settingsFile = path.join(dataDir, 'settings.json');
if (!fs.existsSync(settingsFile)) {
  const defaultSettings = {
    stripeApiKey: "",
    stripePublishableKey: "",
    siteName: "Health Consultant AI",
    siteDescription: "Your Personal AI Health Assistant",
    contactEmail: "",
    supportEmail: "",
  };
  fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
  console.log('Created default settings file');
}

console.log('Data initialization complete!');
