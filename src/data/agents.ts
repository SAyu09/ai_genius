export type Agent = {
  slug: string;
  name: string;
  tag: string;
  desc: string;
  long: string;
  price: number;
  rating: number;
  reviews: number;
  sales: string;
  author: string;
  authorBio: string;
  features: string[];
  integrations: string[];
  useCases: string[];
};

export const agents: Agent[] = [
  {
    slug: "atlas-sdr",
    name: "Atlas SDR",
    tag: "Sales",
    desc: "Books qualified meetings on autopilot via personalized cold email + LinkedIn.",
    long: "Atlas SDR is a fully autonomous sales development rep. It researches prospects, writes hyper-personalized multi-channel sequences, handles replies and books meetings straight into your calendar. Trained on 4M+ winning sequences across SaaS, fintech and services.",
    price: 49,
    rating: 4.9,
    reviews: 1284,
    sales: "3.2k",
    author: "Lumen Labs",
    authorBio: "A team of ex-Outreach and Salesloft engineers building the next generation of GTM agents.",
    features: ["Multi-channel outreach (email + LinkedIn)", "Live reply handling & objection responses", "Auto-research from 30+ data sources", "Calendar booking + CRM sync"],
    integrations: ["Gmail", "Outlook", "HubSpot", "Salesforce", "LinkedIn", "Slack"],
    useCases: ["Outbound prospecting", "Event follow-ups", "Reactivating cold leads"],
  },
  {
    slug: "helio-support",
    name: "Helio Support",
    tag: "Support",
    desc: "24/7 multilingual customer support trained on your docs and tickets.",
    long: "Helio handles tier-1 and tier-2 customer support across email, chat and Slack, in 38 languages. It learns from your help center, past tickets and product docs, and escalates to humans only when truly needed.",
    price: 79,
    rating: 4.8,
    reviews: 942,
    sales: "2.1k",
    author: "Northwind",
    authorBio: "Veteran support automation team with deployments at 200+ B2B SaaS companies.",
    features: ["38 languages out of the box", "Auto-trains on your help center", "Smart human handoff", "Sentiment & CSAT tracking"],
    integrations: ["Zendesk", "Intercom", "Front", "Slack", "Notion"],
    useCases: ["After-hours support", "L1 ticket deflection", "Multi-language coverage"],
  },
  {
    slug: "forge-researcher",
    name: "Forge Researcher",
    tag: "Research",
    desc: "Deep web research with cited reports delivered to Notion or Slack.",
    long: "Forge runs deep, multi-step web research and ships a fully cited report to your tool of choice. Great for competitive intel, market sizing, due diligence and academic synthesis.",
    price: 29,
    rating: 4.7,
    reviews: 2210,
    sales: "5.6k",
    author: "Kite & Co",
    authorBio: "Independent AI lab focused on long-horizon research agents.",
    features: ["Multi-step planning", "Inline source citations", "Custom output templates", "Scheduled re-runs"],
    integrations: ["Notion", "Slack", "Google Docs", "Linear"],
    useCases: ["Competitive intel", "Investor memos", "Topic deep-dives"],
  },
  {
    slug: "quill-writer",
    name: "Quill Writer",
    tag: "Content",
    desc: "On-brand long-form articles, newsletters and SEO briefs at scale.",
    long: "Quill writes long-form content that actually sounds like your brand. Feed it your style guide, past articles and target keywords, get publication-ready drafts with internal linking and SEO meta.",
    price: 39,
    rating: 4.9,
    reviews: 3104,
    sales: "8.4k",
    author: "Inkstone",
    authorBio: "Editorial-AI studio that has shipped content for 50+ media brands.",
    features: ["Brand voice training", "SEO-optimized briefs", "Image generation", "WordPress / Webflow publishing"],
    integrations: ["WordPress", "Webflow", "Ghost", "Notion", "Ahrefs"],
    useCases: ["Programmatic SEO", "Newsletters", "Thought leadership"],
  },
  {
    slug: "pulse-analyst",
    name: "Pulse Analyst",
    tag: "Analytics",
    desc: "Connects to your data warehouse and answers business questions in plain English.",
    long: "Pulse is a senior data analyst that lives in Slack. Ask any business question in plain English; Pulse writes the SQL, runs it against your warehouse and returns charts, insights and recommendations.",
    price: 99,
    rating: 4.6,
    reviews: 412,
    sales: "920",
    author: "Vector AI",
    authorBio: "Data infrastructure specialists from the Snowflake & Databricks ecosystem.",
    features: ["Text-to-SQL with semantic layer", "Auto-generated charts", "Anomaly alerts", "Scheduled briefings"],
    integrations: ["Snowflake", "BigQuery", "Postgres", "dbt", "Slack"],
    useCases: ["Self-serve analytics", "Exec dashboards", "KPI monitoring"],
  },
  {
    slug: "nimbus-ops",
    name: "Nimbus Ops",
    tag: "Operations",
    desc: "Automates invoice triage, vendor onboarding and approval routing.",
    long: "Nimbus is your back-office co-pilot. It reads invoices, validates vendors, routes approvals and pushes clean records into your ERP, cutting AP cycles by up to 70%.",
    price: 59,
    rating: 4.8,
    reviews: 588,
    sales: "1.4k",
    author: "Halcyon",
    authorBio: "Operations-AI team formerly at Ramp and Brex.",
    features: ["OCR + line-item extraction", "Approval workflows", "Vendor risk checks", "ERP sync"],
    integrations: ["NetSuite", "QuickBooks", "Xero", "Slack", "DocuSign"],
    useCases: ["Accounts payable", "Vendor onboarding", "Expense review"],
  },
  {
    slug: "orbit-recruiter",
    name: "Orbit Recruiter",
    tag: "HR",
    desc: "Sources, screens and schedules candidates for any role, in any geo.",
    long: "Orbit handles top-of-funnel recruiting end-to-end. It sources passive candidates across LinkedIn and GitHub, runs structured screening conversations and books interviews directly with hiring managers.",
    price: 89,
    rating: 4.7,
    reviews: 326,
    sales: "740",
    author: "Northstar",
    authorBio: "Talent-tech founders building the recruiting team of the future.",
    features: ["Boolean + AI sourcing", "Structured screening", "Calendar scheduling", "ATS sync"],
    integrations: ["Greenhouse", "Lever", "Ashby", "LinkedIn", "GitHub"],
    useCases: ["Eng hiring", "Sales hiring", "High-volume sourcing"],
  },
  {
    slug: "ember-designer",
    name: "Ember Designer",
    tag: "Design",
    desc: "Generates on-brand marketing creative, ads and social posts in seconds.",
    long: "Ember turns a single brief into a full set of on-brand creative, banner ads, social posts, email headers and landing-page heroes. Trained on your brand kit for pixel-perfect consistency.",
    price: 35,
    rating: 4.8,
    reviews: 1455,
    sales: "4.1k",
    author: "Studio Forma",
    authorBio: "Independent design studio building generative tooling for in-house teams.",
    features: ["Brand kit ingestion", "Multi-format export", "A/B variants", "Figma plugin"],
    integrations: ["Figma", "Adobe CC", "Meta Ads", "Google Ads", "Canva"],
    useCases: ["Performance creative", "Social campaigns", "Lifecycle email"],
  },
  {
    slug: "sage-legal",
    name: "Sage Legal",
    tag: "Legal",
    desc: "Reviews contracts, flags risk and suggests redlines in your house style.",
    long: "Sage reads NDAs, MSAs and DPAs against your playbook, flags non-standard clauses, and suggests redlines in tracked changes, cutting contract review time by 80%.",
    price: 129,
    rating: 4.9,
    reviews: 218,
    sales: "510",
    author: "Praxis Legal",
    authorBio: "Ex-BigLaw associates building AI for in-house legal teams.",
    features: ["Playbook-aware redlines", "Clause library", "Risk scoring", "Word add-in"],
    integrations: ["Word", "Google Docs", "Ironclad", "DocuSign"],
    useCases: ["NDA review", "Vendor contracts", "DPA negotiation"],
  },
];

export function getAgent(slug: string) {
  return agents.find((a) => a.slug === slug);
}

export const categories = [
  "All", "Sales", "Support", "Research", "Content", "Analytics", "Operations", "HR", "Design", "Legal",
];
