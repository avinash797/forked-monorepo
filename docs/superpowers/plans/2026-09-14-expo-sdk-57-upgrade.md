# Expo SDK 54 → 57 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `apps/mobile` from Expo SDK 54 (~54.0.37) to SDK 57 (57.0.22), and bring the tree's shared `react`/`react-dom` version and a small set of `apps/web` dependencies up to date, without breaking navigation, gestures/animation, or builds.

**Architecture:** Upgrade one Expo SDK major at a time (54→55→56→57), verifying and committing after each hop, because each hop has its own documented breaking changes and skipping straight to 57 makes a regression impossible to bisect. `apps/web` and the shared `react` pin are handled as a separate, lower-risk task after mobile is green, since `react`/`react-dom` must stay at the exact version the final Expo SDK requires tree-wide (see root `CLAUDE.md`).

**Tech Stack:** Expo SDK, React Native, Expo Router, React Navigation (via Expo Router's fork), react-native-reanimated/worklets, npm workspaces.

**Spec:** No separate spec doc — this plan is derived directly from live research performed in this session: `npm view expo versions`, the official changelogs at expo.dev/changelog/sdk-55, sdk-56, sdk-57, and a repo grep for `@react-navigation/*` usage. Findings are inlined into each task below.

## Global Constraints

- `react` / `react-dom` must stay pinned at the exact version the Expo SDK requires, identically in `apps/mobile/package.json` and `apps/web/package.json` (root `CLAUDE.md`: "react stays pinned at the Expo SDK's exact version across the whole tree").
- Never edit `packages/theme/theme.css` by hand; never add a migration under `apps/*`; N/A for this plan but stated per root `CLAUDE.md`.
- Root `package-lock.json` is the only lockfile — always run `npm install` from repo root, never inside `apps/mobile`.
- Do one Expo SDK major per task; run `npx expo install --fix` after each `expo` version bump so all `expo-*` packages resolve to the versions that SDK expects.
- After every hop: `npm run typecheck -w forked`, `npm run lint -w forked`, and `npx expo-doctor` (from `apps/mobile`) must be clean before moving to the next hop.
- Do not touch `apps/web`'s TypeScript (`^5`) or ESLint (`^9`) majors in this plan — see the "Explicitly deferred" note at the end. This plan only aligns `react`/`react-dom` and does safe patch/minor bumps.

---

### Task 1: Isolate the work and capture a baseline

**Files:** none changed — verification only.

**Interfaces:** N/A.

- [ ] **Step 1: Check for unrelated in-flight work on the current branch**

The working tree is currently on `feat/supabase-prod-bootstrap` with unrelated uncommitted changes (`apps/web/PLAN.md` deleted, `package-lock.json` modified) plus an in-progress Expo patch bump already staged in `apps/mobile/package.json` (`expo` `~54.0.33` → `~54.0.37`, `expo-constants` `~18.0.13` → `~18.0.14`). Do not discard these. Stash them so the upgrade starts from a clean, comparable base:

```bash
git status
git stash push -u -m "wip: unrelated supabase-prod-bootstrap changes"
```

- [ ] **Step 2: Create a dedicated branch (in a worktree if you want the current branch left untouched)**

```bash
git worktree add ../forked-monorepo-expo-upgrade -b chore/expo-sdk-57-upgrade
cd ../forked-monorepo-expo-upgrade
npm install
```

- [ ] **Step 3: Record the pre-upgrade baseline**

```bash
npm run typecheck -w forked
npm run lint -w forked
npx expo-doctor
```

Expected: all three pass (or fail with the *same* pre-existing issues you note here) before any dependency change — this is the baseline you diff every later step against.

- [ ] **Step 4: Commit nothing yet — baseline is a checkpoint, not a commit.** Proceed to Task 2.

---

### Task 2: Upgrade Expo SDK 54 → 55 (New Architecture becomes mandatory)

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `package-lock.json` (root)

**Interfaces:** N/A (dependency bump only).

**What breaks in this hop** (from `expo.dev/changelog/sdk-55`):
- SDK 54 / React Native 0.81 was the last release that still tolerated the Old Architecture. SDK 55 requires the New Architecture. This repo's `app.json` has no `newArchEnabled` override, so it's already running on RN's New-Architecture-by-default — verify this rather than assume it (Step 2).
- Expo UI (SwiftUI) API renames (`DateTimePicker`→`DatePicker`, `Switch`→`Toggle`, etc.) — only relevant if `expo-ui` is used. It is not currently a dependency, so skip.
- `expo-blur`'s new blur method wants a `BlurTargetView` wrapper; the old API keeps working for previously-supported platforms, so this is non-breaking for this app unless we opt in later.
- As of SDK 55 all `expo-*` packages align to the SDK's major version number.

- [ ] **Step 1: Bump `expo` and let the CLI fix the rest**

```bash
cd apps/mobile
npx expo install expo@^55.0.11
npx expo install --fix
cd ../..
npm install
```

- [ ] **Step 2: Confirm New Architecture is actually active**

```bash
cd apps/mobile
grep -n "newArchEnabled" app.json android/gradle.properties 2>/dev/null
```

If this app has never been prebuilt (no `android`/`ios` dirs checked in — confirm with `ls apps/mobile`), there's nothing to check natively; New Architecture is the CNG (Continuous Native Generation) default for RN 0.81+ and needs no config. If native dirs exist and show `newArchEnabled=false`, flip it to `true` in `app.json` (`expo.android.newArchEnabled` / `expo.ios.newArchEnabled` — or the top-level `newArchEnabled` key depending on SDK docs at upgrade time) before continuing.

- [ ] **Step 3: Verify**

```bash
npm run typecheck -w forked
npm run lint -w forked
npx expo-doctor
```

Expected: clean, matching Task 1's baseline (no new errors).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json package-lock.json
git commit -m "chore(mobile): upgrade Expo SDK 54 -> 55"
```

---

### Task 3: Upgrade Expo SDK 55 → 56 (React Navigation import breakage, iOS 16.4/Xcode 26.4)

**Files:**
- Modify: `apps/mobile/package.json`, `package-lock.json`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/(protected)/(profile)/_layout.tsx`
- Modify: `apps/mobile/app/(protected)/(profile)/edit.tsx`
- Modify: `apps/mobile/app/(protected)/(rating)/_layout.tsx`
- Modify: `apps/mobile/components/center-tab-button.tsx`
- Modify: `apps/mobile/components/haptic-tab.tsx`

**Interfaces:** N/A — same call sites, different import source (`expo-router` instead of `@react-navigation/*`).

**What breaks in this hop** (from `expo.dev/changelog/sdk-56`, confirmed against this repo's own code):
- Expo Router forked React Navigation and no longer re-exports it transparently; direct `@react-navigation/*` imports inside an Expo Router project stop working. This repo imports directly from `@react-navigation/native`, `@react-navigation/elements`, and `@react-navigation/bottom-tabs` in exactly the 6 files listed above (confirmed via `grep -rn "@react-navigation" apps/mobile/app apps/mobile/components`).
- iOS/tvOS deployment target bumps to 16.4 (from 15.1), macOS to 13.4; Xcode 26.4 minimum. Drops iPhone 7/7+, 6s/6s+, SE (1st gen), iPad mini 4, iPad Air 2.
- Known Hermes v1 memory regression for apps using `react-native-worklets` / `react-native-reanimated` (this app uses both, in 23 files) — **do not chase this on SDK 56**; it's resolved in SDK 57, which Task 4 lands next. Don't spend time debugging memory behavior at this checkpoint.
- `@expo/vector-icons` is no longer auto-included; this repo already lists it as an explicit dependency (`@expo/vector-icons: ^15.0.3`), so `npx expo install --fix` in Step 1 simply bumps it — no codemod needed here.

- [ ] **Step 1: Bump `expo` and fix dependencies**

```bash
cd apps/mobile
npx expo install expo@^56.0.21
npx expo install --fix
cd ../..
npm install
```

- [ ] **Step 2: Run Expo's codemod for the React Navigation import fork**

```bash
cd apps/mobile
npx expo-codemod sdk-56-expo-router-react-navigation-replace .
```

- [ ] **Step 3: Manually verify each of the 6 affected files was rewritten correctly**

Check that these imports now come from `expo-router` (or its documented replacement path) instead of `@react-navigation/*`:

```bash
grep -rn "@react-navigation" apps/mobile/app apps/mobile/components
```

Expected: no matches. If the codemod left any of these untouched, fix them by hand, matching what the codemod did to the others — the four symbols in play are `ThemeProvider as NavigationThemeProvider` / `Theme as NavigationTheme` (`app/_layout.tsx`), `HeaderBackButton` (`app/(protected)/(profile)/_layout.tsx`, `app/(protected)/(rating)/_layout.tsx`), `useNavigation` (`app/(protected)/(profile)/edit.tsx`), and `BottomTabBarButtonProps` / `PlatformPressable` (`components/center-tab-button.tsx`, `components/haptic-tab.tsx`).

- [ ] **Step 4: Bump the native platform floor if the project has checked-in native projects**

```bash
ls apps/mobile/ios apps/mobile/android 2>/dev/null
```

If either exists (i.e. this isn't pure CNG/managed workflow), update the iOS deployment target references (Podfile / project settings) to 16.4 and confirm the CI/EAS build image uses Xcode ≥ 26.4 in `apps/mobile/eas.json` or `.github/workflows/*`. If there are no checked-in native dirs, `expo prebuild` will regenerate them at the new floor automatically and there's nothing to edit by hand.

- [ ] **Step 5: Verify**

```bash
npm run typecheck -w forked
npm run lint -w forked
npx expo-doctor
```

Expected: clean. Also manually smoke-test (see Task 5) the screens touched by Step 3 before committing, since these are behavioral navigation changes, not just version bumps.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/package.json package-lock.json \
  "apps/mobile/app/_layout.tsx" \
  "apps/mobile/app/(protected)/(profile)/_layout.tsx" \
  "apps/mobile/app/(protected)/(profile)/edit.tsx" \
  "apps/mobile/app/(protected)/(rating)/_layout.tsx" \
  apps/mobile/components/center-tab-button.tsx \
  apps/mobile/components/haptic-tab.tsx
git commit -m "chore(mobile): upgrade Expo SDK 55 -> 56, migrate off direct @react-navigation imports"
```

---

### Task 4: Upgrade Expo SDK 56 → 57 (resolves the Hermes v1 regression from Task 3)

**Files:**
- Modify: `apps/mobile/package.json`, `package-lock.json`

**Interfaces:** N/A.

**What this hop does** (from `expo.dev/changelog/sdk-57` and the SDK 56 changelog's own forward-reference): React Native 0.85 → 0.86, React stays at 19.2 (no react bump inside this hop — it moved in Task 3's 0.85 dependency, not here). RN's own release notes describe 0.86 as intentionally non-breaking from 0.85, despite touching ~1,500 files. This hop's main value is that it fixes the worklets/reanimated Hermes v1 memory regression called out in Task 3.

- [ ] **Step 1: Bump `expo` and fix dependencies**

```bash
cd apps/mobile
npx expo install expo@^57.0.22
npx expo install --fix
cd ../..
npm install
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck -w forked
npm run lint -w forked
npx expo-doctor
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json package-lock.json
git commit -m "chore(mobile): upgrade Expo SDK 56 -> 57"
```

---

### Task 5: Full manual verification pass

**Files:** none changed.

**Interfaces:** N/A.

- [ ] **Step 1: Build and run on both platforms**

```bash
cd apps/mobile
npx expo start --clear
```

Open on iOS and Android (simulator or device). This app is on CNG (no committed `ios`/`android` dirs per Task 3 Step 4's expected finding), so a fresh `npx expo prebuild --clean` may be required before a native build if you need `expo run:ios` / `expo run:android` rather than Expo Go / dev client.

- [ ] **Step 2: Smoke-test every screen touched by the Task 3 codemod**

- App boot / root `_layout.tsx` theme provider (light + dark mode) — confirms `NavigationThemeProvider` still wires up.
- Profile tab group header back button (`(protected)/(profile)/_layout.tsx`) — tap it, confirm it navigates back.
- Profile edit screen (`(protected)/(profile)/edit.tsx`) — confirm `useNavigation()`-driven behavior (whatever it triggers, e.g. header customization) still works.
- Rating flow header back button (`(protected)/(rating)/_layout.tsx`).
- Bottom tab bar center button and haptic tab press (`center-tab-button.tsx`, `haptic-tab.tsx`) — confirm haptics fire and the pressable still renders/responds.

- [ ] **Step 3: Watch memory on a real device for a few minutes**

Since Task 3 knowingly passed through the Hermes v1 regression window and Task 4 claims to fix it, do a quick sanity check (Xcode Instruments / Android Profiler) that memory looks normal on SDK 57, not just "typecheck passes."

- [ ] **Step 4: If everything checks out, this is a natural point to open the PR for the mobile half of the upgrade**, independent of Task 6.

---

### Task 6: Align `apps/web` and the shared `react` pin

**Files:**
- Modify: `apps/mobile/package.json` (react/react-dom — should already be correct from Task 3/4's `expo install --fix`, verify only)
- Modify: `apps/web/package.json`
- Modify: `package-lock.json`

**Interfaces:** N/A.

**Why this is separate:** root `CLAUDE.md` requires `react` to be pinned at the exact Expo-SDK-mandated version across the whole tree. SDK 57 (via RN 0.86) requires `react@^19.2.3`, up from the tree's current `19.1.0`. This is the one change in this task that's coupled to the mobile upgrade; everything else here is an independent, low-risk pass over `apps/web`'s other libraries, done because the user also asked about "other libraries," not because SDK 57 requires it.

- [ ] **Step 1: Confirm the exact react/react-dom version Task 4 landed**

```bash
grep '"react"' apps/mobile/package.json
```

- [ ] **Step 2: Set the identical version in `apps/web/package.json`**

Edit `apps/web/package.json`'s `dependencies.react` and `dependencies.react-dom` to match exactly (not `^`-ranged — same convention the mobile app already uses for these two packages), and `devDependencies["@types/react"]` / `["@types/react-dom"]` to the matching `^19.2.x` types range.

- [ ] **Step 3: Low-risk minor/patch bumps on `apps/web` (same major, no known breaking changes per npm registry check in this session)**

```bash
cd apps/web
npm view next version        # 16.3.5 vs current 16.1.6 — patch/minor, safe
npm view zod version         # 4.6.5 vs current ^4.2.1 — same major
npm view @tanstack/react-query version   # 5.102.8 vs current ^5.90.21 — same major
npm view @supabase/supabase-js version   # 2.116.0 vs current ^2.95.3 — same major
npm view tailwindcss version # 4.3.3 vs current ^4 — same major
cd ../..
npm install next@16.3.5 -w forked-web
npm install zod@4.6.5 -w forked
npm install @tanstack/react-query@5.102.8 -w forked-web
npm install @supabase/supabase-js@2.116.0 -w forked-web -w forked
npm install tailwindcss@4.3.3 -w forked-web
```

(Adjust the exact target versions to whatever `npm view <pkg> version` reports at execution time — the numbers above are what this session observed on 2026-09-14.)

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run lint
npm run build
```

Run from repo root so Turborepo covers every workspace.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json package-lock.json
git commit -m "chore: pin react to Expo SDK 57's version tree-wide, bump low-risk web deps"
```

---

## Explicitly deferred (not part of this plan)

- **TypeScript**: registry shows `7.0.2` available; both apps are on `~5.9.2` / `^5`. TypeScript 7 is a from-scratch compiler rewrite (the "tsgo" native port), not a routine major — treat it as its own project with its own plan, not a line item here.
- **ESLint**: registry shows `10.10.0`; both apps are on `^9`. ESLint 9→10 is a major with its own flat-config and rule changes across `eslint-config-expo` / `eslint-config-next` — same reasoning, own plan.
- Do not bundle either into this upgrade; they're unrelated majors that would make a failed verification impossible to attribute to "the Expo upgrade" vs. "the lint/type-tooling upgrade."

---

## Self-Review

**Spec coverage:** Every breaking change surfaced during research (New Architecture requirement, React Navigation import fork + the 6 concrete files, iOS/Xcode floor, Hermes v1 regression, react version bump, vector-icons dependency change) has a task. The user's "other libraries" ask is covered by Task 6's web pass, scoped to same-major bumps only, with TS7/ESLint10 explicitly named and deferred rather than silently dropped.

**Placeholder scan:** No TBD/"add error handling"/"similar to Task N" placeholders — Task 3's codemod step names the exact 6 files and exact symbols; Task 6 names exact packages and states where to re-check exact versions at execution time (npm registry state changes daily, so a hardcoded version there would go stale — the command to re-check is given, which is not the same as a placeholder).

**Type consistency:** N/A — no new functions/interfaces introduced; this plan is dependency and import-path changes only, verified via `typecheck`/`lint`/`expo-doctor` at every step rather than fabricated unit tests, since there is no new logic to unit-test.
