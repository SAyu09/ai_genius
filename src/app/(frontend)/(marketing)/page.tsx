import { Header } from "@/frontend/components/site/Header";
import { Hero } from "@/frontend/components/site/Hero";
import { LogoCloud } from "@/frontend/components/site/LogoCloud";
import { Categories } from "@/frontend/components/site/Categories";
import { FeaturedAgents } from "@/frontend/components/site/FeaturedAgents";
import { HowItWorks } from "@/frontend/components/site/HowItWorks";
import { Testimonials } from "@/frontend/components/site/Testimonials";
import { SellCTA } from "@/frontend/components/site/SellCTA";
import { FAQ } from "@/frontend/components/site/FAQ";
import { Footer } from "@/frontend/components/site/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <LogoCloud />
        <Categories />
        <FeaturedAgents />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <SellCTA />
      </main>
      <Footer />
    </div>
  );
}
