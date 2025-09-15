import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Safe Yields - Find Verified DeFi Yields & Skip Scams",
  description: "Discover audited, high-yield DeFi protocols. Safety scores, risk ratings, and verified APYs to help you avoid scams and maximize returns safely.",
  keywords: "safe yields, DeFi safety, verified protocols, yield farming, crypto APY, DeFi scams, protocol audits, DeFi risk, TVL, decentralized finance",
  authors: [{ name: "Safe Yields Team" }],
  openGraph: {
    title: "Safe Yields - Find Verified DeFi Yields & Skip Scams",
    description: "Discover audited, high-yield DeFi protocols with safety scores and risk ratings.",
    url: "https://safe-yields.com",
    siteName: "Safe Yields",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safe Yields - Find Verified DeFi Yields",
    description: "Discover audited, high-yield DeFi protocols with safety scores.",
    creator: "@SafeYields",
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
  verification: {
    google: "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
