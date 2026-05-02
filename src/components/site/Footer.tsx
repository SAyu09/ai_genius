import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto grid w-[min(1200px,92%)] gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl">sellget<span className="text-gradient">ai</span></div>
          <p className="mt-3 text-sm text-muted-foreground">The worldwide marketplace for AI agents. Built by makers, for teams.</p>
        </div>
        <div>
          <div className="text-sm font-medium">Marketplace</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/marketplace" className="hover:text-foreground">Browse agents</Link></li>
            <li><Link href="/marketplace" className="hover:text-foreground">Categories</Link></li>
            <li><Link href="/marketplace" className="hover:text-foreground">New releases</Link></li>
            <li><Link href="/marketplace" className="hover:text-foreground">Top rated</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-medium">Sellers</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/sell" className="hover:text-foreground">List an agent</Link></li>
            <li><Link href="/pricing" className="hover:text-foreground">Pricing &amp; fees</Link></li>
            <li><Link href="/sell" className="hover:text-foreground">Seller guide</Link></li>
            <li><Link href="/sell" className="hover:text-foreground">Payouts</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-medium">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/about" className="hover:text-foreground">Careers</Link></li>
            <li><Link href="/about" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="/about" className="hover:text-foreground">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 w-[min(1200px,92%)] border-t border-border pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} SellGetAI. Built worldwide.
      </div>
    </footer>
  );
}
