import Link from "next/link"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { PublicChat } from "@/components/PublicChat"
import { ImageSlider } from "@/components/ImageSlider"

const sliderImages = [
  '/images/aidoc1.png',
  '/images/aidoc2.png',
  '/images/aidoc3.png',
  '/images/aidoc4.png',
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white dark:bg-gray-950 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <HeartPulseIcon className="h-6 w-6 text-teal-500" />
          <span className="sr-only">AI Doctor</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#demo">
            Demo
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
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
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-teal-900 dark:text-teal-100">
                    Your Personal AI Health Assistant
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl dark:text-gray-400">
                    Get instant, reliable answers to your medical questions. AI Doctor understands both text and images to provide you with the best possible assistance.
                  </p>
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
                <div className="inline-block rounded-lg bg-teal-100 px-3 py-1 text-sm text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">
                  Live Demo
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Try AI Doctor Now</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Ask a question below to test the chatbot&apos;s capabilities. No registration required.
                </p>
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Your Personal Health Companion</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Providing intelligent, secure, and accessible health information right at your fingertips.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              <div className="grid gap-4 text-center">
                <MessageCircleIcon className="h-12 w-12 mx-auto text-teal-500" />
                <h3 className="text-xl font-bold">Natural Language Understanding</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Ask questions in plain English and get easy-to-understand answers from our advanced AI.
                </p>
              </div>
              <div className="grid gap-4 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-teal-500" />
                <h3 className="text-xl font-bold">Image Analysis</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Upload images of symptoms, and our AI will provide relevant, helpful information.
                </p>
              </div>
              <div className="grid gap-4 text-center">
                <ShieldCheckIcon className="h-12 w-12 mx-auto text-teal-500" />
                <h3 className="text-xl font-bold">Secure & Anonymous</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your conversations are private. We are HIPAA-compliant and never store personal health information.
                </p>
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
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is AI Doctor a replacement for a real doctor?</AccordionTrigger>
                  <AccordionContent>
                    No. AI Doctor is an informational tool and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What can this AI do?</AccordionTrigger>
                  <AccordionContent>
                   This AI can: <br />
                   Analyze xray, CT scan, MRI, and other medical images. <br />
                   Analyze medical reports and documents. <br />
                   Provide information about medical conditions. <br />
                   Provide information about treatments. <br />
                   Provide information about medications. <br />
                   Provide information about symptoms. <br />
                   Provide information about tests. <br />
                   Provide information about procedures. <br />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes, your privacy is our priority. We do not store any personal health information from your conversations. All interactions are anonymous.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What kind of questions can I ask?</AccordionTrigger>
                  <AccordionContent>
                    You can ask general medical questions, inquire about symptoms, or get information about conditions and treatments. You can also upload images for analysis, such as a photo of a skin rash.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>What AI model does this use?</AccordionTrigger>
                  <AccordionContent>
                    AI Doctor is powered by Google&apos;s Vertex AI advanced Gemini family of models trained with medical data.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>Can this AI be fine tuned? </AccordionTrigger>
                  <AccordionContent>
                    Yes. With Google&apos;s Vertex AI, you can fine tune the model to your specific needs and data.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>What about the compliance? </AccordionTrigger>
                  <AccordionContent>
                    This solution was designed with compliance in mind. Technology is compliant in the following ways: <br />
                    - (Code)HIPAA compliant <br />
                    - (Hosting)SOC 2 Type 2 compliant <br />
                    - (Hosting)PCI DSS compliant <br />
                    - (Hosting)ISO 27001 compliant <br />
                    - (Hosting)EU-U.S. DPF <br />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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