/**
 * Waitlist mode flag — driven by NEXT_PUBLIC_WAITLIST_MODE env variable.
 *
 * When true, the marketing site hides app-download CTAs, leaderboards,
 * and blog links, replacing them with an email-capture waitlist form.
 */
export const IS_WAITLIST_MODE =
  process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";
