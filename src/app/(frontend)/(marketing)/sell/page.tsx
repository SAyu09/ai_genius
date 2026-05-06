import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import {
  Check,
  DollarSign,
  Globe,
  ShieldCheck,
  Sparkles,
  FileText,
  Upload,
  Tag,
  Rocket,
  BarChart3,
  Wallet,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sell on SellGetAI, Monetize your AI agents",
  description: "List your AI agent on the world's largest agent marketplace. Keep 85% of every sale.",
  openGraph: {
    title: "Sell on SellGetAI",
    description: "List once. Reach 80,000+ teams worldwide.",
  },
};

const benefits = [
  { icon: DollarSign, t: "Keep 85%", d: "Industry leading payout. We take a flat 15% to cover infra and distribution." },
  { icon: Globe, t: "Global reach", d: "80,000+ teams in 140+ countries discover agents on SellGetAI weekly." },
  { icon: ShieldCheck, t: "We handle billing", d: "Subscriptions, invoicing, taxes and chargebacks, all on us." },
  { icon: Sparkles, t: "Built in growth", d: "Featured placements, category boosts and homepage spotlights." },
];

const steps = [
  {
    n: "01",
    icon: FileText,
    t: "Create your seller account",
    d: "Sign up in under 60 seconds. Verify your email, add your payout details (bank, Wise or Stripe Connect) and complete a short tax form. No upfront fees, no contracts.",
    points: ["Free seller account", "Verified payouts in 60+ currencies", "Self serve onboarding"],
  },
  {
    n: "02",
    icon: Upload,
    t: "Upload your agent",
    d: "Bring your own code, container or hosted endpoint. We support Python, Node, LangChain, CrewAI, custom HTTP APIs and any LLM provider. Define inputs, outputs and required integrations in a simple manifest.",
    points: ["Any framework or provider", "Bring your own keys or use ours", "Sandbox for testing before launch"],
  },
  {
    n: "03",
    icon: Tag,
    t: "Set your pricing & listing",
    d: "Choose subscription, usage based or one time pricing. Add screenshots, a demo video, sample prompts, integrations and a clear value proposition. Our listing assistant scores your page and suggests improvements.",
    points: ["Flexible pricing models", "Free trials and discount codes", "AI assisted listing optimization"],
  },
  {
    n: "04",
    icon: ShieldCheck,
    t: "Pass our quality & security review",
    d: "Our team reviews your agent for safety, prompt injection resistance, data handling, billing logic and overall quality. Most reviews complete within 48 hours, with clear feedback if anything needs changes.",
    points: ["48 hour average review", "Security & safety checklist", "Direct feedback from our team"],
  },
  {
    n: "05",
    icon: Rocket,
    t: "Go live to the world",
    d: "Once approved, your agent appears in search, category pages and personalized recommendations for 80,000+ teams. New listings get a free 14 day boost on the homepage and category pages.",
    points: ["Free launch boost", "SEO friendly listing pages", "Shareable demo links"],
  },
  {
    n: "06",
    icon: BarChart3,
    t: "Grow with data & promotions",
    d: "Track installs, conversions, churn, revenue and reviews in real time. Run promotions, send updates to subscribers and apply for featured placements, partner spotlights and seasonal campaigns.",
    points: ["Real time analytics", "Built in promo tools", "Featured & spotlight programs"],
  },
  {
    n: "07",
    icon: Wallet,
    t: "Get paid every month",
    d: "Earnings settle automatically on the 1st of each month. Choose bank transfer, Wise, Stripe Connect or crypto. We handle invoicing, sales tax, VAT and chargebacks so you never touch a finance ticket.",
    points: ["Monthly automatic payouts", "Tax & VAT handled for you", "Transparent fee breakdown"],
  },
];

const requirements = [
  "Working agent with a clear use case",
  "Documented inputs, outputs and integrations",
  "Reasonable response times under load",
  "Compliance with our safety & content policy",
  "Responsive support within 48 hours",
  "A short demo video or live sandbox",
];

const faqs = [
  { q: "How much does it cost to list?", a: "Listing is free. We only earn when you earn. SellGetAI takes a flat 15% of every sale to cover billing, hosting, distribution and support." },
  { q: "Do I need to host my agent?", a: "No. You can host your own endpoint or deploy directly to our managed runtime with auto scaling, logs and per request billing baked in." },
  { q: "Which pricing models are supported?", a: "Monthly subscriptions, annual plans, usage based pricing, one time purchases, free trials and discount codes." },
  { q: "When and how do I get paid?", a: "Payouts settle on the 1st of every month for the prior month's earnings. Choose bank transfer, Wise, Stripe Connect or crypto." },
  { q: "Who owns the customer relationship?", a: "You do. You see your buyers, can message subscribers and export your customer list at any time." },
];

export default function SellPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="mx-auto w-[min(1100px,92%)] text-center">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground">For builders</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Turn your AI agent into <span className="text-gradient italic">global revenue.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
              List once, sell everywhere. SellGetAI handles billing, distribution, infra and payouts in 60+ currencies, so you can focus on building.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up"><Button size="lg" className="rounded-full">Become a seller</Button></Link>
              <Link href="/marketplace"><Button size="lg" variant="outline" className="rounded-full">See examples</Button></Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-10 sm:py-12">
          <div className="mx-auto grid w-[min(1200px,92%)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.t} className="rounded-3xl border border-border bg-card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/15 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-xl">{b.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed process */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">The full process</p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl">From idea to first payout, step by step.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Every successful seller on SellGetAI follows the same simple flow. Here is exactly what to expect.
              </p>
            </div>

            <div className="mt-12 grid gap-5">
              {steps.map((s) => (
                <div key={s.n} className="grid gap-5 rounded-3xl border border-border bg-card p-6 sm:p-8 md:grid-cols-[auto_1fr_auto] md:items-start">
                  <div className="flex items-center gap-4">
                    <div className="font-display text-4xl sm:text-5xl text-gradient">{s.n}</div>
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/15 text-primary md:hidden">
                      <s.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl">{s.t}</h3>
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground">{s.d}</p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="hidden grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground md:grid">
                    <s.icon className="h-6 w-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you need */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-[min(1100px,92%)] grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">What you need</p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl">Requirements to list.</h2>
              <p className="mt-4 text-muted-foreground">
                We keep the bar high so buyers can trust every agent they install. Here is what we look for during review.
              </p>
              <Link href="/sign-up" className="mt-6 inline-block">
                <Button size="lg" className="rounded-full">Start your application</Button>
              </Link>
            </div>
            <ul className="grid gap-3">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Everything included */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-[min(1100px,92%)]">
            <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-border bg-foreground p-8 text-background sm:p-14">
              <h2 className="font-display text-3xl sm:text-5xl">Everything included.</h2>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Subscription & usage based billing",
                  "Global payouts in 60+ currencies",
                  "Sales tax & VAT handled",
                  "Hosted runtime + auto scaling",
                  "Buyer reviews & ratings",
                  "Promo placements & seasonal campaigns",
                  "Real time analytics dashboard",
                  "Dedicated seller success team",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm sm:text-base text-background/85">
                    <Check className="h-4 w-4 text-primary-glow" /> {i}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="mt-8 inline-block">
                <Button size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90">Start selling</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Seller FAQ */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-[min(900px,92%)]">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Seller FAQ</p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl">More questions?</h2>
            </div>
            <div className="mt-10 grid gap-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm sm:text-base font-medium">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" /> {f.q}
                    </span>
                    <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
