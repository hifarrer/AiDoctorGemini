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
  const [chatTheme, setChatTheme] = useState<'light' | 'dark'>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
          setSiteName(data.siteName);
          setLogoUrl(data.logoUrl);
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSiteSettings();
  }, []);

  // Handle Google Ads conversion tracking after successful payment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use URLSearchParams to safely read query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionSuccess = urlParams.get('subscription');
    const sessionId = urlParams.get('session_id');

    if (subscriptionSuccess === 'success' && sessionId) {
      // Check if gtag is available
      if ((window as any).gtag) {
        // Fetch session details to get transaction ID
        fetch(`/api/stripe/session?session_id=${sessionId}`)
          .then(res => res.json())
          .then(data => {
            if (data.transactionId) {
              // Fire conversion event
              (window as any).gtag('event', 'conversion', {
                'send_to': 'AW-17548478207/UEmACLiqy5kbEP-N4q9B',
                'value': data.amountTotal || 1.0,
                'currency': data.currency || 'USD',
                'transaction_id': data.transactionId
              });
              console.log('Google Ads conversion event fired:', data.transactionId);
            }
          })
          .catch(error => {
            console.error('Error fetching session details for conversion tracking:', error);
            // Fallback: fire conversion with session_id as transaction_id
            (window as any).gtag('event', 'conversion', {
              'send_to': 'AW-17548478207/UEmACLiqy5kbEP-N4q9B',
              'value': 1.0,
              'currency': 'USD',
              'transaction_id': sessionId
            });
          });
      } else {
        // If gtag is not loaded yet, wait a bit and try again
        const checkGtag = setInterval(() => {
          if ((window as any).gtag) {
            clearInterval(checkGtag);
            fetch(`/api/stripe/session?session_id=${sessionId}`)
              .then(res => res.json())
              .then(data => {
                if (data.transactionId) {
                  (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17548478207/UEmACLiqy5kbEP-N4q9B',
                    'value': data.amountTotal || 1.0,
                    'currency': data.currency || 'USD',
                    'transaction_id': data.transactionId
                  });
                  console.log('Google Ads conversion event fired:', data.transactionId);
                }
              })
              .catch(error => {
                console.error('Error fetching session details for conversion tracking:', error);
                (window as any).gtag('event', 'conversion', {
                  'send_to': 'AW-17548478207/UEmACLiqy5kbEP-N4q9B',
                  'value': 1.0,
                  'currency': 'USD',
                  'transaction_id': sessionId
                });
              });
          }
        }, 100);

        // Clear interval after 5 seconds if gtag still not loaded
        setTimeout(() => clearInterval(checkGtag), 5000);
      }
    }
  }, []);

  return (
    <div className="min-h-screen" style={{
      '--bg': chatTheme === 'light' ? '#ffffff' : '#0f1320',
      '--text': chatTheme === 'light' ? '#1a1a1a' : '#e7ecf5',
      '--muted': chatTheme === 'light' ? '#6b7280' : '#9aa4b2',
      '--cta': '#8856ff',
      '--cta-2': '#a854ff',
      '--accent': '#6ae2ff'
    } as React.CSSProperties}>
      <style jsx global>{`
        :root {
          --bg: ${chatTheme === 'light' ? '#ffffff' : '#0f1320'};
          --text: ${chatTheme === 'light' ? '#1a1a1a' : '#e7ecf5'};
          --muted: ${chatTheme === 'light' ? '#6b7280' : '#9aa4b2'};
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
          background: ${chatTheme === 'light' 
            ? 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
            : `radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%),
               radial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%),
               var(--bg)`};
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
          background: ${chatTheme === 'light' 
            ? 'linear-gradient(180deg, #ffffff, #f8fafc)' 
            : 'linear-gradient(180deg, #12182c, #0f1325)'};
          border: 1px solid ${chatTheme === 'light' ? '#e5e7eb' : '#1e2541'};
          border-radius: 20px;
          padding: 32px;
          margin: 24px 0;
          min-height: calc(100vh - 200px);
        }
        .footer {
          background: ${chatTheme === 'light' ? '#f8fafc' : '#0a0e1a'};
          border-top: 1px solid ${chatTheme === 'light' ? '#e5e7eb' : '#1e2541'};
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
        /* Mobile nav */
        .menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #2a2f44;
          background: #161a2c;
          color: #e8edfb;
        }
        .mobile-menu {
          display: none;
          position: absolute;
          right: 24px;
          top: 64px;
          z-index: 20;
          background: #0f1325;
          border: 1px solid #1e2541;
          border-radius: 12px;
          padding: 8px;
          min-width: 180px;
        }
        .mobile-menu a, .mobile-menu button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border-radius: 8px;
          color: #c9d2e2;
          background: transparent;
          border: none;
        }
        .mobile-menu a:hover, .mobile-menu button:hover {
          background: #1e2541;
          color: #fff;
        }
        @media (max-width: 640px) {
          .nav {
            position: relative;
          }
          .navlinks {
            display: none;
          }
          .menu-toggle {
            display: flex;
          }
          .mobile-menu {
            display: block;
          }
        }
      `}</style>

      <header className="container">
        <nav className="nav">
          <Link href="/" className="logo">
            <div className="logo-badge">+</div>
            <span>Health<span style={{ color: '#7ae2ff' }}>Consultant</span></span>
          </Link>
          <div className="navlinks" style={{ gap: 12 }}>
            <button
              onClick={() => setActiveSection("chat")}
              className={`btn ${activeSection === "chat" ? "active" : ""}`}
              style={{ padding: '10px 12px' }}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveSection("profile")}
              className={`btn ${activeSection === "profile" ? "active" : ""}`}
              style={{ padding: '10px 12px' }}
            >
              Profile
            </button>
            <Link href="/health-history" className="btn" style={{ padding: '10px 12px' }}>
              Health History
            </Link>
            {isAdmin && (
              <Link href="/admin" className="btn admin" style={{ padding: '10px 12px' }}>
                Admin Panel
              </Link>
            )}
          </div>
          <button aria-label="Open menu" className="menu-toggle" onClick={() => setIsMenuOpen(v => !v)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </nav>
        {isMenuOpen && (
          <div className="mobile-menu" onMouseLeave={() => setIsMenuOpen(false)}>
            <button onClick={() => { setActiveSection('chat'); setIsMenuOpen(false); }}>Chat</button>
            <button onClick={() => { setActiveSection('profile'); setIsMenuOpen(false); }}>Profile</button>
            <Link href="/health-history" onClick={() => setIsMenuOpen(false)}>Health History</Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
            )}
          </div>
        )}
      </header>

      <main className="container">
        <div className="dashboard-content">
          {activeSection === "chat" && (
            <div className="w-full h-full">
              <div className="flex items-center justify-end mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatTheme('light')}
                    className={`px-3 py-1 rounded-md text-sm border ${chatTheme === 'light' ? 'bg-[#1e2541] border-[#3a4161] text-white' : 'bg-transparent border-[#2a2f44] text-[#c9d2e2]'}`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setChatTheme('dark')}
                    className={`px-3 py-1 rounded-md text-sm border ${chatTheme === 'dark' ? 'bg-[#1e2541] border-[#3a4161] text-white' : 'bg-transparent border-[#2a2f44] text-[#c9d2e2]'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>
              <PublicChat chatTheme={chatTheme} />
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
          <p style={{ color: chatTheme === 'light' ? '#6b7280' : '#9aa4b2', fontSize: '14px' }}>
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