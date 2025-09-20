import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Consultant AI",
  description: "Privacy Policy for Health Consultant AI - Learn how we protect your health data and privacy.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
