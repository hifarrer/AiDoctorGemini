"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface Settings {
  stripeApiKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret?: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  logoUrl?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    stripeApiKey: "",
    stripePublishableKey: "",
    stripeWebhookSecret: "",
            siteName: "",
    siteDescription: "",
    contactEmail: "",
    supportEmail: "",
    logoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          const normalized: Settings = {
            stripeApiKey: data.stripeApiKey || "",
            stripePublishableKey: data.stripePublishableKey || "",
            stripeWebhookSecret: data.stripeWebhookSecret || "",
            siteName: data.siteName || "",
            siteDescription: data.siteDescription || "",
            contactEmail: data.contactEmail || "",
            supportEmail: data.supportEmail || "",
            logoUrl: data.logoUrl || "",
          };
          setSettings(normalized);
        } else {
          console.error("Failed to fetch settings");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestStripeConnection = async () => {
    if (!settings.stripeApiKey) {
      toast.error("Please enter a Stripe API key first");
      return;
    }

    try {
      const response = await fetch("/api/admin/settings/test-stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: settings.stripeApiKey }),
      });

      if (response.ok) {
        toast.success("Stripe connection successful!");
      } else {
        toast.error("Stripe connection failed. Please check your API key.");
      }
    } catch (error) {
      toast.error("An error occurred while testing Stripe connection");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your application settings and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stripe Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Stripe Integration
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stripeApiKey">Stripe Secret Key</Label>
              <Input
                id="stripeApiKey"
                type="password"
                value={settings.stripeApiKey}
                onChange={(e) =>
                  setSettings({ ...settings, stripeApiKey: e.target.value })
                }
                placeholder="sk_test_..."
                className="mt-1"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your Stripe secret key for processing payments
              </p>
            </div>

            <div>
              <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
              <Input
                id="stripePublishableKey"
                type="text"
                value={settings.stripePublishableKey}
                onChange={(e) =>
                  setSettings({ ...settings, stripePublishableKey: e.target.value })
                }
                placeholder="pk_test_..."
                className="mt-1"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your Stripe publishable key for client-side integration
              </p>
            </div>

            <div>
              <Label htmlFor="stripeWebhookSecret">Stripe Webhook Signing Secret</Label>
              <Input
                id="stripeWebhookSecret"
                type="password"
                value={settings.stripeWebhookSecret || ""}
                onChange={(e) =>
                  setSettings({ ...settings, stripeWebhookSecret: e.target.value })
                }
                placeholder="whsec_..."
                className="mt-1"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                From Stripe Dashboard → Developers → Webhooks → your endpoint → Reveal signing secret
              </p>
            </div>

            {/* Stripe Price IDs removed. Manage price IDs per plan in Admin > Plans. */}

            <Button
              onClick={handleTestStripeConnection}
              variant="outline"
              className="w-full"
            >
              Test Stripe Connection
            </Button>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://..."
                value={settings.logoUrl || ""}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="mt-1"
              />
              {settings.logoUrl && (
                <div className="mt-3">
                  <div className="relative w-40 h-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use a transparent PNG/SVG if possible. The image will be scaled responsively.</p>
            </div>

            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) =>
                  setSettings({ ...settings, siteDescription: e.target.value })
                }
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-2"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Stripe Integration
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Configure your Stripe API keys to enable payment processing. 
            Make sure to use test keys during development and switch to live keys for production.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Security Note
          </h3>
          <p className="text-green-700 dark:text-green-300 text-sm">
            Your Stripe secret key is encrypted and stored securely. 
            Never share your secret key publicly or commit it to version control.
          </p>
        </div>
      </div>
    </div>
  );
}
