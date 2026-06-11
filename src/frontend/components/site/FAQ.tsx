"use client";

import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/frontend/components/ui/accordion";
import { viewportConfig } from "@/frontend/hooks/useAnimations";

const faqs = [
  { q: "What exactly is an AI agent?", a: "An AI agent is autonomous software that completes goals on your behalf, sending emails, answering customers, analyzing data, using LLMs, tools and integrations." },
  { q: "How does pricing work?", a: "Each agent sets its own monthly price. You can cancel any time. Some agents also offer usage-based or one-time pricing." },
  { q: "Can I sell my own agent?", a: "Yes. Anyone can list. You keep 85% of every sale and we handle billing, infra and global payouts." },
  { q: "Is my data safe?", a: "Every listed agent passes a security review. You control which integrations and data each agent can access." },
  { q: "Which integrations are supported?", a: "300+ integrations including Slack, Gmail, HubSpot, Salesforce, Notion, Snowflake, Linear and more." },
];

export function FAQ() {
  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: "var(--landing-bg)" }}>
      <div className="mx-auto w-[min(800px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <span className="section-tag">FAQ</span>
          <h2
            className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
            style={{ color: "var(--landing-text-primary)" }}
          >
            Questions, answered.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`f-${i}`}
                className="rounded-2xl bg-white px-7 transition-all duration-300 data-[state=open]:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.06)]"
                style={{
                  border: "1px solid var(--landing-border-light)",
                }}
              >
                <AccordionTrigger
                  className="text-left text-[16px] font-semibold transition-colors hover:no-underline py-5"
                  style={{ color: "var(--landing-text-primary)" }}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent
                  className="text-[15px] leading-relaxed pb-6"
                  style={{ color: "var(--landing-text-secondary)" }}
                >
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
