# Forked — Beta Release Runbook (TestFlight + Play Internal Testing)

Last verified against both consoles: 2026-09-17.

Target: get `1.0.0` builds onto **TestFlight** and the **Play internal testing** track.
Builds run on **EAS Build** (cloud), submission via **EAS Submit**. Nothing here needs a local
Xcode or Gradle release toolchain.

---

## 0. Current state (verified in the consoles)

### Apple

| Thing | Value |
|---|---|
| Team ID | `29W7Q494G9` |
| App | Forked: The food ranking app |
| Apple ID (`ascAppId`) | `6761374977` |
| Bundle ID | `com.forked.prod` |
| App Store version record | `1.0` — *Prepare for Submission* |
| Last TestFlight build | `0.1.0 (2)` — uploaded Mar 30 2026, now **Expired** |
| Internal TestFlight group | `Team (Expo)` exists |
| Age rating | Done (9+, regional exceptions) |
| Export compliance | Declared in `Info.plist` (`ITSAppUsesNonExemptEncryption: false`) |
| App Privacy questionnaire | **Not started** |
| Privacy Policy URL | **Empty in ASC** (page is live at `forkedapp.com/privacy`) |
| App Store Connect API access | **Not requested yet** |
| DSA trader status | **Not set up** (blocks EU distribution, not TestFlight) |

### Google

| Thing | Value |
|---|---|
| Developer account | `forkedapp` (`7036555841016912739`) |
| App | Forked (`4976455520028609257`) |
| Package | `com.forked.prod` |
| App status | Draft, internal testing active |
| Last internal release | `4 (0.1.0)` — Mar 30 2026, 1 version code, not reviewed |
| Play App Signing | **Enrolled**, app signing key in use |
| Upload key SHA-1 | `F9:F9:3C:27:BF:41:D1:C4:40:C4:A0:9E:1B:1A:4C:5D:7E:75:C8:CA` |
| Service account for API submission | **Not created yet** |

**Consequence of the two "last release" rows:** the next builds must exceed
`buildNumber 2` (iOS) and `versionCode 4` (Android). Because `appVersionSource` is `remote`,
EAS keeps those counters server-side — they have to be seeded once (step 4).

**Consequence of Play App Signing being enrolled:** every future AAB must be signed with the
*same upload key* that produced version code 4. If those March builds came from EAS, EAS already
holds that keystore and nothing needs doing — verify in step 5. If it doesn't match, the upload
is rejected and the key has to be reset in Play Console.

---

## 1. Repo changes already applied

- `app.config.ts`: `version` `0.1.0` → **`1.0.0`**
- `app.config.ts`: `ios.appStoreUrl` corrected — it pointed at `id6740587828`, which is not this
  app. Now `id6761374977`.
- `app.config.ts`: removed `ios.buildNumber` and `android.versionCode`. With
  `appVersionSource: "remote"` these are ignored by EAS and only create confusion about which
  number is real.
- `app.config.ts`: added a guard that **fails a production EAS build** if any required
  `EXPO_PUBLIC_*` value is missing. Without it, a missing
  `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` silently ships the placeholder
  `com.googleusercontent.apps.REPLACE_WITH_REVERSED_IOS_CLIENT_ID` and Google Sign-In is dead
  on the beta build.
- `eas.json`: rewritten — `development` / `preview` / `production` build profiles, plus a
  `production` submit profile wired to the real `ascAppId` and Team ID.

### Web (`apps/web`) — supporting store requirements

- `(marketing)/privacy/page.tsx`: added disclosure of **Google / Apple sign-in data** (the app ships
  `@react-native-google-signin` and `expo-apple-authentication`, which the policy did not mention),
  added both providers to the third-party services table, and linked the deletion page.
- `(marketing)/delete-account/page.tsx`: **new**. Google Play requires a publicly reachable web page
  where users can request account and data deletion; the in-app path alone is not sufficient. The
  copy mirrors what deletion actually does — photos and personal fields purged, ratings anonymized.

Note: `apps/mobile/docs/privacy-policy.md`, `apps/web/docs/privacy-policy.md` and
`forked-marketing/privacy-policy.md` are stale duplicates of the live page. The `.tsx` route is the
source of truth; those markdown copies were left alone.

`ios/` and `android/` are gitignored, so EAS runs `prebuild` in the cloud and manages signing.
The `signingConfigs.release = debug` block in the local `android/app/build.gradle` is
prebuild-generated scaffolding and never reaches a store build.

