"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PublicChat } from "@/components/PublicChat";
import { UserProfile } from "@/components/UserProfile";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import PlansManagement from "@/components/PlansManagement";
import Link from "next/link";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("chat");
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const { data: session } = useSession();
  const isAdmin = !!(session as any)?.user?.isAdmin;

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
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

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
             <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-md">
         <div className="flex items-center gap-4">
           {logoUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
           ) : (
             <HeartPulseIcon className="w-8 h-8 text-teal-500" />
           )}
           <Link href="/" className="hover:opacity-80 transition-opacity">
             <h1 className="text-xl font-bold text-gray-900 dark:text-white">
               {siteName || "Medical AI Assistant"}
             </h1>
           </Link>
         </div>
        <nav className="flex items-center gap-4">
          <button
            onClick={() => setActiveSection("chat")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeSection === "chat"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveSection("profile")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeSection === "profile"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            Profile
          </button>
          {isAdmin && (
            <a
              href="/admin"
              className="px-4 py-2 rounded-md font-medium transition-colors bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
            >
              Admin Panel
            </a>
          )}
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {activeSection === "chat" && (
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-5xl">
              <PublicChat />
            </div>
          </div>
        )}
                                               {activeSection === "profile" && (
                  <div className="flex items-start justify-center min-h-full py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl">
                      <UserProfile />
                      <SubscriptionStatus />
                      <PlansManagement />
                    </div>
                  </div>
                )}
      </main>
    </div>
  );
}

function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
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