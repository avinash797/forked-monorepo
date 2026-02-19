import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { AboutHero } from "@/components/marketing/about/about-hero";
import { StorySection } from "@/components/marketing/about/story-section";
import { TeamSection } from "@/components/marketing/about/team-section";
import { InvestorsSection } from "@/components/marketing/about/investors-section";
import { QRCodeDownload } from "@/components/marketing/qr-code-download";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

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
        {/* <TeamSection />
        <InvestorsSection /> */}

        {/* Download Strip — hidden in waitlist mode */}
        {!IS_WAITLIST_MODE && (
          <section className="text-center space-y-6">
            <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-white">
              Get the App
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Scan the QR code to download Forked and start rating dishes in
              your city.
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
