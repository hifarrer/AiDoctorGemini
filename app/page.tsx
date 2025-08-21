"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { PublicChat } from "@/components/PublicChat"
import { ImageSlider } from "@/components/ImageSlider"

const defaultSliderImages = [
  '/images/aidoc1.png',
  '/images/aidoc2.png',
  '/images/aidoc3.png',
  '/images/aidoc4.png',
];

export default function LandingPage() {
  const [siteName, setSiteName] = useState("AI Doctor");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [heroTitle, setHeroTitle] = useState<string>("Your Personal AI Health Assistant");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("Get instant, reliable answers to your medical questions. AI Doctor understands both text and images to provide you with the best possible assistance.");
  const [sliderImages, setSliderImages] = useState<string[]>(defaultSliderImages);
  const [chatTitle, setChatTitle] = useState<string>("Try AI Doctor Now");
  const [chatSubtitle, setChatSubtitle] = useState<string>("Ask a question below to test the chatbot's capabilities. No registration required.");
  const [featuresTitle, setFeaturesTitle] = useState<string>("Your Personal Health Companion");
  const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("Providing intelligent, secure, and accessible health information right at your fingertips.");
  const [features, setFeatures] = useState<Array<{ id: string; title: string; description: string; icon?: string }>>([
    { id: '1', title: 'Natural Language Understanding', description: 'Ask questions in plain English and get easy-to-understand answers from our advanced AI.', icon: 'message' },
    { id: '2', title: 'Image Analysis', description: 'Upload images of symptoms, and our AI will provide relevant, helpful information.', icon: 'image' },
    { id: '3', title: 'Secure & Anonymous', description: 'Your conversations are private. We are HIPAA-compliant and never store personal health information.', icon: 'shield' },
  ]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, heroRes, chatbotRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/faq', { cache: 'no-store' }),
          fetch('/api/landing/hero', { cache: 'no-store' }),
        ]);
        // Fetch chatbot section separately to avoid failing all
        const chatbotFetch = fetch('/api/landing/chatbot', { cache: 'no-store' }).catch(() => null);
        const featuresFetch = fetch('/api/landing/features', { cache: 'no-store' }).catch(() => null);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSiteName(data.siteName || "AI Doctor");
          setLogoUrl(data.logoUrl || "");
        }
        if (faqRes.ok) {
          const items = await faqRes.json();
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
        const cr = await chatbotFetch;
        if (cr && cr.ok) {
          const chat = await cr.json();
          if (chat && (chat.title || chat.subtitle)) {
            if (chat.title) setChatTitle(chat.title);
            if (typeof chat.subtitle === 'string') setChatSubtitle(chat.subtitle);
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
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white dark:bg-gray-950 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <HeartPulseIcon className="h-6 w-6 text-teal-500" />
          )}
          <span className="sr-only">{siteName}</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#demo">
            Demo
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/plans">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#faq">
            FAQ
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/contact">
            Contact
          </Link>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-700"
            href="/auth/login"
          >
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-teal-50 dark:bg-teal-950/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-teal-900 dark:text-teal-100">{heroTitle}</h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl dark:text-gray-400">{heroSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ImageSlider images={sliderImages} />
              </div>
            </div>
          </div>
        </section>
        <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-teal-100 px-3 py-1 text-sm text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">Live Demo</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{chatTitle}</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">{chatSubtitle}</p>
              </div>
            </div>
            <div className="mx-auto max-w-5xl py-12">
              <PublicChat />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-teal-100 px-3 py-1 text-sm text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{featuresTitle}</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">{featuresSubtitle}</p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.id} className="grid gap-4 text-center">
                  {f.icon === 'image' ? (
                    <ImageIcon className="h-12 w-12 mx-auto text-teal-500" />
                  ) : f.icon === 'shield' ? (
                    <ShieldCheckIcon className="h-12 w-12 mx-auto text-teal-500" />
                  ) : (
                    <MessageCircleIcon className="h-12 w-12 mx-auto text-teal-500" />
                  )}
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-teal-50 dark:bg-teal-950/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Get Started?</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Choose the perfect plan for your needs and start your AI health journey today.
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-md bg-teal-500 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-700"
                  href="/plans"
                >
                  View Plans
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-8 text-sm font-medium text-gray-900 shadow transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-700 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                  href="/auth/signup"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Frequently Asked Questions</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Have questions? We have answers.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl py-12">
              {faqs.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-center">No FAQs yet.</div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((f, idx) => (
                    <AccordionItem key={f.id} value={`item-${idx + 1}`}>
                      <AccordionTrigger>{f.question}</AccordionTrigger>
                      <AccordionContent>{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-950">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 AI Doctor. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

function HeartPulseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.7-1.5L11.5 12H16" />
    </svg>
  )
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function MessageCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function StethoscopeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3" />
      <path d="M8 2a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 0-1 1v1" />
      <path d="M16 2a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v1" />
      <path d="M3 10a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5v-3" />
      <path d="M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  )
} 