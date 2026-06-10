import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service — Forked",
  description:
    "Terms and conditions for using Forked, the community-powered dish ranking app.",
});

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" effectiveDate="March 18, 2026">
      <p>
        Welcome to Forked. These Terms of Service (&quot;Terms&quot;) govern
        your use of the Forked mobile application (the &quot;App&quot;) operated
        by Forked (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By
        creating an account or using the App, you agree to be bound by these
        Terms.
      </p>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          1. Description of Service
        </h2>
        <p>
          Forked is a community-powered dish ranking app. Users rate dishes at
          restaurants by providing sentiment-based ratings and pairwise
          comparisons. These ratings are used to generate personalized rankings
          and aggregated community leaderboard scores using algorithmic
          calculations (Elo scoring and Bayesian averaging). Forked does not
          provide professional food reviews, endorsements, or guarantees about
          food quality or safety.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          2. Account Registration
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must be at least 13 years old to create an account.</li>
          <li>
            You are responsible for maintaining the security of your account
            credentials.
          </li>
          <li>
            You must provide accurate information when creating your account.
          </li>
          <li>One account per person. Do not create multiple accounts.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          3. User-Generated Content
        </h2>
        <h3 className="text-base font-bold text-text-primary mb-2">
          What You Submit
        </h3>
        <p>
          When using Forked, you may submit photos of dishes, sentiment ratings,
          taste tag selections, pairwise comparisons, and optional notes
          (&quot;User Content&quot;).
        </p>
        <h3 className="text-base font-bold text-text-primary mt-4 mb-2">
          License You Grant Us
        </h3>
        <p>
          By submitting User Content, you grant Forked a worldwide,
          non-exclusive, royalty-free, transferable license to use, display,
          reproduce, and distribute your User Content within the App for the
          purpose of operating the service — including displaying photos on dish
          and restaurant pages, computing community scores, and improving the
          App. This license continues for anonymized/aggregated data (such as
          your contribution to community scores) even after account deletion, as
          described in our Privacy Policy.
        </p>
        <h3 className="text-base font-bold text-text-primary mt-4 mb-2">
          Your Ownership
        </h3>
        <p>
          You retain ownership of your User Content. We do not claim ownership
          of your photos or ratings.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          4. Acceptable Use
        </h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            Submit photos that are obscene, pornographic, violent, hateful,
            discriminatory, or otherwise objectionable.
          </li>
          <li>
            Upload photos that do not depict food or are unrelated to the dish
            being rated.
          </li>
          <li>Submit fraudulent or intentionally misleading ratings.</li>
          <li>
            Attempt to manipulate community scores through fake accounts,
            coordinated rating schemes, or automated submissions.
          </li>
          <li>Use the App to harass, abuse, or harm other users.</li>
          <li>
            Reverse-engineer, decompile, or attempt to extract the source code
            of the App.
          </li>
          <li>Use the App for any illegal purpose.</li>
          <li>
            Interfere with or disrupt the App&apos;s infrastructure or other
            users&apos; experience.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          5. Content Standards and Moderation
        </h2>
        <h3 className="text-base font-bold text-text-primary mb-2">
          Zero Tolerance for Objectionable Content
        </h3>
        <p>
          Forked has zero tolerance for objectionable content including but not
          limited to: hate speech, explicit or sexual content, harassment,
          violence, illegal activity, or content that exploits minors.
        </p>
        <h3 className="text-base font-bold text-text-primary mt-4 mb-2">
          Reporting
        </h3>
        <p>
          Users can report objectionable content (such as inappropriate photos)
          through the reporting feature in the App. We review reports and take
          action as appropriate, which may include content removal, account
          warnings, or account termination.
        </p>
        <h3 className="text-base font-bold text-text-primary mt-4 mb-2">
          Our Right to Remove Content and Terminate Accounts
        </h3>
        <p>We reserve the right, but are not obligated, to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            Remove any User Content that violates these Terms or that we find
            objectionable, at our sole discretion.
          </li>
          <li>
            Suspend or permanently terminate accounts that violate these Terms.
          </li>
          <li>
            Take any action we deem necessary to protect the safety and
            integrity of the App and its users.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          6. Community Scores Disclaimer
        </h2>
        <p>
          Community leaderboard scores displayed in the App are generated
          algorithmically based on aggregated user ratings. These scores:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            Are <strong>not</strong> endorsements, recommendations, or
            guarantees by Forked.
          </li>
          <li>
            Are <strong>not</strong> professional food reviews or safety
            assessments.
          </li>
          <li>
            Reflect aggregated user sentiment and may not represent any
            individual&apos;s experience.
          </li>
          <li>May change over time as more ratings are submitted.</li>
        </ul>
        <p className="mt-2">
          You should exercise your own judgment when choosing where and what to
          eat. Forked is not responsible for the quality, safety, or accuracy of
          any restaurant or dish.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          7. Intellectual Property
        </h2>
        <p>
          The App, including its design, code, algorithms, branding, and
          non-user-generated content, is owned by Forked and protected by
          applicable intellectual property laws. You may not copy, modify, or
          distribute any part of the App without our written permission.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          8. Account Deletion
        </h2>
        <p>
          You may delete your account at any time from the Settings screen
          within the App. Upon deletion:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            Your personal information is anonymized and de-identified. An
            anonymous placeholder profile is retained for database integrity but
            contains no identifiable information.
          </li>
          <li>
            All photos you uploaded (dish photos and profile avatar) are
            permanently deleted from our servers.
          </li>
          <li>
            Your rating scores are anonymized and continue to contribute to
            community scores, as described in our Privacy Policy. All personal
            notes and photo metadata are permanently deleted.
          </li>
          <li>Your authentication account is permanently deleted.</li>
          <li>This action is irreversible.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          9. Disclaimer of Warranties
        </h2>
        <p>
          THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
          WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
          BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p className="mt-2">
          We do not warrant that the App will be uninterrupted, error-free, or
          free of harmful components, or that any content (including community
          scores) is accurate, reliable, or complete.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          10. Limitation of Liability
        </h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, FORKED AND ITS OFFICERS,
          DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
          NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR
          IN CONNECTION WITH YOUR USE OF THE APP.
        </p>
        <p className="mt-2">
          OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THESE
          TERMS OR THE APP SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE
          (12) MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          11. Indemnification
        </h2>
        <p>
          You agree to indemnify and hold harmless Forked and its officers,
          directors, employees, and agents from any claims, damages, losses, or
          expenses (including reasonable attorneys&apos; fees) arising out of
          your use of the App, your User Content, or your violation of these
          Terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          12. Governing Law and Dispute Resolution
        </h2>
        <p>
          These Terms shall be governed by the laws of the State of Louisiana,
          United States, without regard to conflict of law principles.
        </p>
        <p className="mt-2">
          Any dispute arising from these Terms or your use of the App shall
          first be attempted to be resolved through informal negotiation. If
          unresolved within 30 days, either party may pursue resolution through
          binding arbitration administered under the rules of the American
          Arbitration Association, with arbitration taking place in New Orleans,
          Louisiana.
        </p>
        <p className="mt-2">
          You agree to resolve disputes on an individual basis and waive any
          right to participate in a class action lawsuit or class-wide
          arbitration.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          13. Changes to These Terms
        </h2>
        <p>
          We may update these Terms from time to time. We will notify you of
          material changes by posting the updated Terms within the App or by
          other reasonable means. Continued use of the App after changes take
          effect constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          14. Severability
        </h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the
          remaining provisions will continue in full force and effect.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          15. Contact Us
        </h2>
        <p>
          If you have questions about these Terms, contact us at{" "}
          <a
            href="mailto:support@forkedapp.com"
            className="text-accent hover:underline"
          >
            support@forkedapp.com
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
