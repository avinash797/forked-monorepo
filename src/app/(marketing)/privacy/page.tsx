import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy — Forked",
  description:
    "How Forked collects, uses, and protects your data. Learn about our privacy practices for our dish rating platform.",
});

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" effectiveDate="February 17, 2026">
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          1. Information We Collect
        </h2>
        <p>
          When you create a Forked account, we collect your email address,
          display name, and optional profile photo. As you use the app, we
          collect dish ratings, Elo battle selections, photos of dishes you
          upload, and the restaurants and cities associated with your activity.
          We also collect device information, IP address, and usage analytics to
          improve the service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          2. How We Use Your Information
        </h2>
        <p>
          We use your data to power Forked&apos;s core features: calculating Elo
          rankings, generating leaderboards, displaying dish photos, and
          personalizing your experience. We also use aggregated, anonymized data
          for analytics and to improve our ranking algorithms. We may use your
          email to send important service updates, but we will never sell your
          email to third parties.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          3. Information Sharing
        </h2>
        <p>
          Your public profile, dish ratings, and uploaded photos are visible to
          other Forked users and on public leaderboard pages. We do not sell your
          personal information to third parties. We may share anonymized,
          aggregated data with partners for research purposes. We will disclose
          information if required by law or to protect the safety of our users.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          4. Data Retention
        </h2>
        <p>
          We retain your account data for as long as your account is active. If
          you delete your account, we will remove your personal information
          within 30 days, though anonymized ratings data may be retained to
          preserve leaderboard integrity. Dish photos are deleted when the
          associated rating is removed.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          5. Your Rights
        </h2>
        <p>
          You have the right to access, correct, or delete your personal data at
          any time. You can export your rating history from within the app. To
          request data deletion, contact us at privacy@getforked.app. California
          residents have additional rights under the CCPA, and EU residents have
          rights under GDPR, including the right to data portability and the
          right to object to processing.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          6. Cookies and Tracking
        </h2>
        <p>
          Our website uses essential cookies for authentication and session
          management. We use privacy-respecting analytics to understand how
          users interact with our leaderboard pages. We do not use third-party
          advertising trackers. You can control cookie preferences through your
          browser settings.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          7. Children&apos;s Privacy
        </h2>
        <p>
          Forked is not intended for children under 13 years of age. We do not
          knowingly collect personal information from children under 13. If we
          become aware that we have collected data from a child under 13, we will
          take steps to delete that information promptly.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          8. Changes to This Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of material changes by posting a notice in the app or sending an
          email. Your continued use of Forked after changes are posted
          constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          9. Contact Us
        </h2>
        <p>
          If you have questions about this Privacy Policy or your data, contact
          us at privacy@getforked.app or write to us at Forked Inc., New
          Orleans, LA.
        </p>
      </section>
    </LegalPageLayout>
  );
}
