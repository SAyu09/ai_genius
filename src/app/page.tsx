import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { LogoCloud } from "@/components/site/LogoCloud";
import { Categories } from "@/components/site/Categories";
import { FeaturedAgents } from "@/components/site/FeaturedAgents";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";
import { SellCTA } from "@/components/site/SellCTA";
import { FAQ } from "@/components/site/FAQ";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
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
