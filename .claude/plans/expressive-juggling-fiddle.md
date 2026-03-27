# App Store & Play Store Readiness — Complete Checklist

## Context
Forked is preparing for Apple App Store and Google Play Store submission. This is a **reference checklist** of everything missing or needed for store approval. No code changes in this task — implementation will follow separately.

**Legal URLs:**
- Privacy Policy: `https://www.forkedapp.com/privacy`
- Terms of Service: `https://www.forkedapp.com/terms`

---

## Current State Summary

| Requirement | Status |
|-------------|--------|
| Privacy Policy (hosted + in-app link) | Missing |
| Terms of Service (hosted + in-app link) | Missing |
| Account Deletion UI | Missing (RPC exists, no UI) |
| Content/Photo Reporting | Missing entirely |
| Support/Contact URL | Missing |
| App version display | Missing |
| Store listing metadata | Not yet configured |

---

## P0 — Will Cause Rejection Without These

### 1. Privacy Policy Document + In-App Link
**Apple**: Mandatory. **Google**: Mandatory.

**Document needs to cover:**
- Data collected: email, username, display name, bio, avatar, location (GPS for restaurant verification), photos of dishes, ratings/sentiments, taste tag preferences, usage analytics (Amplitude)
- Third-party services: Supabase (auth + database + storage), Google Maps (location/maps), Amplitude (analytics), Expo (push notifications if added)
- How data is used: personalized dish rankings, community leaderboards, Bayesian scoring
- Data retention: how long data is kept, what happens on account deletion (Forked anonymizes ratings for leaderboard integrity per the `anonymize_user_data` function, then deletes the account)
- User rights: account deletion (in-app), data access
- Children: if app is not intended for children under 13, state this (COPPA)
- Contact info for privacy inquiries

**In-app**: Add link in `settings.tsx` → opens `https://www.forkedapp.com/privacy` via `expo-web-browser`

### 2. Terms of Service Document + In-App Link
**Apple**: Mandatory. **Google**: Mandatory.

**Document needs to cover:**
- Acceptable use policy
- UGC ownership and license (users grant Forked license to display their photos/ratings)
- Zero tolerance for objectionable content (hate speech, explicit content, harassment)
- Right to remove content or terminate accounts for violations
- Disclaimer: community scores are algorithmic, not endorsements
- Limitation of liability
- Governing law / dispute resolution

**In-app**: Add link in `settings.tsx` → opens `https://www.forkedapp.com/terms` via `expo-web-browser`

### 3. Account Deletion (In-App)
**Apple**: Strictly mandatory. Will reject without it. **Google**: Required by policy.

