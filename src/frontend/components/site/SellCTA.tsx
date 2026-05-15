import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export function SellCTA() {
  return (
    <section id="sell" className="py-24 bg-surface">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-10 sm:p-20 shadow-2xl">
          {/* Immersive radial glow behind the text and button */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full opacity-[0.15] blur-[100px] pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 rounded-full opacity-20 blur-[80px] pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)" }}
          />
          
          <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">For builders</p>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-[64px] leading-[1.1] font-semibold tracking-tight text-white">
                Turn your AI agent into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary-glow italic pr-2">global revenue.</span>
              </h2>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-300">
                List once. Reach 80,000+ teams worldwide. We handle billing, distribution,
                infra and payouts in 60+ currencies. You keep 85% of every sale.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end justify-center">
              <Link href="/sell" className="w-full lg:w-auto">
                <Button className="w-full lg:w-[280px] rounded-full bg-primary hover:bg-blue-600 text-white px-8 py-7 text-[17px] font-semibold shadow-[var(--shadow-glow)] transition-all hover:scale-105 active:scale-95">
                  Become a seller <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sell" className="w-full lg:w-auto">
                <Button variant="ghost" className="w-full lg:w-[280px] rounded-full text-slate-300 hover:text-white hover:bg-white/10 px-8 py-7 text-[17px] font-medium transition-colors">
                  Read seller guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
