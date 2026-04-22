import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "IL CarLens — Israel Passenger Car Market Intelligence",
    template: "%s · IL CarLens",
  },
  description:
    "Live market intelligence for Israel's new passenger car market — weekly I-VIA data, pricing, positioning, and launch simulation.",
  applicationName: "IL CarLens",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    title: "IL CarLens",
    description: "Israel Passenger Car Market Intelligence",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfbfd",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen bg-background antialiased">
        <div className="hero-grid min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