**What exists:**
- `anonymize_user_data` RPC — strips PII (name, avatar, bio, push token), clears notes, **preserves ratings + comparisons** for leaderboard integrity
- `delete_user_account` RPC — hard-deletes all ratings, comparisons, and profile (too destructive, breaks community scores, and doesn't delete auth account)

**Decision:** Use `anonymize_user_data` + auth account deletion. Do NOT use `delete_user_account` (it destroys leaderboard data and doesn't actually delete the auth account).

**What's missing:**
- UI in `settings.tsx`
- Auth account deletion (neither RPC handles this)

**Implementation:**
1. **New Supabase Edge Function or updated RPC** (`delete_account_full`):
   - Calls `anonymize_user_data` internally (anonymizes profile, clears notes, preserves ratings/comparisons)
   - Deletes the Supabase auth account via `auth.admin.deleteUser(user_id)` (requires `service_role` key — must be server-side, not client-callable)
2. **UI in `settings.tsx`:**
   - "Delete Account" button (red/destructive styling)
   - First confirmation: "This will permanently delete your account and personal data. Your anonymous ratings will be preserved for community scores."
   - Second confirmation: type "DELETE" to proceed (Apple prefers friction)
   - Call the edge function / RPC
   - On success: sign out → navigate to auth screen
3. **Files involved:**
   - `supabase/functions/delete-account/index.ts` (new edge function) OR new migration updating the RPC to use `auth.admin.deleteUser`
   - `app/(protected)/(profile)/settings.tsx` — add delete button + confirmation flow
   - `hooks/` — new `useDeleteAccount` hook (or inline)

### 4. Content/Photo Reporting System
**Apple**: Mandatory for apps with UGC. Guideline 1.2 — "Apps with user-generated content must include a method for filtering objectionable material and a mechanism for users to flag offensive content."

**Why blocking is NOT needed:** Forked has no user-to-user interaction — no following, messaging, commenting, or viewable user profiles. Battles are against the user's own ratings. Photos on dish/restaurant detail pages are anonymous (no username shown). The only username exposure is the read-only battle ticker. There is no mechanism for one user to target or harass another, so blocking serves no purpose.

**What's missing:** Everything — database, RPCs, UI.

**Database changes needed (new migration):**
- `content_reports` table:
  - `id` (UUID, PK)
  - `reporter_id` (UUID, FK → auth.users)
  - `reported_rating_id` (UUID, FK → personal_ratings) — links to the rating that owns the photo
  - `reason` (enum: `inappropriate_photo`, `offensive`, `spam`, `other`)
  - `description` (text, optional)
  - `status` (enum: `pending`, `reviewed`, `dismissed`, `actioned`, default `pending`)
  - `created_at` (timestamptz)
- RLS: authenticated users can INSERT their own reports only
- RPC: `report_content(p_reported_rating_id UUID, p_reason TEXT, p_description TEXT)`

**UI needed:**
- "Report Photo" option on UGC photo surfaces:
  - `app/(protected)/(browse)/dish-detail.tsx` — on the featured dish photo
  - `app/(protected)/(browse)/restaurant-detail.tsx` — on any user-submitted photos
- Simple report flow: tap report icon → reason picker → optional description → submit → confirmation toast
- Optionally on `components/Discover/recent-battle-ticker.tsx` (low priority — only shows usernames/restaurant names, no photos)

---

## P1 — Required for Store Listing (Outside Codebase)

### 6. Apple App Store Connect
- [ ] Privacy Policy URL: `https://www.forkedapp.com/privacy`
- [ ] Support URL (website or email)
- [ ] App Privacy "Nutrition Labels" — declare all data types collected:
  - Contact Info: email
  - Location: precise location (used for restaurant verification)
  - User Content: photos, other user content (ratings)
  - Identifiers: user ID
  - Usage Data: product interaction (Amplitude)
  - Diagnostics: crash data (if applicable)
- [ ] Age Rating questionnaire (likely 4+ or 9+ depending on UGC answers)
- [ ] App category: Food & Drink
- [ ] Screenshots (6.7" and 6.1" iPhone required, iPad if supporting)
- [ ] App description, keywords, subtitle
- [ ] App icon (1024x1024 — already have `icon.png`, verify resolution)

### 7. Google Play Console
- [ ] Privacy Policy URL: `https://www.forkedapp.com/privacy`
- [ ] Data Safety section — declare:
  - Data collected: email, name, photos, location, app activity
  - Data shared: none (unless Amplitude counts)
  - Security practices: data encrypted in transit, users can request deletion
- [ ] Content rating questionnaire (IARC)
- [ ] Target audience and content: declare NOT for children
- [ ] App category: Food & Drink
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone required, tablet recommended)
- [ ] Short description (80 chars) + full description (4000 chars)
- [ ] App icon (512x512)

---

## P2 — Recommended

### 8. Support Contact in Settings
- Add "Contact Support" row in settings → opens `mailto:support@forkedapp.com` or a web form
- Both stores require a "support URL" in listing — this matches it in-app

### 9. App Version Display in Settings
- Show version from `expo-constants` (`Constants.expoConfig?.version`)
- Useful for user support conversations

### 10. `app.json` / Config Cleanup
- Verify `ios.infoPlist` permission descriptions are Apple-guideline compliant
- Current camera permission: good
- Current location permission: good
- Current photo library permission: good
- Consider adding `ios.config.usesNonExemptEncryption: false` (to skip export compliance questions if only using HTTPS)

### 11. Post-Launch Considerations
- Force update mechanism (minimum app version check)
- Rate/review prompt (after N ratings, use `expo-store-review`)
- Push notifications setup (for battle results, leaderboard changes)

---

## Implementation Order (When Ready to Build)

1. Draft Privacy Policy and Terms of Service documents
2. Account deletion UI in settings (smallest effort, highest rejection risk)
3. Legal links in settings
4. Photo/content reporting (DB migration → types → hook → UI on dish/restaurant detail pages)
5. Support contact + version in settings
6. Configure store listings
