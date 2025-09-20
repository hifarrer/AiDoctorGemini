import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Consultant AI",
  description: "Your personal AI health assistant dashboard for analyzing health reports and getting medical insights.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
