"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-[#e7ecf5]">Privacy Policy</h1>
            <p className="text-[#a8b1c6] mb-8">Effective date: August 1, 2025</p>
            
            <div className="space-y-8 text-[#c9d2e2]">
              <p className="text-lg leading-relaxed">
                This Privacy Policy (the &quot;Policy&quot;) describes how HealthConsultant.AI and its affiliates (also referred to as &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects, stores, uses and protects your information when you use our website at http://healthconsultant.ai/ (the &quot;Site&quot;), any mobile applications that hyperlink to this Policy and are available for download in the Google Play Store, Apple App Store or any other third party app store, or are pre-installed on third party devices (the &quot;Apps&quot;), or any other websites, pages, features, or content owned or operated by HealthConsultant.ai (collectively, including the Site and Apps, the &quot;Services&quot;).
              </p>
              
              <p className="text-lg leading-relaxed">
                This Privacy Policy is part of, and is governed by, the terms and conditions set forth in our Terms of Service located at <Link href="/terms" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">Terms of use</Link>. Please read the Terms of Service carefully before you use our Services.
              </p>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">1. Acceptance of this Policy</h2>
                <p className="leading-relaxed">
                  By accessing, visiting or using our Services, you warrant and represent that you have read, understood and agreed to this Policy and our Terms of Service. If you disagree with anything in this Policy, you must not use or access the Services.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">2. Amendments to this Policy</h2>
                <p className="leading-relaxed mb-4">
                  We may periodically make changes to this Policy as we update or expand our Services. We will notify you of any material changes to this Privacy Policy by notifying you via the email we have on file for you, or by means of a notice on our Services in advance of the effective date of the changes. If you do not agree to the changes, you should discontinue your use of the Services prior to the time the modified Policy takes effect. If you continue using the Services after the modified Policy takes effect, you will be bound by the modified Policy.
                </p>
                <p className="leading-relaxed">
                  Furthermore, we may provide you with &quot;just-in-time&quot; disclosures or additional information about the data collection, use and sharing practices of specific Services. These notices may provide more information about our privacy practices, or provide you with additional choices about how we process your personal information.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">3. Information Collected through the Services</h2>
                <p className="leading-relaxed mb-4">
                  In this Policy, the term &quot;personal information&quot; includes any information that identifies or makes an individual identifiable. When you access or use our Services, we may generally collect the personal information described below.
                </p>
                
                <div className="ml-4 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#e7ecf5]">A. Information You Directly and Voluntarily Provide to Us</h3>
                    <p className="leading-relaxed mb-3">
                      When you access or use our Services, you may provide the following information to us:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Customer Support Information:</strong> If you are a visitor to the Site, or a user of the Apps, we may collect information that you provide to us when you communicate with any of our departments such as customer service or technical services.</li>
                      <li><strong>Contact Information:</strong> When you sign up to create an account with some of our Apps, you will be required to provide an email address as part of the registration process. Alternatively, you can use your Facebook Account or other third party social network accounts (together, &quot;Social Media Account&quot;) to register for the Services.</li>
                      <li><strong>Profile Information:</strong> When using some of our Services, you may be able to add information to your profile, such as an avatar or profile picture, birthday, nickname or username, or country. You voluntarily provide this information to us.</li>
                      <li><strong>Your Content:</strong> When using some of our Services, you can create, post, upload or share content by providing us with access to your photos, media and files, and your device&apos;s camera and microphone. You voluntarily provide this information to us.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#e7ecf5]">B. Information Automatically Collected Through the Services</h3>
                    <p className="leading-relaxed mb-3">
                      We automatically collect information about you when you use the Services, such as:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Device Information:</strong> If you access the Services through a mobile device, we may be able to identify the general location of your mobile device (not precise geolocation data), your mobile device&apos;s brand, model, operating system, resolution, screen size, system version, Bluetooth settings, internet connection, random-access memory (&quot;RAM&quot;), the application you have installed, the applications you have running in the background, mobile device&apos;s advertising ID.</li>
                      <li><strong>Cookies & Similar Tracking Information:</strong> We use cookies and similar tracking technologies to collect information about your interactions with our Services. The information we collect includes, but is not limited to, account activation time, content displayed to you and whether you clicked on it, advertisements displayed to you and whether you clicked on them, URLs you have visited, notifications that have appeared on your mobile device, your Internet Protocol (&quot;IP&quot;) address, your mobile country code, and your user ID.</li>
                      <li><strong>Content Sharing:</strong> When you choose to share content with us, we automatically collect information about your Wi-Fi connection, and call information.</li>
                    </ul>
                    <p className="leading-relaxed mt-3">
                      You may be able to limit the amount of information collected from your device (e.g., computer, phone, or tablet) with us by adjusting your device or browser settings. However, by preventing us from collecting information from you, we may not be able to provide some functions on our Services.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#e7ecf5]">C. Information You Share on Third Party Websites or through Social Media Services</h3>
                    <p className="leading-relaxed">
                      The Services may include links to third-party websites and social media services where you may be able to post comments, stories, reviews or other information. Your use of these third-party websites and social media services may result in the collection or sharing of information about you by these third-party websites and social media services. We encourage you to review the privacy policies and settings on the third-party websites and social media services with which you interact to make sure you understand the information that may be collected, used, and shared by those third-party websites and social media services.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">4. How We Use the Information We Collect</h2>
                <p className="leading-relaxed mb-4">
                  We use the personal information we gather through the Services for the purposes described below. If we use your personal information in any other ways, we will disclose this to you. You can choose not to share your information with third parties for marketing purposes, or from allowing us to use your personal information for any purpose that is incompatible with the purposes for which we originally collected it or subsequently obtained your consent. If you choose to limit the ways we can use your personal information, some or all of the Services may not be available to you.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To provide the Services to you.</h3>
                    <p className="leading-relaxed">
                      We require certain information from you in order to provide you with the Services you requested. Such information may include your contact and device information. We share this information with our service providers or partners to the extent necessary to continue to provide you with the Services. We cannot provide you with Services without such information.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To provide customer service.</h3>
                    <p className="leading-relaxed">
                      We process your personal information when you contact us to help you with any questions, concerns, disputes or issues, or to provide us with your feedback. Without your personal information, we cannot respond to you or ensure your continued use and enjoyment of the Services.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To enforce terms, agreements or policies.</h3>
                    <p className="leading-relaxed">
                      To ensure your safety and adherence to our terms, agreements or policies, we may process your personal information to: actively monitor, investigate, prevent and mitigate any alleged or actual prohibited, illicit or illegal activities on our Services; investigate, prevent, or mitigate violations of our terms and policies; enforce our agreements with third parties and partners; and, collect fees based on your use of our Services. We cannot perform our Services in accordance with our terms, agreements or policies without processing your personal information for such purposes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To send you Service-related communications.</h3>
                    <p className="leading-relaxed">
                      We use your contact information to send you administrative or account-related information to you to keep you updated about our Services, inform you of relevant security issues or updates, or provide other transaction-related information to you. Service-related communications are not promotional in nature. You cannot unsubscribe from such communications because you could miss important developments relating to your account or the Services that may affect how you can use our Services.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">For security purposes.</h3>
                    <p className="leading-relaxed">
                      We process your personal information to: improve and enforce our security measures; combat spam, malware, malicious activities or security risks; and to monitor and verify your identity so that unauthorized users do not access your account with us. We cannot ensure the security of our Services if we do not process your personal information for security purposes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To maintain legal and regulatory compliance.</h3>
                    <p className="leading-relaxed">
                      We process your personal information to pay our taxes or fulfill our other business obligations, and/or to manage risk as required under applicable law. We cannot perform the Services in accordance with our legal and regulatory requirements without processing your personal information for such purposes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To personalize your experience on the Services.</h3>
                    <p className="leading-relaxed">
                      We allow you to personalize your experience on our Services via social media plugins on our Services (e.g., Facebook, Google, Instagram, Twitter, etc.), by keeping track of your preferences (e.g., nickname or display name, time zone, language preference, etc.), and more. Without such processing, you may not be able to access or personalize part or all of our Services.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To conduct research and development.</h3>
                    <p className="leading-relaxed">
                      We process information about the way you use and interact with our Services to: help us improve our Services; build new Services; and build customized features or Services. Such processing ensures your continued enjoyment of part or all of our Services.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">To engage in marketing activities.</h3>
                    <p className="leading-relaxed">
                      We may process your contact information or information about your interactions on our Services to: send you marketing communications; deliver targeted marketing; inform you about events, webinars, or other materials, including those of our partners; and, keep you up-to-date with our relevant products and Services. Transactional communications about your account or our Services are not considered &quot;marketing&quot; communications. In addition, when you share your friends&apos; contact information with us, we may reach out to them to invite them to our Services and to continue receiving our communications. You can opt-out of our marketing activities at any time.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">5. How We Share Your Information with Third Parties</h2>
                <p className="leading-relaxed mb-4">
                  We may share your personal information with third parties in the following circumstances:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">A. Employees, Third-Party Processors and Third-Party Service Providers</h3>
                    <p className="leading-relaxed">
                      We disclose your personal information to our employees, contractors, affiliates, distributors, dealers, vendors and suppliers (&quot;Service Providers&quot;) who provide certain services to us or on our behalf, such as operating and supporting the Services, analyzing data, or performing marketing or consulting services. These Service Providers will only have access to the personal information needed to perform these limited functions on our behalf.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">B. Response to Subpoenas or Court Orders or to Protect Rights and to Comply with Our Policies</h3>
                    <p className="leading-relaxed">
                      To the extent permitted by law, we will disclose your personal information if:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Required to do so by law, or in response to a subpoena or court order or similar request from judicial authority, law enforcement authorities or other competent public authorities;</li>
                      <li>We believe, in our sole discretion, that disclosure is reasonably necessary to protect against fraud, to protect the property or other rights of us or other users, third parties or the public at large; or</li>
                      <li>We believe that you have abused the Services by using it to attack our systems or to gain unauthorized access to our system, to engage in spamming or otherwise to violate applicable laws.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">C. Business Transfers or Bankruptcy</h3>
                    <p className="leading-relaxed">
                      In the event of a merger, acquisition, bankruptcy or other sale of all or a portion of our assets, any personal information owned or controlled by us may be one of the assets transferred to third parties. We will notify you via email or a prominent notice within our Services of any change in ownership or uses of your personal information, as well as any choices you may have regarding your personal information.
                    </p>
                    <p className="leading-relaxed mt-2">
                      Other than to the extent ordered by a bankruptcy or other court, the use and disclosure of all transferred personal information will be subject to this Privacy Policy. However, any personal information you submit or that is collected after this type of transfer may be subject to a new privacy policy adopted by the successor entity.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">D. Our Affiliates</h3>
                    <p className="leading-relaxed">
                      Based on your consent, we may share some or all of your contact information with our parent company, subsidiaries and corporate affiliates, joint ventures, or other companies under common control with us. If you would like us to stop providing your information to our affiliates for their own marketing purposes, you may opt-out by contacting us as provided in the &quot;How to Contact Us&quot; section.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">6. Children</h2>
                <p className="leading-relaxed">
                  We do not knowingly collect personal information from children under 18 years old, unless permitted to do so by applicable law. Children are not permitted to use our Services unless they provide us with consent from their parent or guardian. If we become aware that we have unknowingly collected personal information from a child, we will make commercially reasonable efforts to delete such information in our database. If you are a parent or guardian of a child, and you believe your child has provided us with their Personal Information on our Services, please contact us immediately at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a>.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">7. Security</h2>
                <p className="leading-relaxed mb-4">
                  We are committed to ensuring the security of your personal information. We have physical, technical and administrative safeguards in place to protect the confidentiality of your personal information. In addition, we require that our service providers handling personal information also maintain appropriate physical, technical and administrative safeguards to protect the security and confidentiality of the personal information you provide to us.
                </p>
                <p className="leading-relaxed mb-4">
                  However, we cannot guarantee the security of your personal information or that loss, misuse, unauthorized acquisition, or alteration of your data will not occur. We also have no way of protecting any of your personal information that is not in our control, such as any information transmitted via email or wireless connections.
                </p>
                <p className="leading-relaxed">
                  Maintaining the security of your personal information is also your responsibility. Where we require you to register an account, you should choose a password of sufficient length and complexity and keep your password confidential. Do not leave your device unlocked so that other individuals may access it. Make sure you trust the wireless connections you are using to access or use our Services.
                </p>
                <p className="leading-relaxed mt-4">
                  If you think there has been unauthorized access to or use of your account, please contact us immediately at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a>.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">8. Retention of Personal Information</h2>
                <p className="leading-relaxed mb-4">
                  We will try to limit the storage of your personal information to the time necessary to serve the purpose(s) for which your personal information was processed, to enforce our agreement, policies or terms, to resolve disputes, or as otherwise required or permitted by law. Please contact us if you have any questions about our retention periods. While retention requirements can vary by country, we generally apply the retention periods noted below.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">Marketing.</h3>
                    <p className="leading-relaxed">
                      We store information used for marketing purposes indefinitely until you unsubscribe. Once you unsubscribe from marketing communications, we add your contact information to our suppression list to ensure we respect your unsubscribe request.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">Your Interactions and Content on Our Services.</h3>
                    <p className="leading-relaxed">
                      We may store any information about your interactions on our Services or any content created, posted or shared by you on our Services (e.g., pictures, comments, support tickets, and other content) indefinitely after the closure your account for the establishment or defense of legal claims, audit and crime prevention purposes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">Web Behavior Data.</h3>
                    <p className="leading-relaxed">
                      We retain any information collected via cookies, clear gifs, webpage counters and other technical or analytics tools up to one year from expiry of the cookie or the date of collection.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">Telephone Records.</h3>
                    <p className="leading-relaxed">
                      As required by applicable law, we will inform you that a call will be recorded before doing so. Any telephone calls with you may be kept for a period of up to six years.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">9. Information for Residents in the European Economic Area, United Kingdom and Switzerland</h2>
                <p className="leading-relaxed mb-4">
                  This section only applies to users of our Services that are located in the European Economic Area, United Kingdom and/or Switzerland (collectively, the &quot;Designated Countries&quot;) at the time of data collection. We may ask you to identify which country you are located in when you use some of the Services, or we may rely on your IP address to identify which country you are located in.
                </p>
                <p className="leading-relaxed mb-4">
                  Where we rely on your IP address, we cannot apply the terms of this section to any user that masks or otherwise obfuscates their location information so as not to appear located in the Designated Countries. If any terms in this section conflict with other terms contained in this Policy, the terms in this section shall apply to users in the Designated Countries.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">A. Our Relationship to You</h3>
                    <p className="leading-relaxed">
                      HealthConsultant.ai and its affiliates are data controllers with regard to any personal information collected from users of its Services. A &quot;user&quot; is an individual providing personal information to us via our Services, such as by creating an account with our Apps, signing up for our newsletter(s), or otherwise accessing or using our Services. A &quot;data controller&quot; is an entity that determines the purposes for which and the manner in which any personal information is processed. Any third parties that act as our service providers are &quot;data processors&quot; that handle your personal information in accordance with our instructions.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">B. Legal bases for processing Personal Information</h3>
                    <p className="leading-relaxed">
                      We describe our legal bases for processing in Section 4 (&quot;How We Use the Information We Collect&quot;) and Section 5 (&quot;How We Share Your Information With Third Parties&quot;) under headings entitled &quot;Designated Countries.&quot; The legal bases on which we rely on to process your personal information include: your consent to the processing; satisfaction of our legal obligations; necessity to protect your vital interests; necessity to carry out our obligations arising from any contracts we entered with you or to take steps at your request prior to entering into a contract with you; necessity to process in the public interest; or for our legitimate interests as described in those sections.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">C. Marketing Activities</h3>
                    <p className="leading-relaxed mb-3">
                      If you are located in the Designated Countries and are a current user, we will only contact you by electronic means (such as email or SMS) per your communication preferences and/or with information about our Services that are similar to the Services you previously purchased from us or negotiated to purchase from us.
                    </p>
                    <p className="leading-relaxed">
                      For new users located in the Designated Countries, we will contact you by electronic means for marketing purposes only based on your consent or based on your friends&apos; consent. You can always withdraw your consent or change your marketing communication preferences at any time and free of charge. To opt out of the emails, please click the &quot;unsubscribe&quot; link in the footer of marketing emails or contact us at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a>. Marketing communications are promotional in nature and do not include transactional or Service-related communications.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">D. Individual Rights</h3>
                    <p className="leading-relaxed mb-3">
                      We provide you with the rights described below when you use our Services. Please contact us at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a> if you would like to exercise your rights under applicable law. When we receive an individual rights request from you, please make sure you are ready to verify your identity. Please be advised that there are limitations to your individual rights. We may limit your individual rights in the following ways:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                      <li>Where denial of access is required or authorized by law;</li>
                      <li>When granting access would have a negative impact on other&apos;s privacy;</li>
                      <li>To protect our rights and properties; and</li>
                      <li>Where the request is frivolous or burdensome.</li>
                    </ul>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right to withdraw consent.</h4>
                        <p className="leading-relaxed">
                          If we rely on consent to process your personal information, you have the right to withdraw your consent at any time. A withdrawal of consent will not affect the lawfulness of our processing or the processing of any third parties based on consent before your withdrawal.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right of access and rectification.</h4>
                        <p className="leading-relaxed">
                          If you request a copy of your personal information that we hold, we will provide you with a copy without undue delay and free of charge, except where we are permitted by law to charge a fee. We may limit your access if such access would adversely affect the rights and freedoms of other individuals. You may also request to correct or update any of your personal information held by us, unless you can already do so directly via the Services.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right to erasure (the &quot;Right to be Forgotten&quot;).</h4>
                        <p className="leading-relaxed">
                          You may request us to erase any of your personal information held by us that: is no longer necessary in relation to the purposes for which it was collected or otherwise processed; was collected in relation to processing that you previously consented to, but later withdrew such consent; or was collected in relation to processing activities to which you object, and there are no overriding legitimate grounds for our processing.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right to restriction.</h4>
                        <p className="leading-relaxed">
                          You have the right to restrict our processing your personal information where one of the following applies: You contest the accuracy of your personal information that we processed. We will restrict the processing of your personal information, which may result in an interruption of some or all of the Services, during the period necessary for us to verify the accuracy of your personal information; The processing is unlawful and you oppose the erasure of your personal information and request the restriction of its use instead; We no longer need your personal information for the purposes of the processing, but it is required by you to establish, exercise or defense of legal claims; or You have objected to processing, pending the verification whether the legitimate grounds of our processing override your rights.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right to object to processing.</h4>
                        <p className="leading-relaxed">
                          You may object to our processing at any time and as permitted by applicable law if we process your personal information on the legal basis of consent, contract or legitimate interests. We can continue to process your personal information if it is necessary for the defense of legal claims, or for any other exceptions permitted by applicable law.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right to data portability.</h4>
                        <p className="leading-relaxed">
                          If we process your personal information based on a contract with you or based on your consent, or the processing is carried out by automated means, you may request to receive your personal information in a structured, commonly used and machine-readable format, and to have us transfer your personal information directly to another &quot;controller&quot;, where technically feasible, unless exercise of this right adversely affects the rights and freedoms of others.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#e7ecf5]">Right to Lodge a Complaint.</h4>
                        <p className="leading-relaxed">
                          If you believe we have infringed or violated your privacy rights, please contact us at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a> so that we can work to resolve your concerns. You also have a right to lodge a complaint with a competent supervisory authority situated in a Member State of your habitual residence, place of work, or place of alleged infringement.
                        </p>
                        <p className="leading-relaxed mt-2">
                          You may reach our Data Protection Officer at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a>.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#e7ecf5]">E. Transfer of Personal Information</h3>
                    <p className="leading-relaxed">
                      If you choose to use the Services or provide your information to us, your personal information may be transferred to, processed and maintained on servers or databases located outside of the country or jurisdiction where you are located. Such countries or jurisdictions may have data protection laws that are less protective than the laws of the jurisdiction in which you reside. If you do not want your information transferred to or processed or maintained outside of the country or jurisdiction where you are located, you should not use the Services.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">10. Special Information for California Residents</h2>
                <p className="leading-relaxed mb-4">
                  California law allows users of the Services who are California residents to request and receive once a year, free of charge, a notice from us describing what categories of personal information (if any) we shared with third parties, including our corporate affiliates, for their direct marketing purposes during the preceding calendar year. If you are a California resident and would like to request a copy of this notice, please contact us as provided in the &quot;How to Contact Us&quot; section. In your request, please specify that you want a &quot;California Privacy Rights Notice.&quot; Please allow at least thirty (30) days for a response.
                </p>
                <p className="leading-relaxed mb-4">
                  In addition, if you are a California resident under the age of 18 and are a registered user of the Services, you may request that we remove content or information that you posted on Services or stored on our servers by: submitting a request as provided in the &quot;How to Contact Us&quot; section and (ii) clearly identifying the content or information you wish to have removed and providing sufficient information to allow us to locate the content or information to be removed.
                </p>
                <p className="leading-relaxed">
                  However, please note that we are not required to erase or otherwise eliminate content or information if: other state or federal laws require us or a third party to maintain the content or information; the content or information was posed, stored, or republished by another user; the content or information is anonymized so that the minor cannot be individually identified; the minor does not follow the instructions posted in this Privacy Policy on how to request removal of such content or information; and (e) the minor has received compensation or other consideration for providing the content.
                </p>
                <p className="leading-relaxed mt-4">
                  Further, nothing in this provision shall be construed to limit the authority of a law enforcement agency to obtain such content or information.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#e7ecf5]">11. How to Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us by e-mail at <a href="mailto:support@healthconsultant.ai" className="text-[#7ae2ff] hover:text-[#6ae2ff] transition-colors">support@healthconsultant.ai</a>
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