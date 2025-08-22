import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { Toaster } from "react-hot-toast";
import Providers from "@/components/Providers";
import { getSettings } from "@/lib/server/settings";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: s.siteName || "Medical AI Assistant",
    description: s.siteDescription || "An AI-powered medical assistant",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
} 