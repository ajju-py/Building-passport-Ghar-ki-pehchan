import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Building Passport — Ghar Ki Pehchan | Digital Civil Identity & Lifecycle",
  description:
    "Building Passport (घर की पहचान) provides a verified digital identity, statutory clearances, CAD blueprints, and structural lifecycle management for civil infrastructure.",
  keywords: [
    "Building Passport",
    "Ghar Ki Pehchan",
    "Digital Building Identity",
    "Civil Engineering Tech",
    "BIM Asset Management",
    "Structural Health Record",
    "Building Lifecycle Management",
    "National Civil Registry",
    "Smart Infrastructure",
  ],
  authors: [{ name: "Building Passport National Project" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo/building-passport-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo/building-passport-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Building Passport — Ghar Ki Pehchan",
    description:
      "Official Digital Building Passport & Civil Registry. Verifiable record for structural integrity, statutory NOCs, and property governance.",
    type: "website",
    siteName: "Building Passport — Ghar Ki Pehchan",
    images: [
      {
        url: "/logo/og-image.png",
        width: 1200,
        height: 630,
        alt: "Building Passport — Ghar Ki Pehchan Verified Civil Record",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Building Passport — Ghar Ki Pehchan",
    description:
      "Official Digital Building Passport & Civil Registry. Verifiable record for structural integrity, statutory NOCs, and property governance.",
    images: ["/logo/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
