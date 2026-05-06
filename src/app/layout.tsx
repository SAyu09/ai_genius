import type { Metadata } from "next";
import { Providers } from "@/frontend/components/Providers";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
