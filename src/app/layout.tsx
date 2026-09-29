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
  title: "Building Passport — Digital Identity & Lifecycle Management for Buildings",
  description:
    "Building Passport creates a verifiable digital identity, decadal history, structural record, and intelligent condition assessment for every building asset.",
  keywords: [
    "Building Passport",
    "Digital Building Identity",
    "Civil Engineering Tech",
    "BIM Asset Management",
    "Structural Health Record",
    "Building Lifecycle Management",
    "ISO 19650 Compliance",
    "Smart Infrastructure",
  ],
  authors: [{ name: "Building Passport OS Team" }],
  openGraph: {
    title: "Building Passport — Digital Identity for Every Building",
    description:
      "A digital identity, decadal structural history, and verifiable civil record system for modern infrastructure.",
    type: "website",
    siteName: "Building Passport",
  },
  twitter: {
    card: "summary_large_image",
    title: "Building Passport — A Digital Identity for Every Building",
    description:
      "Consolidating structural specifications, maintenance history, floor plans, and defect records into a single digital identity.",
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
