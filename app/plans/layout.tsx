import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Consultant AI",
  description: "Choose the perfect AI medical assistance plan for your needs with Health Consultant AI.",
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
