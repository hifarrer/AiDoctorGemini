"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { ImageSlider } from "@/components/ImageSlider"
import ThemeToggle from "@/components/ThemeToggle"

export default function LandingPage() {
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [heroTitle, setHeroTitle] = useState<string>("");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("");
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [featuresTitle, setFeaturesTitle] = useState<string>("");
  const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("");
  const [features, setFeatures] = useState<Array<{ id: string; title: string; description: string; icon?: string }>>([]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, heroRes] = await Promise.all([
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/faq', { cache: 'no-store' }),
          fetch('/api/landing/hero', { cache: 'no-store' }),
        ]);
        // Fetch features section separately to avoid failing all
        const featuresFetch = fetch('/api/landing/features', { cache: 'no-store' }).catch(() => null);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSiteName(data.siteName || "");
          setLogoUrl(data.logoUrl || "");
        }
        if (faqRes.ok) {
          const items = await faqRes.json();
          console.log("📋 [LANDING_PAGE] Received FAQs from API:", items.length, "items");
          console.log("📝 [LANDING_PAGE] FAQ details:", items.map((f: any) => ({ id: f.id, question: f.question.substring(0, 50) + "..." })));
          setFaqs(Array.isArray(items) ? items : []);
        }
        if (heroRes.ok) {
          const hero = await heroRes.json();
          if (hero && (hero.title || hero.subtitle || hero.images)) {
            if (hero.title) setHeroTitle(hero.title);
            if (typeof hero.subtitle === 'string') setHeroSubtitle(hero.subtitle);
            if (Array.isArray(hero.images) && hero.images.length > 0) setSliderImages(hero.images);
          }
        }
        const fr = await featuresFetch;
        if (fr && fr.ok) {
          const fd = await fr.json();
          if (fd?.section) {
            if (fd.section.title) setFeaturesTitle(fd.section.title);
            if (typeof fd.section.subtitle === 'string') setFeaturesSubtitle(fd.section.subtitle);
          }
          if (Array.isArray(fd?.items)) {
            setFeatures(fd.items.map((it: any) => ({ id: it.id, title: it.title, description: it.description || '', icon: it.icon || undefined })));
          }
        }
      } catch (error) {
        console.error('Error fetching landing data:', error);
      } finally {
        setIsReady(true);
      }
    };
    fetchAll();
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
      {!isReady && (
        <div className="fixed inset-0 z-50 grid place-items-center" style={{
          background:
            'radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%),\nradial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%),\n#0f1320'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e7ecf5', fontWeight: 600 }}>
            <span className="animate-spin" style={{ width: 18, height: 18, borderRadius: 999, border: '3px solid #2a2f44', borderTopColor: '#7ae2ff' }} />
            Loading...
          </div>
        </div>
      )}
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
        .hero {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 40px;
          align-items: start;
          margin-top: 22px;
        }
        @media (max-width: 1024px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }
        .eyebrow {
          color: #a8b1c6;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .title {
          font-size: 56px;
          line-height: 1.05;
          font-weight: 800;
          margin: 10px 0 8px;
          letter-spacing: -0.02em;
        }
        .g-ai {
          background: linear-gradient(90deg, #8a6bff 0%, #c87cff 45%, #8a6bff 90%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .g-health {
          background: linear-gradient(90deg, #6ae2ff 0%, #7df3cf 50%, #6ae2ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .sub {
          color: #b7c1d6;
          max-width: 680px;
          margin: 8px 0 18px;
          font-size: 16px;
        }
        .steps {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin: 26px 0;
        }
        @media (max-width: 640px) {
          .steps {
            grid-template-columns: 1fr;
          }
        }
        .step {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 14px;
          align-items: start;
          background: linear-gradient(180deg, #12182c, #0f1325);
          border: 1px solid #1e2541;
          border-radius: 16px;
          padding: 16px;
          min-height: 112px;
        }
        .icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #1a2040, #10152d);
          border: 1px solid #243055;
        }
        .icon svg {
          width: 26px;
          height: 26px;
        }
        .step small {
          color: #8ea2c8;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .step h4 {
          margin: 2px 0 4px;
          font-size: 16px;
        }
        .step p {
          margin: 0;
          color: #9fb0cf;
          font-size: 13px;
          line-height: 1.45;
        }
        .ctabar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin: 12px 0;
        }
        .btn-xl {
          padding: 16px 24px;
          border-radius: 14px;
          font-size: 16px;
        }
        .badges {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }
        .badge {
          display: flex;
          gap: 10px;
          align-items: center;
          color: #b8c2d8;
          background: #11162a;
          border: 1px solid #212a46;
          padding: 10px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
        }
        .disclaimer {
          color: #90a0bf;
          font-size: 13px;
          margin-top: 6px;
        }
        .phone {
          background: linear-gradient(180deg, #111631, #0b1022);
          border: 1px solid #252f59;
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }
        @media (min-width: 1025px) {
          .phone {
            margin-top: 66px;
          }
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #8e70ff, #6ae1ff);
          display: grid;
          place-items: center;
          color: #0b0f1a;
          font-weight: 900;
        }
        .chip {
          font-size: 12px;
          color: #88ffc8;
          background: #0c1f1a;
          border: 1px solid #1e4b3c;
          padding: 3px 8px;
          border-radius: 999px;
          margin-left: 6px;
        }
        .bubble {
          background: #0f1732;
          border: 1px solid #2a3463;
          color: #dfe6ff;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.45;
        }
        .bubble.purple {
          color: #fff;
          background: linear-gradient(120deg, #7b5cff, #a558ff);
          border: none;
        }
        .input {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          background: #0e142c;
          border: 1px solid #2a3261;
          border-radius: 14px;
          padding: 10px 12px;
        }
        .input input {
          background: transparent;
          border: none;
          outline: none;
          color: #dfe6ff;
          font-size: 14px;
          flex: 1;
        }
        .send {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(120deg, #7b5cff, #a558ff);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .tagline {
          color: #8ca0c5;
          font-size: 12px;
          margin-top: 8px;
          text-align: center;
        }
        .features-section {
          padding: 80px 0;
          background: linear-gradient(180deg, #0f1320, #0a0e1a);
        }
        .faq-section {
          padding: 80px 0;
          background: linear-gradient(180deg, #0a0e1a, #0f1320);
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
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#faq">FAQ</a>
            <a href="/plans">Pricing</a>
            <a href="/contact">Contact</a>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link className="btn" href="/auth/login">Sign In</Link>
            <Link className="btn primary" href="/auth/signup">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="container hero" style={{ opacity: isReady ? 1 : 0 }}>
        {/* LEFT */}
        <section>
          <div className="eyebrow">AI-POWERED WELLNESS</div>
          <h1 className="title">
            Your Personal <span className="g-ai">AI</span><br />
            <span className="g-health">Health</span> Assistant
          </h1>
          <p className="sub">
            Upload a health photo or report and get instant, privacy-first insights. 
            Receive a clean PDF summary and have an AI consultant explain the results in simple language.
          </p>

          <div className="steps">
            <div className="step">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="4" width="16" height="16" rx="3" stroke="#7a86ff" strokeWidth="1.4"/>
                  <path d="M9 9h6v6H9z" fill="#7a86ff"/>
                </svg>
              </div>
              <div>
                <small>STEP 1</small>
                <h4>AI instantly analyzes</h4>
                <p>Upload a photo or health report.</p>
              </div>
            </div>

            <div className="step">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="#6ae2ff" strokeWidth="1.4"/>
                  <path d="M14 3v6h6" stroke="#6ae2ff" strokeWidth="1.4"/>
                  <path d="M8 13h8M8 17h8" stroke="#3ac5e9" strokeWidth="1.4"/>
                </svg>
              </div>
              <div>
                <small>STEP 2</small>
                <h4>Get a personalized Health Report</h4>
                <p>Clear metrics and ranges you can keep.</p>
              </div>
            </div>

            <div className="step">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.5" stroke="#b47bff" strokeWidth="1.4"/>
                  <rect x="6.5" y="13.5" width="11" height="5.5" rx="1.2" stroke="#b47bff" strokeWidth="1.4"/>
                </svg>
              </div>
              <div>
                <small>STEP 3</small>
                <h4>AI Consultant explains</h4>
                <p>Understand what your numbers mean.</p>
              </div>
            </div>

            <div className="step">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="13" rx="3" stroke="#8cefcf" strokeWidth="1.4"/>
                  <path d="M8 10h8M8 7.8h8M8 12.2h5" stroke="#5de0b9" strokeWidth="1.4"/>
                  <path d="M8 21l4-4h7" stroke="#3ed1a3" strokeWidth="1.4"/>
                </svg>
              </div>
              <div>
                <small>PLUS</small>
                <h4>Ask follow-up questions</h4>
                <p>24/7 assistant for quick answers.</p>
              </div>
            </div>
          </div>

          <div className="ctabar">
            <Link className="btn primary btn-xl" href="/auth/signup">GET INSTANT RESULT</Link>
            <div className="badges">
              <div className="badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l1.6 3.6L17 7.2l-3.4 1.6L12 12l-1.6-3.2L7 7.2l3.4-1.6L12 2z" fill="#9ad0ff"/>
                </svg>
                AI-Powered Insights
              </div>
              <div className="badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l8 4v5c0 5-3.4 7.9-8 9-4.6-1.1-8-4-8-9V7l8-4z" stroke="#93ffc7" strokeWidth="1.4"/>
                  <path d="M9 12l2 2 4-4" stroke="#93ffc7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                HIPAA Compliant
              </div>
              <div className="badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#9ad0ff" strokeWidth="1.4"/>
                  <path d="M12 7v6l4 2" stroke="#9ad0ff" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                24/7 Available
              </div>
            </div>
          </div>

          <p className="disclaimer">
            * The scan result is not a diagnosis. <b>To obtain an accurate diagnosis and treatment recommendation consult your doctor.</b>
          </p>
        </section>

        {/* RIGHT - Image Slider */}
        <aside>
          <div className="h-[320px] sm:h-[380px] md:h-[460px] lg:h-[520px] flex items-center justify-center">
            <ImageSlider images={[
              '/images/aihealth1.jpg',
              '/images/aihealth2.jpg',
              '/images/aihealth3.jpg',
              '/images/aihealth4.jpg'
            ]} />
          </div>
        </aside>
      </main>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="eyebrow">KEY FEATURES</div>
            <h2 style={{ fontSize: '48px', fontWeight: '800', margin: '16px 0', color: '#e7ecf5' }}>
              {featuresTitle || "Advanced AI Health Analysis"}
            </h2>
            <p style={{ color: '#b7c1d6', maxWidth: '600px', margin: '0 auto', fontSize: '18px' }}>
              {featuresSubtitle || "Experience the future of health monitoring with our cutting-edge AI technology"}
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {features.map((feature) => (
              <div key={feature.id} className="step" style={{ minHeight: 'auto' }}>
                <div className="icon">
                  {feature.icon === 'image' ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="3" stroke="#7a86ff" strokeWidth="1.4"/>
                      <path d="M9 9h6v6H9z" fill="#7a86ff"/>
                    </svg>
                  ) : feature.icon === 'shield' ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 3l8 4v5c0 5-3.4 7.9-8 9-4.6-1.1-8-4-8-9V7l8-4z" stroke="#93ffc7" strokeWidth="1.4"/>
                      <path d="M9 12l2 2 4-4" stroke="#93ffc7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" stroke="#6ae2ff" strokeWidth="1.4"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>{feature.title}</h4>
                  <p style={{ color: '#9fb0cf', fontSize: '14px', lineHeight: '1.5' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
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
        </div>
      </section>

      {/* Footer */}
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
  )
} 