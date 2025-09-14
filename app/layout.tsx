import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Safe Yields - Find Safe DeFi Yields. Skip the Scams.",
  description: "Curated list of verified DeFi protocols with safety scores, real APYs, and audit information. Find legitimate yield opportunities without the risk.",
  keywords: "DeFi, yield farming, staking, liquidity mining, APY, TVL, crypto yields, safe DeFi, DeFi safety, protocol audits",
  authors: [{ name: "Safe Yields" }],
  creator: "Safe Yields",
  publisher: "Safe Yields",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://safe-yields.com"),
  openGraph: {
    title: "Safe Yields - Find Safe DeFi Yields. Skip the Scams.",
    description: "Curated list of verified DeFi protocols with safety scores, real APYs, and audit information.",
    url: "https://safe-yields.com",
    siteName: "Safe Yields",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Safe Yields - Verified DeFi Protocols",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safe Yields - Find Safe DeFi Yields",
    description: "Curated list of verified DeFi protocols with safety scores and real APYs.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://safe-yields.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
