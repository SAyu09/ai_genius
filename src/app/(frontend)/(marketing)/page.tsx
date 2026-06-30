import { Header } from "@/frontend/components/site/Header";
import { Hero } from "@/frontend/components/site/Hero";
import { FeatureShowcase } from "@/frontend/components/site/FeatureShowcase";
import { LogoCloud } from "@/frontend/components/site/LogoCloud";
import { HowItWorks } from "@/frontend/components/site/HowItWorks";
import { Categories } from "@/frontend/components/site/Categories";
import { FeaturedAgents } from "@/frontend/components/site/FeaturedAgents";
import { Testimonials } from "@/frontend/components/site/Testimonials";
import { SellCTA } from "@/frontend/components/site/SellCTA";
import { FAQ } from "@/frontend/components/site/FAQ";
import { Footer } from "@/frontend/components/site/Footer";
import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function Home() {
  const dbAgents = await db
    .select({
      id: agents.id,
      slug: agents.slug,
      tag: agents.tag,
      name: agents.name,
      desc: agents.description,
      pricingModel: agents.pricingModel,
      priceCents: agents.monthlyPriceCents,
      rating: agents.avgRating,
      sales: agents.salesCount,
      author: users.name,
    })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(eq(agents.status, "approved"))
    .orderBy(desc(agents.salesCount))
    .limit(6);

  const formattedAgents = dbAgents.map((a) => ({
    id: a.id,
    slug: a.slug,
    tag: a.tag || "Utility",
    rating: a.rating ? Number(a.rating).toFixed(1) : "5.0",
    sales: a.sales ? `${a.sales}` : "0",
    name: a.name,
    author: a.author || "Unknown",
    desc: a.desc || "",
    pricingModel: a.pricingModel,
    price: a.priceCents ? Math.round(a.priceCents / 100) : 0,
  }));
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeatureShowcase />
        <LogoCloud />
        <HowItWorks />
        <Categories />
        <FeaturedAgents agents={formattedAgents} />
        <Testimonials />
        <FAQ />
        <SellCTA />
      </main>
      <Footer />
    </div>
  );
}
