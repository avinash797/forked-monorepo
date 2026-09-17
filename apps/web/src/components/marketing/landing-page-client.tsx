"use client";

import { useState } from "react";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
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

// Marketing-only typography — deliberately reuses the site's --font-display /
// --font-body variable names so it shadows the root layout's Inter/Bodoni
// Moda for this page's subtree only (Navbar, sections, Footer, modal). Every
// other route (blog, privacy, terms, leaderboard, admin) keeps Inter/Bodoni
// Moda from apps/web/src/app/layout.tsx untouched.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export function LandingPageClient({ leaderboardSection }: { leaderboardSection: React.ReactNode }) {
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const openEarlyAccess = () => setEarlyAccessOpen(true);

  return (
    <div
      className={`${bricolageGrotesque.variable} ${plusJakartaSans.variable} min-h-screen bg-bg text-text-primary flex flex-col selection:bg-accent selection:text-accent-on`}
    >
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
