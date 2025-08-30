import { getSettings } from "@/lib/server/settings";

export default async function TestTitlePage() {
  try {
    const settings = await getSettings();
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Settings Debug Page</h1>
        <div className="space-y-2">
          <p><strong>Site Name:</strong> {settings.siteName}</p>
          <p><strong>Site Description:</strong> {settings.siteDescription}</p>
          <p><strong>Contact Email:</strong> {settings.contactEmail}</p>
          <p><strong>Support Email:</strong> {settings.supportEmail}</p>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Raw Database Query Test</h2>
          <p>This page should show the actual values from the database.</p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-red-500">Error fetching settings: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}
