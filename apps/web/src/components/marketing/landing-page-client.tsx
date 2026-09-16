"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { TheEnemy } from "@/components/marketing/the-enemy";
import { ThreePillars } from "@/components/marketing/three-pillars";
import { AntiSlopComparison } from "@/components/marketing/anti-slop-comparison";
import { SubredditReceipts } from "@/components/marketing/subreddit-receipts";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { EarlyAccessModal } from "@/components/marketing/early-access-modal";

export function LandingPageClient({ leaderboardSection }: { leaderboardSection: React.ReactNode }) {
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const openEarlyAccess = () => setEarlyAccessOpen(true);

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col selection:bg-accent selection:text-accent-on">
      <Navbar />
      <main className="flex-1">
        <Hero onOpenEarlyAccess={openEarlyAccess} />
        <TheEnemy />
        <ThreePillars />
        {leaderboardSection}
        <AntiSlopComparison />
        <SubredditReceipts />
        <FaqSection />
        <CtaSection onOpenEarlyAccess={openEarlyAccess} />
      </main>
      <Footer onOpenEarlyAccess={openEarlyAccess} />
      <EarlyAccessModal isOpen={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </div>
  );
}
