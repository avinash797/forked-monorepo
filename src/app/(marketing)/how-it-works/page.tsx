import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { StepDiagrams } from "@/components/marketing/how-it-works/step-diagrams";
import { EloExplainer } from "@/components/marketing/how-it-works/elo-explainer";
import { FaqAccordion } from "@/components/marketing/how-it-works/faq-accordion";

export const metadata: Metadata = buildMetadata({
  title: "How It Works — Forked",
  description:
    "Eat. Snap. Compare. Rank. Learn how Forked uses Elo-rated dish battles to find the best food in your city.",
});

export default function HowItWorksPage() {
  return (
    <div className="bg-background -mt-24 pt-24">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-32">
        {/* Hero */}
        <div className="text-center">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
            HOW IT WORKS
          </p>
          <h1 className="font-display italic font-black text-4xl md:text-7xl tracking-tighter text-primary">
            EAT. SNAP. COMPARE. RANK.
          </h1>
          <p className="text-tertiary mt-6 max-w-md mx-auto text-sm leading-relaxed">
            Four simple steps to find the best food in your city. No inflated
            ratings. No sponsored reviews. Just honest, battle-tested rankings.
          </p>
        </div>

        {/* Step Diagrams */}
        <StepDiagrams />

        {/* Elo Explainer */}
        <EloExplainer />

        {/* FAQ */}
        <FaqAccordion />
      </div>
    </div>
  );
}
