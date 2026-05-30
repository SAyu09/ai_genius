import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/backend/lib/auth";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Bot, Check, ArrowLeft, ShieldCheck, Clock, TrendingUp, Zap } from "lucide-react";
import { SafeZoneSandbox } from "./SafeZoneSandbox";
import { CheckoutButton } from "./CheckoutButton";

export default async function AgentDetailPage(props: { params: Promise<{ agentId: string }> }) {
  const params = await props.params;
  const agentId = params.agentId;
  const session = await auth();

  const [agentWithSeller] = await db
    .select({ agent: agents, seller: users })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agentWithSeller || agentWithSeller.agent.status !== "approved") {
    notFound();
  }

  const { agent, seller } = agentWithSeller;
  const price = (agent.monthlyPriceCents || 0) / 100;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-8 pb-24">
        <div className="mx-auto w-[min(1200px,92%)]">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-indigo-600 mb-10 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
          </Link>

          <div className="grid lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
            
            {/* Left Column: Content */}
            <div className="space-y-12">
              
              {/* Agent Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8 border-b border-slate-100 pb-10">
                <div className="grid h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                  <Bot className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                      {agent.category || "Tool"}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Sandbox Tested
                    </span>
                    {agent.performancePass && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {agent.performanceAvgMs || 250}ms
                      </span>
                    )}
                  </div>
                  <h1 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight leading-tight">{agent.name}</h1>
                  <p className="mt-2 flex items-center gap-2 text-[14px] text-slate-500">
                    by <span className="text-slate-700 font-medium">{seller.name}</span>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </p>
                </div>
              </div>

              {/* Details Content */}
              <div className="mt-10">
                
                <section>
                  <h3 className="text-xl font-[family-name:var(--font-inter)] font-semibold text-slate-800 mb-4">
                    About this Agent
                  </h3>
                  <p className="text-[17px] leading-relaxed text-gray-600">{agent.description}</p>
                </section>
                
                {agent.longDesc && (
                  <section className="mt-12">
                    <h3 className="text-lg font-[family-name:var(--font-inter)] font-semibold text-slate-800 mb-4">Details</h3>
                    <div className="text-slate-500 leading-relaxed text-[15px]">
                      <p className="whitespace-pre-wrap">{agent.longDesc}</p>
                    </div>
                  </section>
                )}

                {(agent.features as string[])?.length > 0 && (
                  <section className="mt-14">
                    <h3 className="text-lg font-[family-name:var(--font-inter)] font-semibold text-slate-800 mb-5">Features</h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {(agent.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[14px] text-slate-600 leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                
                {/* Safe-Zone Sandbox */}
                <section className="mt-14 pt-10 border-t border-slate-100">
                  <div className="mb-6">
                    <h3 className="text-lg font-[family-name:var(--font-inter)] font-semibold text-slate-800">Test Before You Buy</h3>
                    <p className="text-slate-400 mt-1.5 text-[14px]">Try the agent with your own data. Inputs are not stored.</p>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <SafeZoneSandbox agentName={agent.name} latencyMs={agent.performanceAvgMs || 250} />
                  </div>
                </section>
              </div>
            </div>

            {/* Right Column: Sticky Checkout */}
            <div className="lg:pl-4">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-7 sm:p-8">
                
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Subscription</div>
                  <div className="flex items-end gap-1.5">
                    <span className="font-[family-name:var(--font-inter)] text-4xl font-bold text-slate-800 tracking-tight leading-none">${price}</span>
                    <span className="text-[14px] text-slate-400 mb-0.5">/ mo</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-[14px] text-gray-600 font-medium">
                    <Check className="h-4 w-4 text-emerald-500" /> Secure production deployment
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-gray-600 font-medium">
                    <Check className="h-4 w-4 text-emerald-500" /> Cancel or pause anytime
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-gray-600 font-medium">
                    <Check className="h-4 w-4 text-emerald-500" /> Automatic performance updates
                  </div>
                </div>

                <div className="pt-2">
                  <CheckoutButton agentId={agent.id} isLoggedIn={!!session?.user} />
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
                  <ShieldCheck className="h-4 w-4 opacity-70" />
                  <span>Secure, encrypted checkout via Stripe</span>
                </div>

                {(agent.useCases as string[])?.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">Recommended For</h4>
                    <div className="flex flex-wrap gap-2">
                      {(agent.useCases as string[]).map((useCase, i) => (
                        <span key={i} className="inline-flex px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 text-[13px] font-semibold">
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
