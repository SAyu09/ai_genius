import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-16 sm:py-20">
      <div className="mx-auto grid w-[min(1200px,92%)] gap-12 sm:grid-cols-2 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-display text-xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight text-foreground">sellget<span className="text-primary">ai</span></span>
          </Link>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-500 max-w-[280px]">
            The worldwide marketplace for AI agents. Built by makers, for teams.
          </p>
        </div>
        
        <div>
          <div className="text-[13px] font-bold uppercase tracking-wider text-slate-900 mb-5">Marketplace</div>
          <ul className="space-y-3.5 text-[15px] text-slate-500 font-medium">
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Browse agents</Link></li>
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Categories</Link></li>
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">New releases</Link></li>
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Top rated</Link></li>
          </ul>
        </div>
        
        <div>
          <div className="text-[13px] font-bold uppercase tracking-wider text-slate-900 mb-5">Sellers</div>
          <ul className="space-y-3.5 text-[15px] text-slate-500 font-medium">
            <li><Link href="/sell" className="hover:text-primary transition-colors">List an agent</Link></li>
            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing &amp; fees</Link></li>
            <li><Link href="/sell" className="hover:text-primary transition-colors">Seller guide</Link></li>
            <li><Link href="/sell" className="hover:text-primary transition-colors">Payouts</Link></li>
          </ul>
        </div>
        
        <div>
          <div className="text-[13px] font-bold uppercase tracking-wider text-slate-900 mb-5">Company</div>
          <ul className="space-y-3.5 text-[15px] text-slate-500 font-medium">
            <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
            <li><Link href="/about" className="hover:text-primary transition-colors">Careers</Link></li>
            <li><Link href="/about" className="hover:text-primary transition-colors">Privacy</Link></li>
            <li><Link href="/about" className="hover:text-primary transition-colors">Terms</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="mx-auto mt-16 w-[min(1200px,92%)] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-8 text-[13px] text-slate-500 font-medium">
        <div>© {new Date().getFullYear()} SellGetAI. Built worldwide.</div>
        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
          <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
          <Link href="#" className="hover:text-primary transition-colors">GitHub</Link>
        </div>
      </div>
    </footer>
  );
}
