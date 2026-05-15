import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/frontend/components/ui/accordion";

const faqs = [
  { q: "What exactly is an AI agent?", a: "An AI agent is autonomous software that completes goals on your behalf, sending emails, answering customers, analyzing data, using LLMs, tools and integrations." },
  { q: "How does pricing work?", a: "Each agent sets its own monthly price. You can cancel any time. Some agents also offer usage-based or one-time pricing." },
  { q: "Can I sell my own agent?", a: "Yes. Anyone can list. You keep 85% of every sale and we handle billing, infra and global payouts." },
  { q: "Is my data safe?", a: "Every listed agent passes a security review. You control which integrations and data each agent can access." },
  { q: "Which integrations are supported?", a: "300+ integrations including Slack, Gmail, HubSpot, Salesforce, Notion, Snowflake, Linear and more." },
];

export function FAQ() {
  return (
    <section className="py-24 bg-surface">
      <div className="mx-auto w-[min(800px,92%)]">
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">FAQ</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-foreground">Questions, answered.</h2>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((f, i) => (
            <AccordionItem 
              key={i} 
              value={`f-${i}`}
              className="rounded-2xl border border-gray-200 bg-white px-6 shadow-sm transition-all data-[state=open]:border-primary/40 data-[state=open]:shadow-[var(--shadow-soft)] hover:border-gray-300"
            >
              <AccordionTrigger className="text-left text-[17px] font-semibold text-slate-800 transition-colors hover:no-underline hover:text-primary data-[state=open]:text-primary py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-slate-500 pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
