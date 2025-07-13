import Link from "next/link"

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-gray-400">Last updated: July 13, 2025</p>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                    Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website.
                </p>
                <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                <p>
                    We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
                </p>
                <h2 className="text-2xl font-bold">2. Log Data</h2>
                <p>
                    We want to inform you that whenever you visit our Service, we collect information that your browser sends to us that is called Log Data. This Log Data may include information such as your computer&apos;s Internet Protocol (&quot;IP&quot;) address, browser version, pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics.
                </p>
                <h2 className="text-2xl font-bold">3. Security</h2>
                <p>
                    The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.
                </p>
                <h2 className="text-2xl font-bold">4. Links to Other Sites</h2>
                <p>
                    Our Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over, and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
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