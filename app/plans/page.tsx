"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SubscriptionModal from "@/components/SubscriptionModal";
import toast from "react-hot-toast";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function PlansPage() {
  const { data: session } = useSession();
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setPlansList(data);
        } else {
          console.error('Failed to fetch plans');
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch('/api/faq', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setFaqs(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch FAQs');
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };

    fetchFaqs();
  }, []);

  const handleSubscribe = (plan: Plan) => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = "/auth/login";
      return;
    }
    
    // Open subscription modal for paid plans
    if (plan.title !== 'Free') {
      setSelectedPlan(plan);
      setIsSubscriptionModalOpen(true);
    } else {
      // Handle free plan subscription
      console.log(`User ${session.user?.email} wants to subscribe to ${plan.title}`);
      toast.success('Free plan activated!');
    }
  };

  const handleSubscriptionSuccess = () => {
    // Refresh user data or update UI
    toast.success('Subscription successful! Welcome to your new plan.');
  };

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/settings');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0f1320' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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
        .eyebrow {
          color: #a8b1c6;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .title {
          font-size: 48px;
          line-height: 1.05;
          font-weight: 800;
          margin: 16px 0;
          letter-spacing: -0.02em;
          color: #e7ecf5;
        }
        .sub {
          color: #b7c1d6;
          max-width: 600px;
          margin: 0 auto;
          font-size: 18px;
        }
        .plan-card {
          background: linear-gradient(180deg, #12182c, #0f1325);
          border: 1px solid #1e2541;
          border-radius: 20px;
          padding: 32px;
          transition: all 0.3s ease;
        }
        .plan-card:hover {
          transform: translateY(-4px);
          border-color: #2a3463;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .plan-card.popular {
          border: 2px solid #8856ff;
          background: linear-gradient(180deg, #1a1f35, #0f1325);
        }
        .popular-badge {
          background: linear-gradient(90deg, var(--cta), var(--cta-2));
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
        }
        .price {
          font-size: 48px;
          font-weight: 800;
          color: #e7ecf5;
          margin: 16px 0;
        }
        .price-period {
          color: #9aa4b2;
          font-size: 16px;
        }
        .feature-list {
          list-style: none;
          padding: 0;
          margin: 24px 0;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          color: #b7c1d6;
        }
        .feature-icon {
          width: 20px;
          height: 20px;
          color: #6ae2ff;
          flex-shrink: 0;
        }
        .subscribe-btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .subscribe-btn.primary {
          background: linear-gradient(90deg, var(--cta), var(--cta-2));
          color: white;
        }
        .subscribe-btn.primary:hover {
          background: linear-gradient(90deg, #7a4bff, #9a44ff);
        }
        .subscribe-btn.secondary {
          background: #161a2c;
          color: #e8edfb;
          border: 1px solid #2a2f44;
        }
        .subscribe-btn.secondary:hover {
          background: #1e2541;
          border-color: #3a4161;
        }
        .faq-section {
          background: linear-gradient(180deg, #0a0e1a, #0f1320);
          padding: 80px 0;
          margin-top: 80px;
        }

        .cta-section {
          background: linear-gradient(180deg, #0f1320, #0a0e1a);
          padding: 80px 0;
        }
        .cta-card {
          background: linear-gradient(180deg, #12182c, #0f1325);
          border: 1px solid #1e2541;
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        .footer {
          background: #0a0e1a;
          border-top: 1px solid #1e2541;
          padding: 24px;
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
            <a href="/#features">Features</a>
            <a href="/#how-it-works">How it Works</a>
            <a href="/#faq">FAQ</a>
            <a href="/plans">Pricing</a>
            <a href="/contact">Contact</a>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {session ? (
              <Link className="btn primary" href="/dashboard">Go to Dashboard</Link>
            ) : (
              <>
                <Link className="btn" href="/auth/login">Sign In</Link>
                <Link className="btn primary" href="/auth/signup">Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="container" style={{ paddingTop: '60px' }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="eyebrow">PRICING PLANS</div>
          <h1 className="title">Choose Your Plan</h1>
          <p className="sub">
            Get the perfect AI medical assistance plan for your needs. 
            Start with our free plan and upgrade as you grow.
          </p>
        </div>

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 350px))', gap: '32px', maxWidth: '800px', margin: '0 auto', justifyContent: 'center' }}>
          {plansList.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.isPopular ? 'popular' : ''}`}
              style={{ position: 'relative' }}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="popular-badge">Most Popular</div>
              )}

              {/* Plan Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#e7ecf5', marginBottom: '8px' }}>
                  {plan.title}
                </h3>
                <p style={{ color: '#9aa4b2', fontSize: '14px' }}>
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div className="price">${plan.monthlyPrice}</div>
                <div className="price-period">/month</div>
                <div style={{ color: '#9aa4b2', fontSize: '14px', marginTop: '8px' }}>
                  ${plan.yearlyPrice}/year
                  {plan.monthlyPrice > 0 && (
                    <span style={{ color: '#6ae2ff', marginLeft: '8px' }}>
                      (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="feature-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <CheckIcon className="feature-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              <div style={{ marginTop: '32px' }}>
                {session ? (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={`subscribe-btn ${plan.isPopular ? 'primary' : 'secondary'}`}
                  >
                    {plan.title === 'Free' ? 'Get Started' : 'Subscribe Now'}
                  </button>
                ) : (
                  <Link href="/auth/login">
                    <button
                      className={`subscribe-btn ${plan.isPopular ? 'primary' : 'secondary'}`}
                    >
                      {plan.title === 'Free' ? 'Get Started' : 'Subscribe Now'}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="eyebrow">FAQ</div>
            <h2 style={{ fontSize: '48px', fontWeight: '800', margin: '16px 0', color: '#e7ecf5' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: '#b7c1d6', maxWidth: '600px', margin: '0 auto', fontSize: '18px' }}>
              Have questions? We have answers.
            </p>
          </div>
          
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {faqs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9aa4b2', fontSize: '16px' }}>No FAQs yet.</div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, idx) => (
                  <AccordionItem key={f.id} value={`item-${idx + 1}`}>
                    <AccordionTrigger style={{ color: '#e7ecf5', fontSize: '16px', fontWeight: '600' }}>
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent style={{ color: '#b7c1d6', fontSize: '14px', lineHeight: '1.6' }}>
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-card">
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', color: '#e7ecf5' }}>
              Ready to get started?
            </h2>
            <p style={{ color: '#b7c1d6', fontSize: '18px', marginBottom: '32px' }}>
              Join thousands of users who trust our AI medical assistance platform.
            </p>
            {session ? (
              <Link href="/dashboard">
                <button className="subscribe-btn primary">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/auth/signup">
                <button className="subscribe-btn primary">
                  Get Started Free
                </button>
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* App Download Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a 
              href="https://apps.apple.com/us/app/health-consultant-ai/id6754229345" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img 
                src="https://res.cloudinary.com/dqemas8ht/image/upload/v1762298292/applestore_nbfd12.png" 
                alt="Download on the App Store" 
                style={{ height: '40px', width: 'auto' }}
              />
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=ai.healthconsultant.mobile" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img 
                src="https://res.cloudinary.com/dqemas8ht/image/upload/v1762298292/googleplay_oight1.png" 
                alt="Get it on Google Play" 
                style={{ height: '40px', width: 'auto' }}
              />
            </a>
          </div>
          
          {/* Footer Links */}
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
        </div>
      </footer>

      {/* Subscription Modal */}
      {selectedPlan && (
        <SubscriptionModal
          plan={selectedPlan}
          isOpen={isSubscriptionModalOpen}
          onClose={() => {
            setIsSubscriptionModalOpen(false);
            setSelectedPlan(null);
          }}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
