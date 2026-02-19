import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/marketing/hero-section";
import { VisionSection } from "@/components/marketing/vision-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { EloBattleSection } from "@/components/marketing/elo-battle-section";
import { LeaderboardPreview } from "@/components/marketing/leaderboard-preview";
import { MissionSection } from "@/components/marketing/mission-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

export const revalidate = 600; // ISR: revalidate every 10 minutes

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <VisionSection />
        <HowItWorksSection />
        <EloBattleSection />
        {!IS_WAITLIST_MODE && <LeaderboardPreview />}
        <MissionSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
