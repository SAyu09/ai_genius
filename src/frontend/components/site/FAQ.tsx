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
    <section className="py-20">
      <div className="mx-auto w-[min(900px,92%)]">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">FAQ</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Questions, answered.</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
