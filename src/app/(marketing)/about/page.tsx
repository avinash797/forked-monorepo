import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { AboutHero } from "@/components/marketing/about/about-hero";
import { StorySection } from "@/components/marketing/about/story-section";
import { QRCodeDownload } from "@/components/marketing/qr-code-download";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

export const metadata: Metadata = buildMetadata({
  title: "About — Forked",
  description:
    "Forked is a dish ranking platform born in New Orleans. Not restaurant ratings. Dish ratings. Ranked by real head-to-head battles.",
});

export default function AboutPage() {
  return (
    <div className="bg-bg -mt-24 pt-24">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-32">
        <AboutHero />
        <StorySection />

        {/* Download Strip — hidden in waitlist mode */}
        {!IS_WAITLIST_MODE && (
          <section className="text-center space-y-6">
            <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-text-primary">
              Settle Your Own Argument
            </h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Scan to download Forked. Rate your first dish in under 30 seconds.
            </p>
            <div className="flex justify-center">
              <QRCodeDownload />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
