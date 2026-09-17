import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy — Forked",
  description:
    "How Forked collects, uses, and protects your data. Learn about our privacy practices for our dish ranking app.",
});

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" effectiveDate="March 18, 2026">
      <p>
        Forked (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the
        Forked mobile application (the &quot;App&quot;). This Privacy Policy
        explains how we collect, use, disclose, and safeguard your information
        when you use our App.
      </p>
      <p>
        By using the App, you agree to the collection and use of information in
        accordance with this policy.
      </p>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          1. Information We Collect
        </h2>
        <h3 className="text-base font-bold text-text-primary mb-2">
          Information You Provide
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account Information:</strong> Email address, username,
            display name, bio, and profile avatar.
          </li>
          <li>
            <strong>Sign-In Provider Data:</strong> If you sign in with Google or
            Apple, we receive your email address and, where you permit it, your
            name from that provider in order to create and authenticate your
            account. We never receive your password. If you use Apple&apos;s
            &quot;Hide My Email&quot; option, we only ever see the relay address
            Apple generates for you.
          </li>
          <li>
            <strong>Ratings &amp; Content:</strong> Photos of dishes, sentiment
            ratings (liked, okay, disliked), taste tag preferences, and optional
            notes about dishes.
          </li>
          <li>
            <strong>Restaurant Selections:</strong> Which restaurants and dish
            types you rate.
          </li>
        </ul>
        <h3 className="text-base font-bold text-text-primary mt-4 mb-2">
          Information Collected Automatically
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Location Data:</strong> We collect precise GPS location data
            to verify your proximity to restaurants when submitting ratings and
            to show nearby restaurants. Location is only accessed when you use
            location-dependent features and with your explicit permission.
          </li>
          <li>
            <strong>Photo Metadata:</strong> When you upload a dish photo, we may
            extract and store EXIF metadata including embedded GPS coordinates
            and timestamp. This data is used for location verification and is
            deleted when you delete your account.
          </li>
          <li>
            <strong>Usage Analytics:</strong> We use Amplitude to collect
            anonymized usage data such as feature interactions, screen views, and
            app performance metrics. This data does not include your personal
            ratings or photos.
          </li>
          <li>
            <strong>Device Information:</strong> Device type, operating system
            version, and app version for compatibility and debugging purposes.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          2. How We Use Your Information
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Personalized Rankings:</strong> Your sentiment ratings and
            pairwise comparisons power your personal dish rankings using our
            Elo-based scoring system.
          </li>
          <li>
            <strong>Community Leaderboards:</strong> Your ratings contribute to
            community Bayesian scores that help other users find the best dishes.
            Individual ratings are never displayed publicly with your identity —
            community scores are aggregated and anonymized.
          </li>
          <li>
            <strong>Restaurant Discovery:</strong> Location data is used to sort
            restaurants by proximity and verify you are near a restaurant when
            rating.
          </li>
          <li>
            <strong>App Improvement:</strong> Anonymized analytics help us
            understand how the App is used so we can improve the experience.
          </li>
          <li>
            <strong>Account Management:</strong> Email is used for authentication
            and account recovery.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          3. How Your Information Appears to Others
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Community Scores:</strong> Your ratings contribute to
            aggregated community scores. These scores are calculated using a
            Bayesian algorithm and do not reveal individual users&apos; ratings.
          </li>
          <li>
            <strong>Recent Activity:</strong> Your username may appear in the
            recent battle ticker on the Discover screen, showing that you
            recently rated a dish at a restaurant. No scores or sentiments are
            shown.
          </li>
          <li>
            <strong>Photos:</strong> Photos you upload of dishes may appear on
            dish and restaurant detail pages. Photos are not attributed to your
            username on these pages.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          4. Third-Party Services
        </h2>
        <p>
          We use the following third-party services to operate the App:
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-bold text-text-primary">
                  Service
                </th>
                <th className="text-left py-2 pr-4 font-bold text-text-primary">
                  Purpose
                </th>
                <th className="text-left py-2 font-bold text-text-primary">
                  Data Shared
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Supabase</td>
                <td className="py-2 pr-4">
                  Authentication, database, file storage
                </td>
                <td className="py-2">Account info, ratings, photos</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Google Maps</td>
                <td className="py-2 pr-4">
                  Map display, restaurant location data
                </td>
                <td className="py-2">Anonymized location queries</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Amplitude</td>
                <td className="py-2 pr-4">Usage analytics</td>
                <td className="py-2">Anonymized usage events, device info</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Google Sign-In</td>
                <td className="py-2 pr-4">Account authentication</td>
                <td className="py-2">Email address, name, Google account ID</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">
                  Sign in with Apple
                </td>
                <td className="py-2 pr-4">Account authentication</td>
                <td className="py-2">
                  Email address (or Apple relay address), name
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Expo</td>
                <td className="py-2 pr-4">
                  App delivery and push notifications (if enabled)
                </td>
                <td className="py-2">Push notification tokens, device info</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Each third-party service operates under its own privacy policy. We
          encourage you to review their policies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          5. Data Retention
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Active Accounts:</strong> We retain your data for as long as
            your account is active.
          </li>
          <li>
            <strong>Account Deletion:</strong> When you delete your account
            through the App:
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>
                Your personal information (name, email, avatar, bio, push
                tokens) is anonymized and de-identified. Your profile is retained
                as an anonymous placeholder to preserve database integrity, but
                contains no identifiable information.
              </li>
              <li>
                All photos you uploaded (dish photos and profile avatar) are
                permanently deleted from our storage servers.
              </li>
              <li>
                Photo metadata (EXIF location and timestamps) is permanently
                deleted.
              </li>
              <li>
                Your individual ratings are anonymized (disassociated from your
                identity) to preserve the integrity of community leaderboard
                scores. Only the numerical scores and sentiment are retained — no
                personal notes, photos, or identifying information remains. No
                one, including us, can trace these anonymized ratings back to
                you.
              </li>
              <li>Your authentication account is permanently deleted.</li>
            </ul>
          </li>
          <li>
            <strong>Analytics Data:</strong> Anonymized analytics data may be
            retained indefinitely as it cannot be linked to individual users.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          6. Data Security
        </h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect your personal information, including:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            All data transmitted between the App and our servers is encrypted
            using TLS/SSL.
          </li>
          <li>
            Authentication is handled through Supabase&apos;s secure auth
            infrastructure.
          </li>
          <li>
            Photos are stored in Supabase&apos;s secure cloud storage with
            access controls.
          </li>
          <li>
            We do not store passwords — authentication uses secure token-based
            sessions.
          </li>
        </ul>
        <p className="mt-2">
          While we strive to protect your information, no method of electronic
          transmission or storage is 100% secure. We cannot guarantee absolute
          security.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          7. Your Rights and Choices
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account Deletion:</strong> You can delete your account at any
            time from the Settings screen in the App. This is permanent and
            cannot be undone. If you no longer have the App installed, you can{" "}
            <a
              href="/delete-account"
              className="text-accent underline underline-offset-2"
            >
              request account and data deletion here
            </a>
            .
          </li>
          <li>
            <strong>Location Permissions:</strong> You can revoke location access
            at any time through your device settings. Some features (nearby
            restaurant sorting, proximity verification) will be unavailable
            without location access.
          </li>
          <li>
            <strong>Photo Permissions:</strong> You can revoke camera and photo
            library access through your device settings. You will not be able to
            submit new ratings without camera access.
          </li>
          <li>
            <strong>Data Access:</strong> To request a copy of your data, contact
            us at the email below.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          8. Children&apos;s Privacy
        </h2>
        <p>
          Forked is not intended for children under the age of 13. We do not
          knowingly collect personal information from children under 13. If we
          become aware that we have collected data from a child under 13, we will
          take steps to delete that information promptly. If you believe a child
          under 13 has provided us with personal information, please contact us.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          9. Changes to This Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you
          of any changes by updating the &quot;Last Updated&quot; date at the top
          of this policy. Continued use of the App after changes constitutes
          acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          10. Contact Us
        </h2>
        <p>
          If you have questions about this Privacy Policy or your personal data,
          contact us at{" "}
          <a
            href="mailto:privacy@forkedapp.com"
            className="text-accent hover:underline"
          >
            privacy@forkedapp.com
          </a>{" "}
          or visit{" "}
          <a
            href="https://www.forkedapp.com"
            className="text-accent hover:underline"
          >
            www.forkedapp.com
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
