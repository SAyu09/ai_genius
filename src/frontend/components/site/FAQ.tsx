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
    <section className="py-12 sm:py-16 bg-gray-50/50">
      <div className="mx-auto w-[min(800px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">FAQ</p>
          <h2 className="mt-3 font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
            Questions, answered.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`f-${i}`}
                className="rounded-2xl border border-gray-200 bg-white px-6 transition-all duration-300 data-[state=open]:border-indigo-200 data-[state=open]:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.15)] hover:border-gray-300"
              >
                <AccordionTrigger className="text-left text-[17px] font-semibold text-gray-800 transition-colors hover:no-underline hover:text-indigo-600 data-[state=open]:text-indigo-600 py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-gray-600 pb-5">
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
