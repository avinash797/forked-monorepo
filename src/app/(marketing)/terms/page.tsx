import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service — Forked",
  description:
    "Terms and conditions for using Forked, the Elo-based dish rating platform.",
});

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" effectiveDate="February 17, 2026">
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using the Forked app and website
          (&quot;Service&quot;), you agree to be bound by these Terms of
          Service. If you do not agree, do not use the Service. We may update
          these terms at any time, and continued use constitutes acceptance.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          2. Eligibility
        </h2>
        <p>
          You must be at least 13 years old to use Forked. If you are under 18,
          you must have parental or guardian consent. By using the Service, you
          represent that you meet these age requirements.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          3. User Accounts
        </h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials. You agree to provide accurate information during
          registration and to keep your profile information current. You are
          responsible for all activity that occurs under your account.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          4. User Content
        </h2>
        <p>
          You retain ownership of the dish photos and reviews you submit. By
          uploading content, you grant Forked a non-exclusive, worldwide,
          royalty-free license to use, display, and distribute your content in
          connection with the Service, including on public leaderboard pages and
          in marketing materials. You represent that you have the right to share
          any content you upload.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          5. Prohibited Conduct
        </h2>
        <p>
          You agree not to: upload fraudulent or misleading dish photos; submit
          ratings for dishes you have not personally consumed; create multiple
          accounts to manipulate rankings; harass other users; attempt to
          reverse-engineer the Elo algorithm; scrape data from the Service
          without permission; or use automated tools to interact with the
          Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          6. Elo Rankings Disclaimer
        </h2>
        <p>
          Forked&apos;s Elo-based rankings reflect aggregated user preferences
          and are not editorial endorsements. Rankings are algorithmic and
          change in real-time based on battle outcomes. Forked does not
          guarantee the accuracy of any ranking, and a dish&apos;s position on a
          leaderboard does not constitute a food safety recommendation.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          7. Photo Requirements
        </h2>
        <p>
          All dish ratings require a photo of the actual dish consumed. Photos
          must be original and taken by you. Stock photos, photos from the
          internet, and photos of dishes you did not eat are prohibited. We
          reserve the right to remove photos that violate these requirements and
          to adjust associated ratings.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          8. Termination
        </h2>
        <p>
          We reserve the right to suspend or terminate your account at any time
          for violations of these Terms, including ranking manipulation,
          fraudulent content, or abusive behavior. Upon termination, your right
          to use the Service ceases immediately, though anonymized rating data
          may be retained for leaderboard integrity.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          9. Disclaimers
        </h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind. We do not warrant that the Service
          will be uninterrupted, error-free, or that leaderboard data will be
          completely accurate. We are not responsible for the quality, safety,
          or legality of any food establishment appearing on our platform.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          10. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by law, Forked shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of profits, data, or goodwill,
          arising from your use of the Service. Our total liability shall not
          exceed the amount you paid to Forked in the twelve months preceding
          the claim.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          11. Governing Law
        </h2>
        <p>
          These Terms shall be governed by the laws of the State of Louisiana,
          without regard to conflict of law principles. Any disputes shall be
          resolved in the courts of Orleans Parish, Louisiana.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          12. Changes to Terms
        </h2>
        <p>
          We reserve the right to modify these Terms at any time. Material
          changes will be communicated via in-app notification or email at least
          14 days before taking effect. Your continued use of the Service after
          changes become effective constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          13. Contact Us
        </h2>
        <p>
          For questions about these Terms of Service, contact us at
          legal@forkedapp.com or write to Forked Inc., New Orleans, LA.
        </p>
      </section>
    </LegalPageLayout>
  );
}
