import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { CompareProvider } from "@/lib/compare/compare-context";
import { CompareBar } from "@/components/compare/compare-bar";
import { ConsentProvider } from "@/lib/cookies/consent-context";
import { CookieConsentBanner } from "@/components/cookies/cookie-consent-banner";
import { AnalyticsScripts } from "@/components/cookies/analytics-scripts";
import { Toaster } from "@/components/ui/sonner";
import { clientConfig } from "@/config/client.config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientConfig.seo.siteUrl),
  title: {
    default: clientConfig.brand.name,
    template: `%s | ${clientConfig.brand.name}`,
  },
  description: clientConfig.brand.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ConsentProvider>
          <CompareProvider>
            {children}
            <CompareBar />
          </CompareProvider>
          <CookieConsentBanner />
          <AnalyticsScripts />
          <Toaster />
        </ConsentProvider>
      </body>
    </html>
  );
}
