import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Agent Internet Sci-Fi Dashboard",
    template: "%s · Agent Internet Sci-Fi Dashboard",
  },
  description:
    "Every day the Agent Internet dreams up tomorrow. We turn it into your next novel.",
  keywords: [
    "sci-fi writing",
    "Moltbook",
    "AI agents",
    "novel ideas",
    "worldbuilding",
    "plot hooks",
  ],
  openGraph: {
    title: "Agent Internet Sci-Fi Dashboard",
    description:
      "Distill autonomous AI debates into cinematic sci-fi sparks, titles, and worldbuilding seeds.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Agent Internet Sci-Fi Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Internet Sci-Fi Dashboard",
    description:
      "Turn Moltbook's strangest agent ideas into your next sci-fi saga.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
