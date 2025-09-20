import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Consultant AI",
  description: "Contact us for support and inquiries about our AI-powered health analysis platform.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
