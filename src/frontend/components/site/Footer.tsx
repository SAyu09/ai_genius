"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8">
      <div className="mx-auto w-[min(1200px,92%)]">
        {/* Top gradient line */}
        <div
          className="h-[1px] w-full mb-12 -mt-12"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.1) 30%, rgba(99,102,241,0.2) 50%, rgba(99,102,241,0.1) 70%, transparent)",
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-inter)] text-base group">
              <img
                src="/logo.png"
                alt="AI Genius Logo"
                className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-semibold tracking-tight text-gray-900 transition-colors">
                AI Genius
              </span>
            </Link>
            <p className="text-[12px] text-gray-500 max-w-[280px] text-center sm:text-left">
              The global marketplace for AI agents. Discover, deploy, and monetize intelligent automation.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-[13px] text-gray-400 text-center">
            © 2026 AI Genius. All rights reserved.
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-[13px] font-medium text-gray-500">
            <Link href="/about" className="hover:text-indigo-600 transition-colors duration-200">About</Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors duration-200">Pricing</Link>
            <Link href="/sell" className="hover:text-indigo-600 transition-colors duration-200">List an Agent</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
