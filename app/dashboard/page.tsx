"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PublicChat } from "@/components/PublicChat";
import { UserProfile } from "@/components/UserProfile";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import PlansManagement from "@/components/PlansManagement";
import InteractionUsage from "@/components/InteractionUsage";
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
    <div className="min-h-screen" style={{
      '--bg': '#0f1320',
      '--text': '#e7ecf5',
      '--muted': '#9aa4b2',
      '--cta': '#8856ff',
      '--cta-2': '#a854ff',
      '--accent': '#6ae2ff'
    } as React.CSSProperties}>
      <style jsx global>{`
        :root {
          --bg: #0f1320;
          --text: #e7ecf5;
          --muted: #9aa4b2;
          --cta: #8856ff;
          --cta-2: #a854ff;
          --accent: #6ae2ff;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
          background:
            radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%),
            radial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%),
            var(--bg);
          color: var(--text);
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        .container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 24px;
        }
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 20px;
          transition: opacity 0.2s ease;
        }
        .logo:hover {
          opacity: 0.8;
        }
        .logo-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--cta), var(--accent));
          color: #08101b;
          font-weight: 900;
        }
        .navlinks {
          display: flex;
          gap: 26px;
          color: #c9d2e2;
        }
        .btn {
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid #2a2f44;
          background: #161a2c;
          color: #e8edfb;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn:hover {
          background: #1e2541;
          border-color: #3a4161;
        }
        .btn.primary {
          background: linear-gradient(90deg, var(--cta), var(--cta-2));
          border: none;
          color: #fff;
        }
        .btn.primary:hover {
          background: linear-gradient(90deg, #7a4bff, #9a44ff);
        }
        .btn.active {
          background: linear-gradient(90deg, var(--cta), var(--cta-2));
          border: none;
          color: #fff;
        }
        .btn.admin {
          background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
          border: none;
          color: #fff;
        }
        .btn.admin:hover {
          background: linear-gradient(90deg, #ff5252, #ff7676);
        }
        .dashboard-content {
          background: linear-gradient(180deg, #12182c, #0f1325);
          border: 1px solid #1e2541;
          border-radius: 20px;
          padding: 32px;
          margin: 24px 0;
          min-height: calc(100vh - 200px);
        }
        .footer {
          background: #0a0e1a;
          border-top: 1px solid #1e2541;
          padding: 24px;
          margin-top: auto;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1240px;
          margin: 0 auto;
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-links a {
          color: #9aa4b2;
          font-size: 14px;
          transition: color 0.2s ease;
        }
        .footer-links a:hover {
          color: #e7ecf5;
        }
      `}</style>

      <header className="container">
        <nav className="nav">
          <Link href="/" className="logo">
            <div className="logo-badge">+</div>
            <span>Health<span style={{ color: '#7ae2ff' }}>Consultant</span></span>
          </Link>
          <div className="navlinks">
            <button
              onClick={() => setActiveSection("chat")}
              className={`btn ${activeSection === "chat" ? "active" : ""}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveSection("profile")}
              className={`btn ${activeSection === "profile" ? "active" : ""}`}
            >
              Profile
            </button>
            {isAdmin && (
              <Link href="/admin" className="btn admin">
                Admin Panel
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="container">
        <div className="dashboard-content">
          {activeSection === "chat" && (
            <div className="w-full h-full">
              <PublicChat />
            </div>
          )}
          {activeSection === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              <div className="space-y-8">
                <UserProfile />
                <InteractionUsage />
              </div>
              <div className="space-y-8">
                <SubscriptionStatus />
                <PlansManagement />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p style={{ color: '#9aa4b2', fontSize: '14px' }}>
            © 2025 HealthConsultant. All rights reserved.
          </p>
          <div className="footer-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeartPulseIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}