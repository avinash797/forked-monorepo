import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { LeaderboardPreview } from "@/components/marketing/leaderboard-preview";
import { MissionSection } from "@/components/marketing/mission-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { CtaSection } from "@/components/marketing/cta-section";

export const revalidate = 600; // ISR: revalidate every 10 minutes

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <LeaderboardPreview />
        <MissionSection />
        <StatsSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
