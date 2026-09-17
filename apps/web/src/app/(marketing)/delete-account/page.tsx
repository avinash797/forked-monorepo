import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Delete Your Account — Forked",
  description:
    "How to delete your Forked account and the data associated with it, in the app or by request.",
});

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout title="Delete Your Account" effectiveDate="March 18, 2026">
      <p>
        You can delete your Forked account and its associated data at any time.
        There are two ways to do it.
      </p>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          Option 1: In the app (immediate)
        </h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open Forked and go to the Profile tab.</li>
          <li>
            Open <strong>Settings</strong> (the gear icon), then tap{" "}
            <strong>Account Settings</strong>.
          </li>
          <li>
            Tap <strong>Delete Account</strong> and confirm.
          </li>
        </ol>
        <p className="mt-3">
          Deletion runs immediately and cannot be undone.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          Option 2: By request
        </h2>
        <p>
          If you no longer have the app installed, or you can&apos;t sign in,
          email{" "}
          <a
            href="mailto:privacy@forkedapp.com?subject=Account%20Deletion%20Request"
            className="text-accent underline underline-offset-2"
          >
            privacy@forkedapp.com
          </a>{" "}
          from the address on your account with the subject{" "}
          <strong>Account Deletion Request</strong>. We verify ownership of the
          address before acting on the request and complete verified requests
          within 30 days.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          What gets deleted
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Your authentication account, including any Google or Apple sign-in
            link.
          </li>
          <li>
            Every photo you uploaded — dish photos and your profile avatar — is
            permanently removed from our storage.
          </li>
          <li>
            Photo metadata, including EXIF location and timestamps.
          </li>
          <li>
            Your personal details: name, email, username, bio, avatar, and push
            notification token.
          </li>
          <li>The personal notes attached to any of your ratings.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">
          What is kept, and why
        </h2>
        <p>
          Your individual dish ratings are <strong>anonymized</strong> rather
          than removed. Only the numeric score and sentiment survive, detached
          from your identity — no name, photo, or note remains, and neither you
          nor we can trace an anonymized rating back to you.
        </p>
        <p>
          We keep them because community leaderboard scores are built from the
          comparisons every rater contributed. Removing them outright would
          distort the rankings other people rely on. Your profile row is
          retained only as an anonymous placeholder so those scores stay
          intact; it holds no identifying information.
        </p>
        <p>
          Anonymized analytics events may be retained indefinitely, as they
          cannot be linked back to an individual user.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">Questions</h2>
        <p>
          For anything about deletion or your data, contact{" "}
          <a
            href="mailto:privacy@forkedapp.com"
            className="text-accent underline underline-offset-2"
          >
            privacy@forkedapp.com
          </a>
          . Our full{" "}
          <a
            href="/privacy"
            className="text-accent underline underline-offset-2"
          >
            Privacy Policy
          </a>{" "}
          explains what we collect and how it is used.
        </p>
      </section>
    </LegalPageLayout>
  );
}
