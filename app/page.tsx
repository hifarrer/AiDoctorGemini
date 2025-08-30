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
  const [showcaseImages, setShowcaseImages] = useState<{ image1: string; image2: string; image3: string }>({
    image1: "",
    image2: "",
    image3: ""
  });

  const [isReady, setIsReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, heroRes, showcaseRes] = await Promise.all([
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/faq', { cache: 'no-store' }),
          fetch('/api/landing/hero', { cache: 'no-store' }),
          fetch(`/api/landing/showcase?t=${Date.now()}`, { cache: 'no-store' }),
        ]);
        // Fetch features section separately to avoid failing all
        const featuresFetch = fetch('/api/landing/features', { cache: 'no-store' }).catch(() => null);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSiteName(data.siteName);
          setLogoUrl(data.logoUrl);
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
        if (showcaseRes.ok) {
          const showcase = await showcaseRes.json();
          console.log("📋 [LANDING_PAGE] Received showcase data:", showcase);
          if (showcase && (showcase.image1 || showcase.image2 || showcase.image3)) {
            console.log("✅ [LANDING_PAGE] Setting showcase images:", {
              image1: showcase.image1 || "",
              image2: showcase.image2 || "",
              image3: showcase.image3 || ""
            });
            setShowcaseImages({
              image1: showcase.image1 || "",
              image2: showcase.image2 || "",
              image3: showcase.image3 || ""
            });
          } else {
            console.log("⚠️ [LANDING_PAGE] No showcase images found in data");
          }
        } else {
          console.log("❌ [LANDING_PAGE] Failed to fetch showcase data:", showcaseRes.status);
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
    <div className="min-h-screen bg-[#0f1320] text-[#e7ecf5] relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-[1200px] h-[600px] bg-[#1a1f35] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -top-5 -right-10 w-[900px] h-[500px] bg-[#1a1f35] rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Loading overlay */}
      {!isReady && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f1320]">
          <div className="flex items-center gap-3 text-[#e7ecf5] font-semibold">
            <div className="animate-spin w-[18px] h-[18px] rounded-full border-3 border-[#2a2f44] border-t-[#7ae2ff]"></div>
            Loading...
          </div>
        </div>
      )}

      {/* Header */}
      <header className="container mx-auto px-6 py-6 relative z-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-extrabold text-xl hover:opacity-80 transition-opacity">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#8856ff] to-[#6ae2ff] text-[#08101b] font-black grid place-items-center">+</div>
            <span>Health<span className="text-[#7ae2ff]">Consultant</span></span>
          </Link>
          
          <div className="hidden sm:flex gap-6 text-[#c9d2e2]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/plans" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          
          <div className="hidden sm:flex gap-3">
            <Link href="/auth/login" className="px-4 py-3 rounded-xl border border-[#2a2f44] bg-[#161a2c] text-[#e8edfb] font-semibold hover:bg-[#1e2541] hover:border-[#3a4161] transition-all">Sign In</Link>
            <Link href="/auth/signup" className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#8856ff] to-[#a854ff] text-white font-semibold hover:from-[#7a4bff] hover:to-[#9a44ff] transition-all">Get Started</Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="sm:hidden flex items-center justify-center w-[42px] h-[42px] rounded-[10px] border border-[#2a2f44] bg-[#161a2c] text-[#e8edfb]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden absolute right-6 top-16 z-20 bg-[#0f1325] border border-[#1e2541] rounded-xl p-2 min-w-[200px]">
            <a href="#features" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>How it Works</a>
            <a href="#faq" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <Link href="/plans" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link href="/contact" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            <Link href="/auth/login" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
            <Link href="/auth/signup" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-6 relative z-10" style={{ opacity: isReady ? 1 : 0 }}>
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 items-start mt-6">
          {/* Left section */}
          <section>
            <div className="text-[#a8b1c6] font-semibold tracking-wider uppercase text-xs">AI-POWERED WELLNESS</div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mt-3 mb-2 tracking-tight">
              Your Personal <span className="bg-gradient-to-r from-[#8a6bff] via-[#c87cff] to-[#8a6bff] bg-clip-text text-transparent">AI</span><br />
              <span className="bg-gradient-to-r from-[#6ae2ff] via-[#7df3cf] to-[#6ae2ff] bg-clip-text text-transparent">Health</span> Assistant
            </h1>
            <p className="text-[#b7c1d6] max-w-[680px] mt-2 mb-5 text-base">
              Upload a health photo or report and get instant, privacy-first insights. 
              Receive a clean PDF summary and have an AI consultant explain the results in simple language.
            </p>

            {/* Steps grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="grid grid-cols-[56px_1fr] gap-4 items-start bg-gradient-to-b from-[#12182c] to-[#0f1325] border border-[#1e2541] rounded-2xl p-4 min-h-[112px]">
                <div className="w-14 h-14 rounded-4 bg-gradient-to-br from-[#1a2040] to-[#10152d] border border-[#243055] grid place-items-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <rect x="4" y="4" width="16" height="16" rx="3" stroke="#7a86ff" strokeWidth="1.4"/>
                    <path d="M9 9h6v6H9z" fill="#7a86ff"/>
                  </svg>
                </div>
                <div>
                  <small className="text-[#8ea2c8] font-bold tracking-wider uppercase text-xs">STEP 1</small>
                  <h4 className="mt-1 mb-1 text-base font-semibold">AI instantly analyzes</h4>
                  <p className="text-[#9fb0cf] text-sm leading-relaxed">Upload a photo or health report.</p>
                </div>
              </div>

              <div className="grid grid-cols-[56px_1fr] gap-4 items-start bg-gradient-to-b from-[#12182c] to-[#0f1325] border border-[#1e2541] rounded-2xl p-4 min-h-[112px]">
                <div className="w-14 h-14 rounded-4 bg-gradient-to-br from-[#1a2040] to-[#10152d] border border-[#243055] grid place-items-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="#6ae2ff" strokeWidth="1.4"/>
                    <path d="M14 3v6h6" stroke="#6ae2ff" strokeWidth="1.4"/>
                    <path d="M8 13h8M8 17h8" stroke="#3ac5e9" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <small className="text-[#8ea2c8] font-bold tracking-wider uppercase text-xs">STEP 2</small>
                  <h4 className="mt-1 mb-1 text-base font-semibold">Get a personalized Health Report</h4>
                  <p className="text-[#9fb0cf] text-sm leading-relaxed">Clear metrics and ranges you can keep.</p>
                </div>
              </div>

              <div className="grid grid-cols-[56px_1fr] gap-4 items-start bg-gradient-to-b from-[#12182c] to-[#0f1325] border border-[#1e2541] rounded-2xl p-4 min-h-[112px]">
                <div className="w-14 h-14 rounded-4 bg-gradient-to-br from-[#1a2040] to-[#10152d] border border-[#243055] grid place-items-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <circle cx="12" cy="8" r="3.5" stroke="#b47bff" strokeWidth="1.4"/>
                    <rect x="6.5" y="13.5" width="11" height="5.5" rx="1.2" stroke="#b47bff" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <small className="text-[#8ea2c8] font-bold tracking-wider uppercase text-xs">STEP 3</small>
                  <h4 className="mt-1 mb-1 text-base font-semibold">AI Consultant explains</h4>
                  <p className="text-[#9fb0cf] text-sm leading-relaxed">Understand what your numbers mean.</p>
                </div>
              </div>

              <div className="grid grid-cols-[56px_1fr] gap-4 items-start bg-gradient-to-b from-[#12182c] to-[#0f1325] border border-[#1e2541] rounded-2xl p-4 min-h-[112px]">
                <div className="w-14 h-14 rounded-4 bg-gradient-to-br from-[#1a2040] to-[#10152d] border border-[#243055] grid place-items-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <rect x="3" y="4" width="18" height="13" rx="3" stroke="#8cefcf" strokeWidth="1.4"/>
                    <path d="M8 10h8M8 7.8h8M8 12.2h5" stroke="#5de0b9" strokeWidth="1.4"/>
                    <path d="M8 21l4-4h7" stroke="#3ed1a3" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <small className="text-[#8ea2c8] font-bold tracking-wider uppercase text-xs">PLUS</small>
                  <h4 className="mt-1 mb-1 text-base font-semibold">Ask follow-up questions</h4>
                  <p className="text-[#9fb0cf] text-sm leading-relaxed">24/7 assistant for quick answers.</p>
                </div>
              </div>
            </div>

            {/* CTA section */}
            <div className="flex items-center gap-4 flex-wrap my-3">
              <Link href="/auth/signup" className="px-6 py-4 rounded-4 bg-gradient-to-r from-[#8856ff] to-[#a854ff] text-white font-semibold text-base hover:from-[#7a4bff] hover:to-[#9a44ff] transition-all">GET INSTANT RESULT</Link>
              <div className="flex gap-4 flex-wrap">
                <div className="flex gap-2 items-center text-[#b8c2d8] bg-[#11162a] border border-[#212a46] px-3 py-2 rounded-xl font-semibold text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l1.6 3.6L17 7.2l-3.4 1.6L12 12l-1.6-3.2L7 7.2l3.4-1.6L12 2z" fill="#9ad0ff"/>
                  </svg>
                  AI-Powered Insights
                </div>
                <div className="flex gap-2 items-center text-[#b8c2d8] bg-[#11162a] border border-[#212a46] px-3 py-2 rounded-xl font-semibold text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l8 4v5c0 5-3.4 7.9-8 9-4.6-1.1-8-4-8-9V7l8-4z" stroke="#93ffc7" strokeWidth="1.4"/>
                    <path d="M9 12l2 2 4-4" stroke="#93ffc7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  HIPAA Compliant
                </div>
                <div className="flex gap-2 items-center text-[#b8c2d8] bg-[#11162a] border border-[#212a46] px-3 py-2 rounded-xl font-semibold text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#9ad0ff" strokeWidth="1.4"/>
                    <path d="M12 7v6l4 2" stroke="#9ad0ff" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  24/7 Available
                </div>
              </div>
            </div>

            <p className="text-[#90a0bf] text-sm mt-2">
              * The scan result is not a diagnosis. <b>To obtain an accurate diagnosis and treatment recommendation consult your doctor.</b>
            </p>
          </section>

          {/* Right section - Image Slider */}
          <aside className="lg:mt-16">
            <div className="h-[240px] sm:h-[320px] md:h-[460px] lg:h-[520px] flex items-center justify-center">
              <ImageSlider images={[
                '/images/aihealth1.jpg',
                '/images/aihealth2.jpg',
                '/images/aihealth3.jpg',
                '/images/aihealth4.jpg'
              ]} />
            </div>
          </aside>
        </div>
      </main>

      {/* Image Showcase */}
      {showcaseImages.image1 || showcaseImages.image2 || showcaseImages.image3 ? (
        <section className="py-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
              {showcaseImages.image1 && (
                <div className="col-span-2 sm:col-span-1">
                  <img src={showcaseImages.image1} alt="Showcase 1" className="w-full h-[220px] sm:h-[160px] object-cover rounded-2xl border border-[#1e2541] shadow-2xl" />
                </div>
              )}
              {showcaseImages.image2 && (
                <div className="col-span-2 sm:col-span-1">
                  <img src={showcaseImages.image2} alt="Showcase 2" className="w-full h-[220px] sm:h-[160px] object-cover rounded-2xl border border-[#1e2541] shadow-2xl" />
                </div>
              )}
              {showcaseImages.image3 && (
                <div className="col-span-2">
                  <img src={showcaseImages.image3} alt="Showcase 3" className="w-full h-[260px] sm:h-[200px] object-cover rounded-2xl border border-[#1e2541] shadow-2xl" />
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-[#0f1320] to-[#0a0e1a]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-15">
            <div className="text-[#a8b1c6] font-semibold tracking-wider uppercase text-xs">KEY FEATURES</div>
            <h2 className="text-5xl font-extrabold mt-4 mb-4 text-[#e7ecf5]">
              {featuresTitle || "Advanced AI Health Analysis"}
            </h2>
            <p className="text-[#b7c1d6] max-w-[600px] mx-auto text-lg">
              {featuresSubtitle || "Experience the future of health monitoring with our cutting-edge AI technology"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.id} className="grid grid-cols-[56px_1fr] gap-4 items-start bg-gradient-to-b from-[#12182c] to-[#0f1325] border border-[#1e2541] rounded-2xl p-4">
                <div className="w-14 h-14 rounded-4 bg-gradient-to-br from-[#1a2040] to-[#10152d] border border-[#243055] grid place-items-center">
                  {feature.icon === 'image' ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                      <rect x="4" y="4" width="16" height="16" rx="3" stroke="#7a86ff" strokeWidth="1.4"/>
                      <path d="M9 9h6v6H9z" fill="#7a86ff"/>
                    </svg>
                  ) : feature.icon === 'shield' ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                      <path d="M12 3l8 4v5c0 5-3.4 7.9-8 9-4.6-1.1-8-4-8-9V7l8-4z" stroke="#93ffc7" strokeWidth="1.4"/>
                      <path d="M9 12l2 2 4-4" stroke="#93ffc7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" stroke="#6ae2ff" strokeWidth="1.4"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="text-xl mb-2 font-semibold">{feature.title}</h4>
                  <p className="text-[#9fb0cf] text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-b from-[#0a0e1a] to-[#0f1320]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-15">
            <div className="text-[#a8b1c6] font-semibold tracking-wider uppercase text-xs">FAQ</div>
            <h2 className="text-5xl font-extrabold mt-4 mb-4 text-[#e7ecf5]">
              Frequently Asked Questions
            </h2>
            <p className="text-[#b7c1d6] max-w-[600px] mx-auto text-lg">
              Have questions? We have answers.
            </p>
          </div>
          
          <div className="max-w-[800px] mx-auto">
            {faqs.length === 0 ? (
              <div className="text-center text-[#9aa4b2] text-base">No FAQs yet.</div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, idx) => (
                  <AccordionItem key={f.id} value={`item-${idx + 1}`}>
                    <AccordionTrigger className="text-[#e7ecf5] text-base font-semibold">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b7c1d6] text-sm leading-relaxed">
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
      <footer className="bg-[#0a0e1a] border-t border-[#1e2541] py-6">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <p className="text-[#9aa4b2] text-sm">
              © 2025 HealthConsultant. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-[#9aa4b2] text-sm hover:text-[#e7ecf5] transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-[#9aa4b2] text-sm hover:text-[#e7ecf5] transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="text-[#9aa4b2] text-sm hover:text-[#e7ecf5] transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 