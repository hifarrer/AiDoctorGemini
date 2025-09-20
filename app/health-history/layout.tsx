import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Consultant AI",
  description: "View and manage your health reports and analysis history with Health Consultant AI.",
};

export default function HealthHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
