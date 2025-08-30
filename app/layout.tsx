import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { Toaster } from "react-hot-toast";
import Providers from "@/components/Providers";
import { getSettings } from "@/lib/server/settings";

const inter = Inter({ subsets: ["latin"] });

// Force dynamic metadata generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  try {
    console.log('🔍 Generating metadata...');
    const s = await getSettings();
    console.log('📋 Settings for metadata:', { siteName: s.siteName, siteDescription: s.siteDescription });
    return {
      title: s.siteName,
      description: s.siteDescription || "An AI-powered medical assistant",
    };
  } catch (error) {
    console.error('Error fetching settings for metadata:', error);
    return {
      title: "Health Consultant AI",
      description: "An AI-powered medical assistant",
    };
  }
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