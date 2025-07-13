import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">AI Doctor</span>
        </Link>
      </header>
      <main className="flex-1 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Terms of Service</h1>
            <p className="text-gray-500 dark:text-gray-400">Last updated: July 13, 2025</p>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                    Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the AI Doctor
                    website (the "Service") operated by us.
                </p>
                <h2 className="text-2xl font-bold">1. Conditions of Use</h2>
                <p>
                    We will provide their services to you, which are subject to the conditions stated below in this
                    document. Every time you visit this website, use its services or make a purchase, you accept the
                    following conditions. This is why we urge you to read them carefully.
                </p>
                <h2 className="text-2xl font-bold">2. Privacy Policy</h2>
                <p>
                    Before you continue using our website we advise you to read our privacy policy [link to your
                    privacy policy] regarding our user data collection. It will help you better understand our practices.
                </p>
                <h2 className="text-2xl font-bold">3. Disclaimer</h2>
                <p>
                    AI Doctor is an informational tool and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website.
                </p>
                <h2 className="text-2xl font-bold">4. Applicable Law</h2>
                <p>
                    By visiting this website, you agree that the laws of [your country/state], without regard to
                    principles of conflict laws, will govern these terms of service, or any dispute of any sort that
                    might come between [your company name] and you, or its business partners and associates.
                </p>
                <h2 className="text-2xl font-bold">5. Changes to Terms</h2>
                <p>
                    We reserve the right to make changes to our site, policies, and these Terms of Service at any time. If any of these conditions shall be deemed invalid, void, or for any reason unenforceable, that condition shall be deemed severable and shall not affect the validity and enforceability of any remaining condition.
                </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 AI Doctor. All rights reserved.</p>
      </footer>
    </div>
  )
}

function MountainIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
} 