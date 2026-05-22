import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="mx-auto w-[min(1200px,92%)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-gray-500 font-medium">
        <Link href="/" className="flex items-center gap-2 font-display text-base">
          <img
            src="/logo.png"
            alt="AI Genius Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold tracking-tight text-gray-900">AI Genius</span>
        </Link>
        <div className="text-center">© 2026 AI Genius. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="/sell" className="hover:text-primary transition-colors">List an Agent</Link>
        </div>
      </div>
    </footer>
  );
}
