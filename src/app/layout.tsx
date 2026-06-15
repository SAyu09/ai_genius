import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { Providers } from "@/frontend/components/Providers";
import { Omnibar } from "@/frontend/components/ui/command";
import "./globals.css";

const sora = Sora({ 
  subsets: ["latin"], 
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI Genius — The Global Marketplace for AI Agents",
    template: "%s | AI Genius",
  },
  description:
    "Buy, sell and deploy AI agents from creators worldwide. AI Genius is the marketplace for sales, support, research and operations agents.",
  openGraph: {
    title: "AI Genius — The Global Marketplace for AI Agents",
    description: "Buy, sell and deploy AI agents from creators worldwide.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@AIGenius",
  },
  authors: [{ name: "AI Genius" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Omnibar />
        </Providers>
      </body>
    </html>
  );
}
