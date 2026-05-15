import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/frontend/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
