"use client";

import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { createClient } from '@supabase/supabase-js'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { useSession } from "next-auth/react"
 
import ThemeToggle from "@/components/ThemeToggle"

export default function LandingPage() {
  const { data: session } = useSession();
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [heroTitle, setHeroTitle] = useState<string>("");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("");
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [heroBackgroundColor, setHeroBackgroundColor] = useState<string>("gradient-blue");
  const [heroTitleAccent1, setHeroTitleAccent1] = useState<string>('#a855f7');
  const [heroTitleAccent2, setHeroTitleAccent2] = useState<string>('#14b8a6');
  const [featuresTitle, setFeaturesTitle] = useState<string>("");
  const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("");
  const [features, setFeatures] = useState<Array<{ id: string; title: string; description: string; icon?: string }>>([]);
  const [featuresBackgroundColor, setFeaturesBackgroundColor] = useState<string>('solid-blue');
  const [featuresTitleAccent1, setFeaturesTitleAccent1] = useState<string>('#a855f7');
  const [featuresTitleAccent2, setFeaturesTitleAccent2] = useState<string>('#14b8a6');
  const [showcaseImages, setShowcaseImages] = useState<{ image1: string; image2: string; image3: string }>({
    image1: "",
    image2: "",
    image3: ""
  });

  const [isReady, setIsReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Client-side Supabase for live reads (avoids API caching)
  const supabaseBrowser = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  ), []);

  // Function returns stable theme utility classes; the actual colors are driven by CSS variables
  const getBackgroundClasses = (_bgColor: string) => {
    return {
      background: 'theme-bg',
      text: 'theme-text',
      textSecondary: 'theme-text-secondary',
      cardBg: 'theme-card-bg',
      cardBorder: 'theme-card-border',
      cardIconBg: 'theme-icon-bg',
      cardIconBorder: 'theme-icon-border'
    } as const;
  };

  // Function to apply accent colors to title words
  const applyAccentColors = (title: string, accent1: string, accent2: string) => {
    if (!title) return title;
    
    console.log('🎨 [LANDING_PAGE] applyAccentColors called with:', { title, accent1, accent2 });
    
    // Split title into words and apply colors to "AI" and "Health"
    const words = title.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord === 'ai') {
        console.log('🎨 [LANDING_PAGE] Applying accent1 color to AI:', accent1);
        return <span key={index} style={{ color: accent1 }}>{word}</span>;
      } else if (cleanWord === 'health') {
        console.log('🎨 [LANDING_PAGE] Applying accent2 color to Health:', accent2);
        return <span key={index} style={{ color: accent2 }}>{word}</span>;
      } else {
        return <span key={index}>{word}</span>;
      }
    }).reduce((acc, curr, index) => {
      if (index === 0) return [curr];
      return [...acc, ' ', curr];
    }, [] as React.ReactNode[]);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        console.log('🔄 [LANDING_PAGE] Fetching fresh data...');
        const [settingsRes, faqRes, showcaseRes] = await Promise.all([
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/faq', { cache: 'no-store' }),
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
        // Fetch hero data directly from Supabase (client-side) to bypass any API caching
        const { data: hero, error: heroErr } = await supabaseBrowser
          .from('landing_hero')
          .select('id, title, subtitle, images, background_color, title_accent1, title_accent2, updated_at')
          .eq('id', 1)
          .single();

        if (heroErr) {
          console.error('❌ [LANDING_PAGE] Error fetching hero from Supabase:', heroErr);
        } else if (hero) {
          console.log("📋 [LANDING_PAGE] Received hero data (Supabase):", hero);
          console.log("📋 [LANDING_PAGE] Hero background_color field:", hero.background_color);
          console.log("📋 [LANDING_PAGE] Hero background_color type:", typeof hero.background_color);

          if (hero && (hero.title || hero.subtitle || hero.images)) {
            if (hero.title) setHeroTitle(hero.title);
            if (typeof hero.subtitle === 'string') setHeroSubtitle(hero.subtitle);
            if (Array.isArray(hero.images) && hero.images.length > 0) {
              console.log("✅ [LANDING_PAGE] Setting slider images:", hero.images);
              setSliderImages(hero.images);
            } else {
              console.log("⚠️ [LANDING_PAGE] No valid images found in hero data");
            }
            if (hero.background_color) {
              console.log("✅ [LANDING_PAGE] Setting background color:", hero.background_color);
              setHeroBackgroundColor(hero.background_color);
            } else {
              console.log("⚠️ [LANDING_PAGE] No background color found, using default");
              setHeroBackgroundColor("gradient-blue");
            }
            if (hero.title_accent1) {
              console.log("🎨 [LANDING_PAGE] Setting hero accent1 color:", hero.title_accent1);
              setHeroTitleAccent1(hero.title_accent1);
            }
            if (hero.title_accent2) {
              console.log("🎨 [LANDING_PAGE] Setting hero accent2 color:", hero.title_accent2);
              setHeroTitleAccent2(hero.title_accent2);
            }
          } else {
            console.log("⚠️ [LANDING_PAGE] No hero data found");
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

        // Fetch features section data directly from Supabase to avoid any API caching
        const { data: featuresSection, error: featuresErr } = await supabaseBrowser
          .from('landing_features_section')
          .select('background_color, title_accent1, title_accent2')
          .eq('id', 1)
          .single();
        if (featuresErr) {
          console.error('❌ [LANDING_PAGE] Error fetching features section from Supabase:', featuresErr);
        } else if (featuresSection) {
          console.log('✅ [LANDING_PAGE] Setting features section data:', featuresSection);
          if (featuresSection.background_color) {
            console.log('🎨 [LANDING_PAGE] Setting background color:', featuresSection.background_color);
            setFeaturesBackgroundColor(featuresSection.background_color);
          }
          if (featuresSection.title_accent1) {
            console.log('🎨 [LANDING_PAGE] Setting accent1 color:', featuresSection.title_accent1);
            setFeaturesTitleAccent1(featuresSection.title_accent1);
          }
          if (featuresSection.title_accent2) {
            console.log('🎨 [LANDING_PAGE] Setting accent2 color:', featuresSection.title_accent2);
            setFeaturesTitleAccent2(featuresSection.title_accent2);
          }
        } else {
          console.log('⚠️ [LANDING_PAGE] No features section data found, using defaults');
          setFeaturesBackgroundColor('solid-blue');
          setFeaturesTitleAccent1('#a855f7');
          setFeaturesTitleAccent2('#14b8a6');
        }
      } catch (error) {
        console.error('Error fetching landing data:', error);
      } finally {
        setIsReady(true);
      }
    };
    fetchAll();
  }, []);

  const bgClasses = getBackgroundClasses(heroBackgroundColor);
  
  console.log('🎨 [LANDING_PAGE] Current background color state:', heroBackgroundColor);
  console.log('🎨 [LANDING_PAGE] Current features background color state:', featuresBackgroundColor);
  console.log('🎨 [LANDING_PAGE] Current accent1 color state:', featuresTitleAccent1);
  console.log('🎨 [LANDING_PAGE] Current accent2 color state:', featuresTitleAccent2);
  console.log('🎨 [LANDING_PAGE] getBackgroundClasses input:', heroBackgroundColor);
  console.log('🎨 [LANDING_PAGE] getBackgroundClasses output:', bgClasses);
  console.log('🎨 [LANDING_PAGE] Final CSS classes:', `min-h-screen ${bgClasses.background} ${bgClasses.text} relative overflow-hidden`);
  
  return (
    <div className={`min-h-screen ${bgClasses.background} ${bgClasses.text} relative overflow-hidden scheme-${heroBackgroundColor}`}>
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
          
          <div className={`hidden sm:flex gap-6 ${bgClasses.textSecondary}`}>
            <a href="#features" className={`hover:${bgClasses.text} transition-colors`}>Features</a>
            <a href="#how-it-works" className={`hover:${bgClasses.text} transition-colors`}>How it Works</a>
            <a href="#faq" className={`hover:${bgClasses.text} transition-colors`}>FAQ</a>
            <Link href="/plans" className={`hover:${bgClasses.text} transition-colors`}>Pricing</Link>
            <Link href="/contact" className={`hover:${bgClasses.text} transition-colors`}>Contact</Link>
          </div>
          
          <div className="hidden sm:flex gap-3">
            {session ? (
              <Link href="/dashboard" className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#8856ff] to-[#a854ff] text-white font-semibold hover:from-[#7a4bff] hover:to-[#9a44ff] transition-all">Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-3 rounded-xl border border-[#2a2f44] bg-[#161a2c] text-[#e8edfb] font-semibold hover:bg-[#1e2541] hover:border-[#3a4161] transition-all">Sign In</Link>
                <Link href="/auth/signup" className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#8856ff] to-[#a854ff] text-white font-semibold hover:from-[#7a4bff] hover:to-[#9a44ff] transition-all">Get Started</Link>
              </>
            )}
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
            {session ? (
              <Link href="/dashboard" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                <Link href="/auth/signup" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-6 relative z-10" style={{ opacity: isReady ? 1 : 0 }}>
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 items-start mt-6">
          {/* Left section */}
          <section>
            <div className={`${bgClasses.textSecondary} font-semibold tracking-wider uppercase text-xs`}>AI-POWERED WELLNESS</div>
            <h1 className={`text-5xl lg:text-6xl font-extrabold leading-tight mt-3 mb-2 tracking-tight ${bgClasses.text}`}>
              {heroTitle ? applyAccentColors(heroTitle, heroTitleAccent1, heroTitleAccent2) : applyAccentColors("Your Personal AI Health Assistant", heroTitleAccent1, heroTitleAccent2)}
            </h1>
            <p className={`${bgClasses.textSecondary} max-w-[680px] mt-2 mb-5 text-base`}>
              {heroSubtitle || "Upload a health photo or report and get instant, privacy-first insights. Receive a clean PDF summary and have an AI consultant explain the results in simple language."}
            </p>

            {/* Steps grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className={`grid grid-cols-[56px_1fr] gap-4 items-start ${bgClasses.cardBg} border ${bgClasses.cardBorder} rounded-2xl p-4 min-h-[112px]`}>
                <div className={`w-14 h-14 rounded-4 ${bgClasses.cardIconBg} border ${bgClasses.cardIconBorder} grid place-items-center`}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <rect x="4" y="4" width="16" height="16" rx="3" stroke="#7a86ff" strokeWidth="1.4"/>
                    <path d="M9 9h6v6H9z" fill="#7a86ff"/>
                  </svg>
                </div>
                <div>
                  <small className={`${bgClasses.textSecondary} font-bold tracking-wider uppercase text-xs`}>STEP 1</small>
                  <h4 className={`mt-1 mb-1 text-base font-semibold ${bgClasses.text}`}>AI instantly analyzes</h4>
                  <p className={`${bgClasses.textSecondary} text-sm leading-relaxed`}>Upload a photo or health report.</p>
                </div>
              </div>

              <div className={`grid grid-cols-[56px_1fr] gap-4 items-start ${bgClasses.cardBg} border ${bgClasses.cardBorder} rounded-2xl p-4 min-h-[112px]`}>
                <div className={`w-14 h-14 rounded-4 ${bgClasses.cardIconBg} border ${bgClasses.cardIconBorder} grid place-items-center`}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="#6ae2ff" strokeWidth="1.4"/>
                    <path d="M14 3v6h6" stroke="#6ae2ff" strokeWidth="1.4"/>
                    <path d="M8 13h8M8 17h8" stroke="#3ac5e9" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <small className={`${bgClasses.textSecondary} font-bold tracking-wider uppercase text-xs`}>STEP 2</small>
                  <h4 className={`mt-1 mb-1 text-base font-semibold ${bgClasses.text}`}>Get a personalized Health Report</h4>
                  <p className={`${bgClasses.textSecondary} text-sm leading-relaxed`}>Clear metrics and ranges you can keep.</p>
                </div>
              </div>

              <div className={`grid grid-cols-[56px_1fr] gap-4 items-start ${bgClasses.cardBg} border ${bgClasses.cardBorder} rounded-2xl p-4 min-h-[112px]`}>
                <div className={`w-14 h-14 rounded-4 ${bgClasses.cardIconBg} border ${bgClasses.cardIconBorder} grid place-items-center`}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <circle cx="12" cy="8" r="3.5" stroke="#b47bff" strokeWidth="1.4"/>
                    <rect x="6.5" y="13.5" width="11" height="5.5" rx="1.2" stroke="#b47bff" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <small className={`${bgClasses.textSecondary} font-bold tracking-wider uppercase text-xs`}>STEP 3</small>
                  <h4 className={`mt-1 mb-1 text-base font-semibold ${bgClasses.text}`}>AI Consultant explains</h4>
                  <p className={`${bgClasses.textSecondary} text-sm leading-relaxed`}>Understand what your numbers mean.</p>
                </div>
              </div>

              <div className={`grid grid-cols-[56px_1fr] gap-4 items-start ${bgClasses.cardBg} border ${bgClasses.cardBorder} rounded-2xl p-4 min-h-[112px]`}>
                <div className={`w-14 h-14 rounded-4 ${bgClasses.cardIconBg} border ${bgClasses.cardIconBorder} grid place-items-center`}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <rect x="3" y="4" width="18" height="13" rx="3" stroke="#8cefcf" strokeWidth="1.4"/>
                    <path d="M8 10h8M8 7.8h8M8 12.2h5" stroke="#5de0b9" strokeWidth="1.4"/>
                    <path d="M8 21l4-4h7" stroke="#3ed1a3" strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <small className={`${bgClasses.textSecondary} font-bold tracking-wider uppercase text-xs`}>PLUS</small>
                  <h4 className={`mt-1 mb-1 text-base font-semibold ${bgClasses.text}`}>Ask follow-up questions</h4>
                  <p className={`${bgClasses.textSecondary} text-sm leading-relaxed`}>24/7 assistant for quick answers.</p>
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

          {/* Right section - Static Image */}
          <aside className="lg:mt-16">
            <div className="h-[240px] sm:h-[320px] md:h-[460px] lg:h-[520px] flex items-center justify-center">
              <img src={(sliderImages && sliderImages[0]) ? sliderImages[0] : "/images/aidoc3.png"} alt="Health Assistant Chat" className="w-full h-full object-contain rounded-2xl border border-[#1e2541] shadow-2xl" />
            </div>
          </aside>
        </div>
      </main>

      {/* Showcase section disabled temporarily */}

      {/* Features Section */}
      <section id="features" className={`py-20 theme-bg ${'theme-text'} scheme-${featuresBackgroundColor}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-15">
            <div className={`font-semibold tracking-wider uppercase text-xs theme-text-secondary`}>KEY FEATURES</div>
            <h2 className={`text-5xl font-extrabold mt-4 mb-4 ${'theme-text'}`}>
              {featuresTitle ? applyAccentColors(featuresTitle, featuresTitleAccent1, featuresTitleAccent2) : applyAccentColors("Advanced AI Health Analysis", featuresTitleAccent1, featuresTitleAccent2)}
            </h2>
            <p className={`max-w-[600px] mx-auto text-lg theme-text-secondary`}>
              {featuresSubtitle || "Experience the future of health monitoring with our cutting-edge AI technology"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.id} className={`grid grid-cols-[56px_1fr] gap-4 items-start theme-card-bg border theme-card-border rounded-2xl p-4`}>
                <div className={`w-14 h-14 rounded-4 theme-icon-bg border theme-icon-border grid place-items-center`}>
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-[#0f1320] to-[#0a0e1a]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-15">
            <div className="text-[#a8b1c6] font-semibold tracking-wider uppercase text-xs">HOW IT WORKS</div>
            <h2 className="text-5xl font-extrabold mt-4 mb-4 text-[#e7ecf5]">
              Simple Steps to Better Health
            </h2>
            <p className="max-w-[600px] mx-auto text-lg text-[#9fb0cf]">
              Get instant health insights in just three easy steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#7a86ff] to-[#5a67d8] rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#e7ecf5]">Upload Your Image</h3>
              <p className="text-[#9fb0cf] text-sm leading-relaxed">
                Take a photo of your health document, lab results, or medical image and upload it securely to our platform.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#93ffc7] to-[#68d391] rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#e7ecf5]">AI Analysis</h3>
              <p className="text-[#9fb0cf] text-sm leading-relaxed">
                Our advanced AI analyzes your document and provides detailed insights, explanations, and recommendations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#6ae2ff] to-[#4299e1] rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#e7ecf5]">Get Your Results</h3>
              <p className="text-[#9fb0cf] text-sm leading-relaxed">
                Receive a comprehensive PDF report and chat with our AI consultant for personalized explanations.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7a86ff] to-[#5a67d8] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-[#6a75e6] hover:to-[#4c51bf] transition-all duration-200 shadow-lg hover:shadow-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start Your Health Journey
            </Link>
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
          <div className="flex flex-col gap-6">
            {/* App Download Links */}
            <div className="flex justify-center gap-4">
              <a 
                href="https://apps.apple.com/us/app/health-consultant-ai/id6754229345" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://res.cloudinary.com/dqemas8ht/image/upload/v1762298292/applestore_nbfd12.png" 
                  alt="Download on the App Store" 
                  className="h-10 w-auto"
                />
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=ai.healthconsultant.mobile" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://res.cloudinary.com/dqemas8ht/image/upload/v1762298292/googleplay_oight1.png" 
                  alt="Get it on Google Play" 
                  className="h-10 w-auto"
                />
              </a>
            </div>
            
            {/* Footer Links */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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
        </div>
      </footer>
    </div>
  )
} 