import type { Metadata, Viewport } from "next";
import { Inter, Libre_Baskerville, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#22C55E",
};

export const metadata: Metadata = {
  title: "CarbonWise AI – Smart Carbon Footprint Tracking & Sustainability Insights",
  description:
    "Track, analyze, and reduce your carbon footprint with AI-powered sustainability tools. Calculate emissions, monitor environmental impact, generate reports, and receive personalized recommendations.",
  applicationName: "CarbonWise AI",
  authors: [{ name: "CarbonWise AI Team" }],
  keywords: [
    "carbon footprint calculator",
    "sustainability tracker",
    "carbon emissions",
    "climate impact",
    "carbon tracking",
    "environmental analytics",
    "ESG",
    "sustainability reports",
    "green technology",
    "carbon reduction",
    "AI sustainability",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
  openGraph: {
    title: "CarbonWise AI",
    description: "Track, analyze and reduce your carbon footprint using AI-powered sustainability insights.",
    type: "website",
    siteName: "CarbonWise AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "CarbonWise AI",
    description: "AI-powered carbon footprint tracking and sustainability analytics.",
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
      className={`${inter.variable} ${libreBaskerville.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF8] text-[#0F172A]">
        <Navbar />
        {children}
        <AuthModal />
      </body>
    </html>
  );
}



