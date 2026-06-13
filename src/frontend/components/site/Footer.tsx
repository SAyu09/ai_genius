"use client";

import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Agent Categories", href: "/marketplace" },
    { label: "Pricing", href: "/pricing" },
    { label: "Enterprise", href: "/about" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Seller Guide", href: "/sell" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer
      className="relative pt-16 pb-10"
      style={{ backgroundColor: "var(--landing-dark-card)" }}
    >
      {/* Top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent, hsla(174, 60%, 46%, 0.2) 30%, hsla(174, 60%, 46%, 0.3) 50%, hsla(174, 60%, 46%, 0.2) 70%, transparent)",
        }}
      />

      <div className="mx-auto w-[min(1200px,92%)]">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Logo column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center text-base group mb-4">
              <img
                src="/logo.png"
                alt="AI Genius Logo"
                className="h-14 w-14 object-cover -ml-2 -mr-3 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-semibold tracking-tight text-white transition-colors">
                AI Genius
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed text-white/40 max-w-[240px]">
              The global marketplace for AI agents. Discover, deploy, and monetize intelligent automation.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3
                className="section-tag mb-4"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/45 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-[12px] text-white/30">
            © 2026 AI Genius. All rights reserved.
          </div>

          {/* Social icons placeholder */}
          <div className="flex items-center gap-5">
            {["X", "LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200"
                style={{ letterSpacing: "0.1em" }}
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
