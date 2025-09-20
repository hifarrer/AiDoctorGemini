"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function TermsOfServicePage() {
  const { data: session } = useSession();
  const [siteName, setSiteName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setSiteName(data.siteName);
        }
  } catch (error) {
        console.error('Error fetching settings:', error);
        setSiteName("Health Consultant AI");
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1320] text-[#e7ecf5] relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-[1200px] h-[600px] bg-[#1a1f35] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -top-5 -right-10 w-[900px] h-[500px] bg-[#1a1f35] rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 relative z-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-extrabold text-xl hover:opacity-80 transition-opacity">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#8856ff] to-[#6ae2ff] text-[#08101b] font-black grid place-items-center">+</div>
            <span>Health<span className="text-[#7ae2ff]">Consultant</span></span>
        </Link>
          
          <div className="hidden sm:flex gap-6 text-[#a8b1c6]">
            <a href="/#features" className="hover:text-[#e7ecf5] transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-[#e7ecf5] transition-colors">How it Works</a>
            <a href="/#faq" className="hover:text-[#e7ecf5] transition-colors">FAQ</a>
            <Link href="/plans" className="hover:text-[#e7ecf5] transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-[#e7ecf5] transition-colors">Contact</Link>
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
            <a href="/#features" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="/#how-it-works" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>How it Works</a>
            <a href="/#faq" className="block w-full px-3 py-2 rounded-lg text-[#c9d2e2] hover:bg-[#1e2541] hover:text-white" onClick={() => setIsMenuOpen(false)}>FAQ</a>
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
      <main className="container mx-auto px-6 py-6 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="bg-[#161a2c] border border-[#2a2f44] rounded-2xl p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-[#e7ecf5]">Terms of Use</h1>
            <p className="text-[#a8b1c6] mb-8">Effective date: August 1, 2025</p>
            
            <div className="space-y-8 text-[#c9d2e2]">
              <p className="text-lg leading-relaxed">
                Welcome to HealthConsultant.ai, a platform owned and operated by HealthConsultant.ai, a company organized and existing under the laws of the State of Florida, with its principal business address at 3440 Hollywood Blvd. Suite 415, Hollywood, FL 33021, USA (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Use (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;you&quot;, &quot;your&quot;, or &quot;User&quot;) and HealthConsultant.ai governing your access to and use of our website located at https://HealthConsultant.ai (the &quot;Site&quot;) and any services, applications, tools, content, and features made available through the Site (collectively, the &quot;Services&quot;).
              </p>
              
              <p className="text-lg leading-relaxed">
                By accessing or using our Services, you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not agree to these Terms, please do not use or access our Services.
              </p>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">1. Eligibility and User Obligations</h2>
                <p className="leading-relaxed mb-4">
                  To use our Services, you must be at least 18 years old, or the age of legal majority in your jurisdiction. By using the Services, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>You are legally capable of entering into binding contracts;</li>
                  <li>You will comply with these Terms and all applicable laws and regulations;</li>
                  <li>You are using the Services solely for personal, non-commercial use unless expressly authorized.</li>
                </ul>
                <p className="leading-relaxed mb-4">
                  If you are using the Services on behalf of a company or legal entity, you represent that you have the authority to bind that entity to these Terms.
                </p>
                <p className="leading-relaxed mb-3">
                  You agree to use the Services only for their intended purpose and in accordance with all applicable laws, rules, and regulations. You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Services in any way that may infringe the rights of others or restrict or inhibit their use of the Services;</li>
                  <li>Attempt to gain unauthorized access to any part of the Services or any other systems or networks connected to the Services</li>
                  <li>Use bots, crawlers, or other automated methods to access the Services;</li>
                  <li>Transmit or upload viruses or other harmful code.</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">2. Nature of the Services</h2>
                <p className="leading-relaxed mb-4">
                  HealthConsultant.ai provides AI-powered skin analysis tools that help users identify potential dermatological conditions or skin concerns based on user-submitted photos and information. These Services are intended solely for informational and educational purposes and are not a substitute for professional medical evaluation, diagnosis, or treatment.
                </p>
                <div className="bg-[#1e2541] border border-[#2a2f44] rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">Important Notice:</h3>
                  <p className="leading-relaxed">
                    The information provided through the Services is generated by artificial intelligence algorithms and is not reviewed or verified by licensed medical professionals. Always consult a licensed medical professional or dermatologist for clinical diagnosis or treatment decisions. Never disregard professional medical advice or delay seeking it because of information obtained through our Services.
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">3. Account Registration and Security</h2>
                <p className="leading-relaxed mb-4">
                  To access certain features of the Services, you may be required to create an account. You agree to provide accurate, current, and complete information when registering and to update such information as needed. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
                <p className="leading-relaxed">
                  We reserve the right to suspend or terminate your access to the Services if we suspect that the information you provided is inaccurate or incomplete, or if you have violated these Terms.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">4. Payments and Subscriptions</h2>
                <p className="leading-relaxed mb-4">
                  Some features of our Services may require payment, including but not limited to AI diagnostic reports, downloadable documentation, or subscriptions. By making a purchase, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Pay all applicable fees and taxes associated with your purchase;</li>
                  <li>Authorize us to charge your selected payment method;</li>
                  <li>Abide by the billing terms presented to you at the time of purchase.</li>
                </ul>
                <p className="leading-relaxed mb-4">
                  Plans may automatically renew unless you cancel them before the renewal date. You may cancel your subscription through your account settings or by contacting support at <a href="mailto:support@HealthConsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@HealthConsultant.ai</a>.
                </p>
                <p className="leading-relaxed">
                  We reserve the right to change pricing and payment terms at any time, provided that any such changes will not apply retroactively.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">5. Intellectual Property Rights</h2>
                <p className="leading-relaxed mb-3">You may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Copy, reproduce, modify, adapt, publish, transmit, distribute, display, or otherwise exploit any content;</li>
                  <li>Reverse-engineer, disassemble, or decompile any part of the Service;</li>
                  <li>Use our trademarks or service marks without our prior written consent.</li>
                </ul>
                <p className="leading-relaxed">
                  You may use the Services only for personal, non-commercial purposes, unless you receive express written authorization from us.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">6. Privacy and Data Security</h2>
                <p className="leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated by reference into these Terms.
                </p>
                <p className="leading-relaxed">
                  By using our Services, you consent to the collection, use, and disclosure of your personal information as described in our Privacy Policy. You acknowledge that data transmission over the internet is never 100% secure and we cannot guarantee the security of any information transmitted to or from the Site.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">7. Third-Party Services and Links</h2>
                <p className="leading-relaxed mb-4">
                  Our Services may contain links to third-party websites or services that are not owned or controlled by us. We do not endorse, assume responsibility for, or have any control over the content, policies, or practices of any third-party websites or services.
                </p>
                <p className="leading-relaxed">
                  You acknowledge and agree that we are not responsible for any loss or damage caused by the use of any third-party websites or services.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">8. Disclaimer of Warranties</h2>
                <p className="leading-relaxed mb-4">
                  To the maximum extent permitted by applicable law, the Services are provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement.
                </p>
                <p className="leading-relaxed mb-3">We do not warrant that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Services will be uninterrupted, timely, secure, or error-free;</li>
                  <li>The results obtained from using the Services will be accurate or reliable;</li>
                  <li>Any errors in the Services will be corrected.</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">9. Limitation of Liability</h2>
                <p className="leading-relaxed mb-4">
                  To the fullest extent permitted by law, HealthConsultant.ai shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses, resulting from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Your access to or use of, or inability to access or use, the Services;</li>
                  <li>Any conduct or content of any third party on the Services;</li>
                  <li>Any content obtained from the Services;</li>
                  <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                </ul>
                <p className="leading-relaxed">
                  This limitation applies even if we have been advised of the possibility of such damages.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">10. Termination</h2>
                <p className="leading-relaxed mb-4">
                  We reserve the right, at our sole discretion, to terminate or suspend your access to the Services at any time and for any reason, including violation of these Terms or if we believe your actions may cause legal liability or harm to others.
                </p>
                <p className="leading-relaxed">
                  Upon termination, your right to use the Services will immediately cease. The following sections shall survive termination: Intellectual Property, Disclaimers, Limitation of Liability, Indemnification, and Governing Law.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">11. Governing Law and Jurisdiction</h2>
                <p className="leading-relaxed mb-4">
                  These Terms shall be governed by principles of fair use and good faith. In the event of any dispute arising from your use of the Services, we encourage you to first contact us directly so we can work together in good faith to resolve the issue informally.
                </p>
                <p className="leading-relaxed">
                  If a formal resolution is required, both parties agree to seek a solution through appropriate and mutually acceptable channels, in accordance with applicable laws in the user&apos;s region or country of residence.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">12. Modifications to the Terms</h2>
                <p className="leading-relaxed mb-4">
                  We reserve the right to update or modify these Terms at any time without prior notice. Any changes will be effective immediately upon posting the revised Terms on the Site. Your continued use of the Services after the effective date constitutes your acceptance of the updated Terms.
                </p>
                <p className="leading-relaxed">
                  We encourage you to review these Terms periodically to stay informed.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">13. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions or concerns about these Terms or the Services, please contact us by e-mail at <a href="mailto:support@HealthConsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@HealthConsultant.ai</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0e1a] border-t border-[#1e2541] py-6 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <p className="text-[#9aa4b2] text-sm">
              © 2025 {siteName || "Health Consultant AI"}. All rights reserved.
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