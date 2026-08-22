import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import WhatIsPassport from "../components/WhatIsPassport";
import WhyPassport from "../components/WhyPassport";
import HowItWorks from "../components/HowItWorks";
import BuildingLifecycle from "../components/BuildingLifecycle";
import ExamplePassportCard from "../components/ExamplePassportCard";
import FeaturesSection from "../components/FeaturesSection";
import AIFutureSection from "../components/AIFutureSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-slate-900 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <WhatIsPassport />
        <WhyPassport />
        <HowItWorks />
        <BuildingLifecycle />
        <ExamplePassportCard />
        <FeaturesSection />
        <AIFutureSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
