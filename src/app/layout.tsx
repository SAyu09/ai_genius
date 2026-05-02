import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SellGetAI, The Global Marketplace for AI Agents",
    template: "%s | SellGetAI",
  },
  description:
    "Buy, sell and deploy AI agents from creators worldwide. SellGetAI is the marketplace for sales, support, research and operations agents.",
  openGraph: {
    title: "SellGetAI, The Global Marketplace for AI Agents",
    description: "Buy, sell and deploy AI agents from creators worldwide.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@SellGetAI",
  },
  authors: [{ name: "SellGetAI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
