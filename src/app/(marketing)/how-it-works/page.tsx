import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "How It Works — Forked",
  description:
    "Eat. Snap. Compare. Rank. Learn how Forked uses Elo-rated dish battles to find the best food in your city.",
});

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">
        How It Works
      </h1>
      <div className="space-y-8 text-text-secondary">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            1. Eat a dish worth rating
          </h2>
          <p>
            Find a dish you feel strongly about — good or bad. We don&apos;t
            care about the restaurant&apos;s ambiance or service. We care about
            the food.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            2. Snap a photo
          </h2>
          <p>
            Photos are mandatory on Forked. They&apos;re your proof, your
            memory, and they make leaderboards come alive. No photo, no rating.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            3. Compare in &quot;This vs That&quot; battles
          </h2>
          <p>
            After rating a dish, we show you a head-to-head matchup against a
            similarly-rated dish you&apos;ve had before. Pick the winner. It
            takes 3 seconds.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            4. Watch the leaderboard update
          </h2>
          <p>
            Every battle updates Elo scores in real-time. The more battles a
            dish wins, the higher it climbs. The best food rises to the top —
            naturally.
          </p>
        </div>
      </div>
    </div>
  );
}
