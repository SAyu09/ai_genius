import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple pricing. Start free, scale as you grow.",
  openGraph: {
    title: "Pricing, SellGetAI",
    description: "Simple pricing. Start free, scale as you grow.",
  },
};

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    desc: "For individuals exploring agents.",
    features: ["Browse 2,400+ agents", "Deploy 1 agent", "Community support"],
    cta: "Get started",
  },
  {
    name: "Team",
    price: "$49",
    period: "/mo",
    desc: "For small teams running multiple agents.",
    features: ["Unlimited agent deploys", "Shared workspace", "Priority support", "Usage analytics"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations with custom needs.",
    features: ["SSO + SAML", "Dedicated success manager", "Custom SLAs", "Procurement & invoicing"],
    cta: "Contact sales",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 pb-20">
        <div className="mx-auto w-[min(1200px,92%)] text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Pricing</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">Simple pricing. Big leverage.</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Start free. Pay only as your team grows.</p>
        </div>

        <div className="mx-auto mt-12 grid w-[min(1100px,92%)] gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-3xl border p-8 ${
                t.featured ? "border-foreground bg-foreground text-background" : "border-border bg-card"
              }`}
            >
              <div className="font-display text-2xl">{t.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-5xl">{t.price}</span>
                {t.period && <span className={t.featured ? "text-background/60" : "text-muted-foreground"}>{t.period}</span>}
              </div>
              <p className={`mt-2 text-sm ${t.featured ? "text-background/70" : "text-muted-foreground"}`}>{t.desc}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 ${t.featured ? "text-primary-glow" : "text-primary"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth?tab=register" className="mt-8">
                <Button
                  size="lg"
                  className={`w-full rounded-full ${
                    t.featured ? "bg-background text-foreground hover:bg-background/90" : ""
                  }`}
                  variant={t.featured ? "default" : "outline"}
                >
                  {t.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 w-[min(900px,92%)] rounded-3xl border border-border bg-card p-8 text-center">
          <h2 className="font-display text-3xl">Selling agents?</h2>
          <p className="mt-2 text-muted-foreground">Listing is free. We take 15% per sale, you keep 85%. No monthly fees.</p>
          <Link href="/sell" className="mt-4 inline-block">
            <Button variant="outline" className="rounded-full">Learn about selling →</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
