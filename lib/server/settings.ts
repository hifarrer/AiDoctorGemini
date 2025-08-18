import fs from 'fs';
import path from 'path';

export interface Settings {
  siteName: string;
  contactEmail?: string;
  supportEmail?: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret?: string;
  stripePriceIds?: {
    basic: {
      monthly: string;
      yearly: string;
    };
    premium: {
      monthly: string;
      yearly: string;
    };
  };
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'settings.json');

function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadSettings(): Settings {
  try {
    ensureDataDirectory();
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Return default settings if file doesn't exist or is corrupted
  return {
    siteName: "AI Doctor Chat",
    contactEmail: "",
    supportEmail: "",
    stripeSecretKey: "",
    stripePublishableKey: "",
    stripeWebhookSecret: "",
    stripePriceIds: {
      basic: {
        monthly: "",
        yearly: "",
      },
      premium: {
        monthly: "",
        yearly: "",
      },
    },
  };
}

function saveSettings(settings: Settings) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

let settings: Settings = loadSettings();

export function getSettings(): Settings {
  return settings;
}

export function updateSettings(updates: Partial<Settings>) {
  settings = { ...settings, ...updates };
  saveSettings(settings);
  return settings;
}

export function getStripeConfig() {
  return {
    secretKey: settings.stripeSecretKey,
    publishableKey: settings.stripePublishableKey,
  };
}