---

## 2. Prerequisites

```bash
npm install -g eas-cli
eas login            # account: avinashj1
cd apps/mobile
eas whoami
```

The EAS project is already linked: `49ad787b-e696-44f7-8f59-476e0297aefa`.

---

## 3. Environment variables

The production build profile reads EAS-hosted environment variables
(`"environment": "production"` in `eas.json`), not `.env.production`. Seed them once — values are
in `apps/mobile/.env.production`:

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL          --value '...' --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY     --value '...' --visibility sensitive
eas env:create --environment production --name EXPO_PUBLIC_AMPLITUDE_API_KEY     --value '...' --visibility sensitive
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY   --value '...' --visibility sensitive
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  --value '...' --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID  --value '...' --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME --value '...' --visibility plaintext
```

Confirm the Supabase URL points at **Forked-prod** (`wiuuouqkpfwpyudayagc`), not dev.

```bash
eas env:list --environment production
```

---

## 4. Seed the remote version counters

Do this **before** the first build, or EAS starts at 1 and both stores reject the upload as a
duplicate/lower version.

```bash
eas build:version:set --platform ios       # enter 2   → next build is 3
eas build:version:set --platform android   # enter 4   → next build is 5
```

---

## 5. Credentials

### Android — verify the upload key matches

```bash
eas credentials --platform android
# → production → Keystore → view the SHA-1 fingerprint
```

It must equal `F9:F9:3C:27:BF:41:D1:C4:40:C4:A0:9E:1B:1A:4C:5D:7E:75:C8:CA`.

- **Matches** → nothing to do.
- **No keystore in EAS, but you have the original `.jks`** → `eas credentials` → *Set up a new
  keystore* → upload the existing one.
- **Keystore is lost** → Play Console → *Test and release → App integrity → App signing →
  Upload key certificate → Request upload key reset*. Google takes ~48h. Let EAS generate a new
  keystore, export its PEM, and register that.

### iOS — distribution cert and provisioning profile

```bash
eas credentials --platform ios
```

Let EAS generate/reuse the Apple Distribution certificate and the App Store provisioning profile
for `com.forked.prod`. This signs you in with your Apple ID interactively — no API key needed for
*building*.

---

## 6. Submission credentials

### Apple — App Store Connect API key

The `.p8` in `forked-secrets/AuthKey_WUM3M3MQW4.p8` is a **Sign in with Apple** key
(`aud: appleid.apple.com`). It cannot be used for App Store Connect API calls. A separate key is
needed:

1. App Store Connect → **Users and Access → Integrations → App Store Connect API**.
2. The page currently shows **"Permission is required… Request Access"** — click it (Account
   Holder only; grant is immediate).
3. **Generate API Key**, role **App Manager**.
4. Download the `.p8` (one-time download) and note the **Key ID** and **Issuer ID**.
5. Store it beside the other secrets, e.g. `forked-secrets/AuthKey_<KEYID>.p8`, and keep it out
   of git.

`eas submit` will prompt for it the first time and then store it on EAS.

> Alternative if you'd rather not create a key: `eas submit -p ios` also accepts an Apple ID plus
> an app-specific password. The API key is more durable and doesn't break on 2FA prompts.

### Google — Play service account

1. Play Console → **Setup → API access**.
2. Link (or create) a Google Cloud project.
3. **Create new service account** → opens Google Cloud IAM → *Create service account* →
   name e.g. `forked-eas-submit` → Done.
4. Back in Google Cloud: service account → **Keys → Add key → Create new key → JSON** → download.
5. Back in Play Console → **API access** → the account appears → **Grant access** →
   *App permissions*: add **Forked** only → *Account permissions*: enable **Release apps to
   testing tracks** (and *View app information*). Invite user.
6. Save the JSON as:

   ```
   forked-secrets/play-service-account.json
   ```

   `eas.json` already points at `../../../forked-secrets/play-service-account.json` relative to
   `apps/mobile`. That path resolves to the `forked-secrets` folder next to `forked-monorepo`.

Version code 4 already exists on the internal track, so Play's "first upload must be manual"
requirement is **already satisfied** — API submission will work immediately.

---

## 7. Build

```bash
cd apps/mobile
eas build --platform all --profile production
```

Produces an App Store-signed `.ipa` (build 3) and an `.aab` (version code 5). Expect ~15–30 min
per platform.

Watch for the config guard from step 1 — if a required env var is missing the build fails fast in
the "Read app config" phase with the list of missing names.

---

## 8. Submit

```bash
eas submit --platform ios     --profile production --latest
eas submit --platform android --profile production --latest
```

- **iOS** → uploads to App Store Connect. The build appears in TestFlight after Apple finishes
  processing (10–60 min), then needs export-compliance confirmation (already answered via
  `Info.plist`, so it should auto-clear).
- **Android** → lands on the **internal testing** track as a **draft** release
  (`releaseStatus: "draft"` in `eas.json`). Open Play Console → *Internal testing* → **Review
  release → Start rollout** to make it live for testers. Change `releaseStatus` to `"completed"`
  later if you want rollout to be automatic.

---

## 9. Wire up testers

### TestFlight — internal (fastest path, no review)

1. App Store Connect → **TestFlight → Internal Testing**.
2. The `Team (Expo)` group already exists. Add up to 100 testers — they must be Users in
   *Users and Access* first.
3. Enable the new build for the group. Available immediately, no Beta App Review.

### TestFlight — external (public beta, needs review)

Requires, at minimum:

- **Test Information**: beta app description, feedback email, **privacy policy URL** (see
  blockers), and a demo account — the app gates content behind auth, so reviewers need working
  credentials.
- Submit for **Beta App Review** (typically 24–48h).
- Up to 10,000 testers via public link.

### Play internal testing

1. Play Console → **Test and release → Testing → Internal testing → Testers**.
2. Create an email list (up to 100 addresses) and save.
3. Copy the **join link** and send it to testers — they must accept before the app is installable.

Internal testing does not require the store listing to be complete, but the app stays **Draft**
until you finish the Dashboard tasks.

---

## 10. Blockers to clear before the beta is actually usable

| # | Blocker | Blocks | Notes |
|---|---|---|---|
| 1 | **Privacy policy URL not entered in either console** | External TestFlight, Play listing, App Store submission | The policy is live at `https://forkedapp.com/privacy` (route: `apps/web/src/app/(marketing)/privacy`). Paste that URL into ASC → App Privacy → Privacy Policy, and into the Play store listing. Terms are live at `/terms`. |
| 1b | **Account-deletion URL must be deployed** | Play Data safety | Google requires apps with account creation to publish a web deletion-request page — the in-app path alone is not enough. Added at `apps/web/src/app/(marketing)/delete-account`; deploy, then enter `https://forkedapp.com/delete-account` in Play → Data safety → Data deletion. |
| 2 | **App Privacy questionnaire not started** (ASC) | External TestFlight, App Store submission | Declare: photos, location, email/account data, and Amplitude analytics identifiers. |
| 3 | **ASC API access not requested** | `eas submit -p ios` | Step 6. One click. |
| 4 | **Play service account not created** | `eas submit -p android` | Step 6. |
| 5 | **Demo/test account for reviewers** | Beta App Review, Play review | App requires sign-in. Create a stable account and record the credentials in App Review Information / Play *App access*. |
| 6 | **Play Data safety form** | Play production, and prompts on the Draft dashboard | Mirror of #2 for Google. |
| 7 | **Version string mismatch** | App Store submission only | ASC's version record is `1.0`; the app now builds `1.0.0`. Fine for TestFlight; before App Store submission make them identical (edit the record to `1.0.0`, or set `version: '1.0'` in `app.config.ts`). |
| 8 | **DSA trader status not set up** | EU distribution | ASC → App Information → Digital Services Act → Set Up. |
| 9 | **Store assets** | Both listings | iOS: 6.9" + 6.5" screenshots. Play: phone screenshots, 512×512 icon, 1024×500 feature graphic. |

Non-blocking but worth knowing: the icon PNGs are all 1024×1024 RGBA. Expo flattens the primary
iOS icon during prebuild, but if Apple returns **ITMS-90717 ("alpha channel")**, flatten
`assets/ios-light.png` onto an opaque background and rebuild.

---

## 11. Quick reference

```bash
cd apps/mobile

eas build:list --limit 5                                  # recent builds
eas build --platform all --profile production             # cut a beta build
eas submit --platform ios --profile production --latest   # → TestFlight
eas submit --platform android --profile production --latest  # → Play internal (draft)
eas credentials --platform android                        # keystore fingerprint
eas env:list --environment production                     # build-time env
```
