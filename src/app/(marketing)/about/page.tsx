import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { AboutHero } from "@/components/marketing/about/about-hero";
import { StorySection } from "@/components/marketing/about/story-section";
import { TeamSection } from "@/components/marketing/about/team-section";
import { InvestorsSection } from "@/components/marketing/about/investors-section";

export const metadata: Metadata = buildMetadata({
  title: "About — Forked",
  description:
    "Forked is an Elo-based dish rating platform born in New Orleans. Not restaurant ratings. Dish ratings.",
});

export default function AboutPage() {
  return (
    <div className="bg-[#050505] -mt-24 pt-24">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-32">
        <AboutHero />
        <StorySection />
        <TeamSection />
        <InvestorsSection />
      </div>
    </div>
  );
}
