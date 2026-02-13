import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About — Forked",
  description:
    "Forked is an Elo-based dish rating platform. Not restaurant ratings. Dish ratings.",
});

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">
        About Forked
      </h1>
      <div className="prose prose-lg text-text-secondary space-y-4">
        <p>
          Forked is a dish-specific rating and ranking platform born in New
          Orleans. We believe the best food discovery doesn&apos;t come from
          rating restaurants — it comes from rating individual dishes.
        </p>
        <p>
          Using an Elo rating system (the same system used to rank chess
          players), we pit dishes against each other in head-to-head battles.
          The result? Rankings that reflect what real people actually prefer.
        </p>
        <p>
          No inflated star ratings. No sponsored reviews. Just honest,
          battle-tested rankings of the best food in your city.
        </p>
      </div>
    </div>
  );
}
