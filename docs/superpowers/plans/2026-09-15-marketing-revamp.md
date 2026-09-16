# Marketing Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `apps/web`'s marketing landing page (and the old multi-route `(marketing)` group) with the new single-page design from `forked-marketing-v2`, using `@forked/theme` tokens, wired to real backend data/actions, with sitemap/robots updated accordingly.

**Architecture:** `forked-marketing-v2` (a standalone Vite/React AI-Studio prototype) is ported component-by-component into `apps/web`'s existing Next.js App Router structure. Every hardcoded hex color in a section that responds to the site's light/dark toggle is rewritten to the matching `@forked/theme` Tailwind token class; sections that are permanently dark (matching the app's existing documented exception for Navbar/Footer/CTA-style sections) keep their literal v2 hex values unchanged. Fake local-state forms are rewired to the real `joinWaitlist` server action and the real `IS_WAITLIST_MODE` flag; the mock leaderboard section becomes a real Supabase-backed server component with the v2 mock data as its waitlist-mode/failure fallback. `/blog`, `/privacy`, `/terms` survive as standalone routes; `/about` and `/how-it-works` are deleted along with the rest of the old landing page.

**Tech Stack:** Next.js 16 (App Router, TypeScript strict), Tailwind CSS v4 with `@forked/theme` CSS-var tokens, `@supabase/ssr`, `lucide-react`, `framer-motion` — no new dependencies.

**Spec:** No separate spec file was written (skipped by explicit user request during brainstorming). The full agreed design is captured in this plan's Global Constraints and per-task instructions below; there is no other document to cross-reference.

## Global Constraints

- Scope is `apps/web` marketing surface only. Do not touch `apps/web/src/app/admin/**` or `apps/web/src/app/leaderboard/**` beyond what's explicitly listed.
- Never hand-edit `packages/theme/theme.css` or `packages/theme/src/palettes.ts` — no theme package changes in this project at all.
- No new npm dependencies. Do not add `@google/genai`, `express`, `dotenv`, `tsx`, `esbuild`, `@vitejs/plugin-react`, `vite`, `@tailwindcss/vite`, or the `motion` package (unused in v2's own source — `framer-motion` already covers this app's needs).
- No new env vars. `NEXT_PUBLIC_WAITLIST_MODE` (read via `IS_WAITLIST_MODE` from `@/lib/waitlist`) already supersedes v2's `VITE_PUBLIC_WAITLIST_MODE`. Do not carry over `GEMINI_API_KEY` or `APP_URL` from v2's `.env` — both are unused AI-Studio scaffolding.
- Fonts stay Inter (`--font-body`) + Bodoni Moda (`--font-display`), set in `apps/web/src/app/layout.tsx`. Do not add Bricolage Grotesque, Plus Jakarta Sans, or JetBrains Mono.
- All ported components drop `import React from 'react'` and use `export function ComponentName(...)` declarations, not `React.FC` arrow consts — matches this app's existing component style (see `src/components/layout/navbar.tsx`, `src/components/layout/footer.tsx`).
- **Token mapping (light/theme-toggle-responsive sections only)** — apply exactly this substitution wherever a v2 hex/class appears in a section that is *not* one of the permanently-dark exceptions below:
  | v2 literal | Token replacement |
  |---|---|
  | `#FBF9F5` (paper bg) | `bg-bg` |
  | `bg-white` / card surfaces | `bg-surface` |
  | `#F3EFEA`, `#F8F6F2`, `#FAF8F5` (muted card bg) | `bg-surface-2` |
  | `#121212` as a dark pill/badge/logo-box *on a light section* | `bg-text-primary` with `text-bg` for its foreground text |
  | `#E13B22` (flame) as text/bg/border | `text-accent` / `bg-accent` / `border-accent` |
  | `#C02A14` (flame hover) | drop; use `hover:brightness-110` on the `bg-accent` element |
  | `#E13B22/NN` opacity variants | `bg-accent/NN`, `border-accent/NN`, etc. |
  | `#121212` as text | `text-text-primary` |
  | `#525252`, `#404040` (secondary gray text) | `text-text-secondary` |
  | `#737373`, `#A3A3A3` (tertiary gray text) | `text-text-tertiary` |
  | `#E6E1D8`, `#E0D9CF`, `#DDD6CC` (hairline borders) | `border-border` |
  | `emerald-500` / `emerald-400` (success dot/text) | `bg-success` / `text-success` |
  | `amber-400` (warning) | `text-warning` |
  | `red-400` (danger) | `text-danger` |
  | `zinc-100` bg / `zinc-500` text (mini inactive badge) | `bg-surface-2` / `text-text-tertiary` |
- **Permanently-dark exception sections** (matches the app's existing documented convention that Navbar/Footer/CTA-style sections may hardcode dark hex) — keep every v2 literal hex/opacity value in these **unchanged**, do not token-convert them: the `Header` marquee strip, the entire `Footer`, the entire `TheEnemy` section, the entire `AntiSlopComparison` section, the dark "Origin Catalyst" callout box inside `SubredditReceipts` (the rest of that section is light and *is* token-converted), the entire `CtaSection`, the entire `EarlyAccessModal`, and `Hero`'s phone-mockup illustration (everything inside the "Right Column: High-Fidelity Mobile App Showcase" — it's a fixed simulated screenshot, not theme-responsive chrome).
- Internal in-page anchor links (`#the-enemy`, `#how-it-works`, `#leaderboards`, `#compare`, `#faq`) must be written as `/#anchor` (leading slash) everywhere they appear **outside** `src/app/page.tsx` itself (i.e. in `Navbar` and `Footer`, which render on `/blog`, `/privacy`, `/terms`, and `/leaderboard/**` too) — a bare `#anchor` only works when already on `/`. Within `page.tsx`'s own sections linking to each other, a bare `#anchor` is fine.
- There is no test runner configured in `apps/web` (no jest/vitest, no `test` script). Each task's verification step is `npm run typecheck -w forked-web`, `npm run lint -w forked-web`, and (final task only) `npm run build -w forked-web`, run from the repo root — this is the existing verification pattern for this app, per `apps/web/CLAUDE.md`'s "every commit must leave the project in a buildable state" rule.
- Follow `apps/web/CLAUDE.md`'s git workflow: one commit per task, imperative commit messages. Since there's no P-phase assigned to this work, use plain imperative messages (e.g. `web: add marketing mock data`) rather than a `P<N>:` prefix.

---

### Task 1: Marketing mock data module

**Files:**
- Create: `apps/web/src/data/marketing-mock.ts`

**Interfaces:**
- Produces: `DishItem`, `ComparisonRow`, `SubredditThread` types; `DISHES_BY_CITY: Record<string, DishItem[]>`, `COMPARISON_DATA: ComparisonRow[]`, `SUBREDDIT_RECEIPTS: SubredditThread[]`, `FAQS: { q: string; a: string }[]` constants — consumed by Tasks 6, 7, 8, 9.

- [ ] **Step 1: Create the data file**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/types.ts` and `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/data/mockData.ts` in full. Create `apps/web/src/data/marketing-mock.ts` containing:
1. The `DishItem`, `ComparisonRow`, `SubredditThread` interfaces from `types.ts` (drop `Verdict`, `CityCategory`, `CityData` — unused by any ported component).
2. The `DISHES_BY_CITY`, `COMPARISON_DATA`, `SUBREDDIT_RECEIPTS`, `FAQS` constants from `mockData.ts`, copied verbatim (drop `CITIES_DATA` — unused by any ported component).

The file should have no imports and no JSX — pure data/types, matching this app's "no local `src/types/` folder, types travel with domain data" convention.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web` from the repo root.
Expected: PASS (no consumers yet, so this is just a syntax/type-correctness check on the new file).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/data/marketing-mock.ts
git commit -m "web: add marketing mock data for landing page revamp"
```

---

### Task 2: Early access modal (real waitlist wiring)

**Files:**
- Create: `apps/web/src/components/marketing/early-access-modal.tsx`

**Interfaces:**
- Consumes: `IS_WAITLIST_MODE: boolean` from `@/lib/waitlist`; `joinWaitlist(email: string, source?: string): Promise<{ success: boolean; message: string }>` from `@/app/actions/waitlist-action`.
- Produces: `EarlyAccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void })` — consumed by Task 13 (`page.tsx`).

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/EarlyAccessModal.tsx` in full for the exact JSX/markup (dark modal — every hex value in it is a **permanently-dark exception**, keep unchanged). Create `apps/web/src/components/marketing/early-access-modal.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { X, Check, ArrowRight, Smartphone, Mail, Clock } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { joinWaitlist } from "@/app/actions/waitlist-action";

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EarlyAccessModal({ isOpen, onClose }: EarlyAccessModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await joinWaitlist(email, "early-access-modal");
      setStatus(result.success ? "success" : "error");
      setMessage(result.message);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#18181A] border border-[#2E2E34] rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#242428] hover:bg-[#2E2E34] text-[#A3A3A3] hover:text-white flex items-center justify-center transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          {IS_WAITLIST_MODE ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#26262B] text-[#E13B22] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              Private Beta &bull; In Testing
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#26262B] text-[#E13B22] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Smartphone className="w-3.5 h-3.5" />
              Available Now
            </div>
          )}

          <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mb-2">
            {IS_WAITLIST_MODE ? "Join Early Access Beta." : "Download Forked."}
          </h3>

          <p className="text-xs sm:text-sm text-[#A3A3A3] mb-6 leading-relaxed">
            {IS_WAITLIST_MODE
              ? "Core features and battle engines are finalized and currently in private testing. Reserve your spot for the next invite wave."
              : "Settle the food debates with head-to-head battles. Download on iOS or Android below, or join the email waitlist for beta dish drops."}
          </p>

          {IS_WAITLIST_MODE ? (
            <div>
              {status === "success" ? (
                <div className="p-4 rounded-2xl bg-[#202024] border border-[#E13B22]/50 text-center animate-in fade-in">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E13B22] text-white mb-2">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white">
                    {message}
                  </h4>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 rounded-xl bg-white text-[#121212] font-display font-bold text-xs hover:bg-[#F3EFEA]"
                  >
                    Got It
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#A3A3A3] mb-1.5">
                      Enter your email for private beta access
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-3 rounded-xl bg-[#202024] border border-[#333338] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#E13B22]"
                    />
                  </div>
                  {status === "error" && (
                    <p className="text-red-400 text-xs font-bold">{message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isPending ? "Submitting..." : "Request Early Access Invite"}</span>
                  </button>
                </form>
              )}

              <div className="relative flex items-center justify-center my-5">
                <div className="w-full border-t border-[#2E2E34]" />
                <span className="absolute px-2.5 bg-[#18181A] text-[10px] font-mono uppercase text-[#737373]">
                  App Store & Play Store
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 opacity-80">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#202024] border border-[#2E2E34] text-left">
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#E13B22]">
                      In Testing
                    </div>
                    <div className="font-display font-bold text-xs text-white truncate">
                      iOS TestFlight
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#202024] border border-[#2E2E34] text-left">
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#E13B22]">
                      In Testing
                    </div>
                    <div className="font-display font-bold text-xs text-white truncate">
                      Play Beta
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-[#121212] hover:bg-[#F3EFEA] transition-all shadow-md active:scale-95"
                >
                  <div className="text-left min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#737373] leading-none">
                      App Store
                    </div>
                    <div className="font-display font-black text-xs text-[#121212] truncate">
                      Download iOS
                    </div>
                  </div>
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#222226] hover:bg-[#2A2A30] border border-[#333338] text-white transition-all shadow-md active:scale-95"
                >
                  <div className="text-left min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#A3A3A3] leading-none">
                      Google Play
                    </div>
                    <div className="font-display font-black text-xs text-white truncate">
                      Get Android
                    </div>
                  </div>
                </a>
              </div>

              <div className="relative flex items-center justify-center my-5">
                <div className="w-full border-t border-[#2E2E34]" />
                <span className="absolute px-2.5 bg-[#18181A] text-[10px] font-mono uppercase text-[#737373]">
                  or join email list
                </span>
              </div>

              {status === "success" ? (
                <div className="p-4 rounded-2xl bg-[#202024] border border-[#E13B22]/50 text-center animate-in fade-in">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E13B22] text-white mb-2">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white">
                    {message}
                  </h4>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 rounded-xl bg-white text-[#121212] font-display font-bold text-xs hover:bg-[#F3EFEA]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="Enter your email for new dish tournaments..."
                    className="w-full px-4 py-3 rounded-xl bg-[#202024] border border-[#333338] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#E13B22]"
                  />
                  {status === "error" && (
                    <p className="text-red-400 text-xs font-bold">{message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isPending ? "Submitting..." : "Join Email Digest"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-5 text-center text-[10px] font-mono text-[#737373]">
            Zero Star Averages &bull; Strictly Like-for-Like Dish Battles
          </div>
        </div>
      </div>
    </div>
  );
}
```

Note: `ArrowRight` is imported but unused in this trimmed version — remove it from the import list if your editor/linter flags it (it's not used since the v2 "Coming Soon" store badges lost their arrow icon in this port; double check against ESLint output in Step 2 rather than guessing).

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web` from the repo root.
Expected: PASS. If lint flags an unused import (e.g. `ArrowRight`), remove it.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/early-access-modal.tsx
git commit -m "web: add early access modal wired to real waitlist action"
```

---

### Task 3: Hero section

**Files:**
- Create: `apps/web/src/components/marketing/hero.tsx`

**Interfaces:**
- Consumes: `IS_WAITLIST_MODE` from `@/lib/waitlist`.
- Produces: `Hero({ onOpenEarlyAccess }: { onOpenEarlyAccess: () => void })` — consumed by Task 13.

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/Hero.tsx` in full. Create `apps/web/src/components/marketing/hero.tsx` by:
1. Copying the `MOCKED_POBOY_LEADERBOARD` array and the entire "Right Column: High-Fidelity Mobile App Showcase" JSX block (the phone mockup, from `<div className="lg:col-span-5 ...">` through its closing tag) **verbatim, unchanged** — per Global Constraints, this is a fixed screenshot illustration and stays literal-hex.
2. Rewriting the "Left Column: Copy & Messaging" block using the token mapping table: `bg-[#F3EFEA]` → `bg-surface-2`; `bg-[#E13B22]/5` → `bg-accent/5`; `border-[#E6E1D8]` → `border-border`; the `bg-[#121212] text-white` tagline pill → `bg-text-primary text-bg`; `bg-[#E13B22]` pulse dot → `bg-accent`; `emerald-500` dot → `bg-success`; `text-[#121212]` headline → `text-text-primary`; `text-[#E13B22]` accent span/underline → `text-accent` / `decoration-accent/40`; `text-[#525252]` subhead → `text-text-secondary`; the primary CTA `bg-[#E13B22] hover:bg-[#C02A14]` → `bg-accent hover:brightness-110`, its text `text-white` → `text-accent-on`; the secondary CTA `bg-[#F3EFEA] hover:bg-[#EAE4DC] border-[#DDD6CC]` → `bg-surface-2 hover:brightness-95 border-border`, its icon `text-[#E13B22]` → `text-accent`, its label `text-[#121212]` → `text-text-primary`; the proof-metric strip `border-[#E6E1D8]` → `border-border`, its numbers `text-[#121212]`/`text-[#E13B22]` → `text-text-primary`/`text-accent`, its captions `text-[#737373]` → `text-text-tertiary`.
3. Replacing `import { isWaitlistMode } from '../config'; const inWaitlistMode = isWaitlistMode();` with `import { IS_WAITLIST_MODE } from "@/lib/waitlist";` and using `IS_WAITLIST_MODE` directly (no local variable).
4. Section root: `border-b border-[#E6E1D8]` → `border-b border-border`.

The resulting left column:

```tsx
<div className="lg:col-span-7 flex flex-col items-start text-left">
  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-text-primary text-bg text-xs font-mono font-medium mb-5 shadow-xs">
    {IS_WAITLIST_MODE ? (
      <>
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>FEATURES FINALIZED &bull; PRIVATE BETA TESTING</span>
      </>
    ) : (
      <>
        <span className="w-2 h-2 rounded-full bg-success" />
        <span>NOW LIVE ON iOS & ANDROID</span>
      </>
    )}
  </div>

  <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-[68px] tracking-tight leading-[1.03] text-text-primary mb-5">
    Rank the dish, <br />
    <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/40">
      not the place.
    </span>
  </h1>

  <p className="text-lg sm:text-xl text-text-secondary font-medium max-w-xl mb-8">
    Star ratings flattened every city into a 4.2 blur. Forked isolates the dish: quick verdicts, head-to-head battles, and one undisputed city leaderboard.
  </p>

  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
    <button
      onClick={onOpenEarlyAccess}
      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-display font-bold text-base text-accent-on bg-accent hover:brightness-110 transition-all shadow-md active:scale-95"
    >
      <span>{IS_WAITLIST_MODE ? "Request Beta Access" : "Download Forked App"}</span>
      <ArrowRight className="w-4 h-4" />
    </button>

    <a
      href="#leaderboards"
      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-display font-bold text-base text-text-primary bg-surface-2 hover:brightness-95 border border-border transition-all active:scale-95"
    >
      <Trophy className="w-4 h-4 text-accent" />
      <span>View Dish Leaderboards</span>
    </a>
  </div>

  <div className="w-full grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-border">
    <div>
      <div className="font-display font-black text-2xl sm:text-3xl text-text-primary">0.0</div>
      <div className="text-xs sm:text-sm font-semibold text-text-tertiary mt-0.5">No stars. Battles only.</div>
    </div>
    <div>
      <div className="font-display font-black text-2xl sm:text-3xl text-accent">&lt;10s</div>
      <div className="text-xs sm:text-sm font-semibold text-text-tertiary mt-0.5">Log a plate & vote.</div>
    </div>
    <div>
      <div className="font-display font-black text-2xl sm:text-3xl text-text-primary">#1</div>
      <div className="text-xs sm:text-sm font-semibold text-text-tertiary mt-0.5">Public city leaderboard.</div>
    </div>
  </div>
</div>
```

Wrap it, together with the untouched phone-mockup right column, in:

```tsx
import { ArrowRight, Trophy, MapPin, ChevronDown, Search, Swords, PlusCircle, User } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

interface HeroProps {
  onOpenEarlyAccess: () => void;
}

const MOCKED_POBOY_LEADERBOARD = [ /* copied verbatim from v2 Hero.tsx */ ];

export function Hero({ onOpenEarlyAccess }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-border">
      <div className="absolute top-0 right-0 w-96 h-96 bg-surface-2 rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* left column above */}
          {/* right column: verbatim phone mockup from v2, unchanged */}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/hero.tsx
git commit -m "web: add revamped hero section using theme tokens"
```

---

### Task 4: TheEnemy section

**Files:**
- Create: `apps/web/src/components/marketing/the-enemy.tsx`

**Interfaces:**
- Produces: `TheEnemy()` (no props) — consumed by Task 13.

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/TheEnemy.tsx` in full. Copy it **verbatim** into `apps/web/src/components/marketing/the-enemy.tsx` — this entire section is a permanently-dark exception (Global Constraints), so no color tokens change. Only changes:
- Drop `import React from 'react';`.
- Change `export const TheEnemy: React.FC = () => {` / trailing `};` to `export function TheEnemy() {` / trailing `}`.
- Keep the `id="the-enemy"` on the `<section>` — Task 10/11 (Navbar/Footer) link to `/#the-enemy`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/the-enemy.tsx
git commit -m "web: add the-enemy comparison section"
```

---

### Task 5: ThreePillars section

**Files:**
- Create: `apps/web/src/components/marketing/three-pillars.tsx`

**Interfaces:**
- Produces: `ThreePillars()` (no props) — consumed by Task 13.

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/ThreePillars.tsx` in full. This is a light/theme-toggle-responsive section — convert every color per the token mapping table, keep the `useState` variant-tab logic unchanged. Concretely:
- Drop `import React, { useState } from 'react';` → `import { useState } from "react";`.
- `export const ThreePillars: React.FC = () => {` → `export function ThreePillars() {`; final `};` → `}`.
- Section root `bg-[#FBF9F5] border-b border-[#E6E1D8]` → `bg-bg border-b border-border`.
- Header badge `bg-[#121212] text-white` → `bg-text-primary text-bg`; its icon `text-[#E13B22]` → `text-accent`.
- Headline `text-[#121212]` → `text-text-primary`; subhead `text-[#525252]` → `text-text-secondary`.
- All three pillar cards: `bg-white border-[#E6E1D8] ... hover:border-[#121212]` → `bg-surface border-border ... hover:border-text-primary`.
- Number badges: pillar 1/3 `bg-[#121212] text-white` → `bg-text-primary text-bg`; pillar 2 `bg-[#E13B22] text-white` → `bg-accent text-accent-on`.
- `text-[#E13B22]` "Pillar N" labels → `text-accent`.
- `text-[#121212]` card headings → `text-text-primary`; `text-[#525252]` body copy → `text-text-secondary`.
- Inner preview boxes `bg-[#F8F6F2] border-[#E6E1D8]` → `bg-surface-2 border-border`; their `text-[#737373]` captions → `text-text-tertiary`.
- Variant-tab buttons: active `bg-[#121212] text-white` → `bg-text-primary text-bg`; inactive `bg-white text-[#737373] border-[#E6E1D8]` → `bg-surface text-text-tertiary border-border`.
- Nested preview card `bg-white border-[#E6E1D8]` → `bg-surface border-border`; its `text-[#121212]` → `text-text-primary`; `text-[#E13B22]` variant label → `text-accent`; `text-[#737373]` insight text → `text-text-tertiary`.
- Pillar 2's numbered flow steps: step badges `bg-[#121212] text-white` / `bg-[#E13B22] text-white` → `bg-text-primary text-bg` / `bg-accent text-accent-on`; `bg-zinc-100 text-zinc-500` mini "Bad/Okay" badges → `bg-surface-2 text-text-tertiary`; `bg-[#E13B22] text-white` "Great" badge → `bg-accent text-accent-on`; the dark step-3 row `bg-[#121212] text-white` → `bg-text-primary text-bg`; its `bg-emerald-500` badge → `bg-success`; its `text-emerald-400` output label → `text-success`.
- Pillar 3's mini scoreboard rows: `bg-white border-[#E6E1D8]` → `bg-surface border-border`; `text-[#E13B22]` rank-1/`text-[#121212]` other ranks → `text-accent` / `text-text-primary`; `text-[#737373]` win% → `text-text-tertiary`.
- Every `<Check className="w-4 h-4 text-[#E13B22] ...">` bullet icon → `text-accent`; the surrounding `text-[#525252]` bullet text → `text-text-secondary`; `border-[#E6E1D8]` bullet-list top border → `border-border`.
- Keep the `id="how-it-works"` on the `<section>`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/three-pillars.tsx
git commit -m "web: add three-pillars section using theme tokens"
```

---

### Task 6: City leaderboard viewer (live data + mock fallback)

**Files:**
- Create: `apps/web/src/components/marketing/city-leaderboard-viewer.tsx`

**Interfaces:**
- Consumes: `IS_WAITLIST_MODE` from `@/lib/waitlist`; `createClient` from `@/lib/supabase/server`; `LeaderboardEntry` type from `@forked/supabase`; `DISHES_BY_CITY` from `@/data/marketing-mock` (Task 1).
- Produces: `CityLeaderboardViewer({ onOpenEarlyAccess }: { onOpenEarlyAccess: () => void })` async server component — consumed by Task 13.

- [ ] **Step 1: Capture the RPC pattern**

Read `apps/web/src/components/marketing/leaderboard-preview.tsx` in full (it still exists at this point — it's deleted in Task 13). It defines a `getFlagshipPreview()` helper that calls `supabase.rpc("get_flagship_board")` then `supabase.rpc("get_leaderboard", { p_city_id, p_dish_type_id, p_limit: 5 })` plus a `city_known_dishes` query for two other dish names, wrapped in try/catch returning `null` on any error. Reuse this exact pattern (adjusted to `p_limit: 6` to match the mock's 6-row list).

- [ ] **Step 2: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/CityLeaderboardViewer.tsx` in full for the mock-branch JSX and section chrome (badge, banner, bottom "drive to app" dark card — that dark card is a permanently-dark exception, keep its hex literal). Create `apps/web/src/components/marketing/city-leaderboard-viewer.tsx`:

```tsx
import { Trophy, ArrowUpRight, Smartphone, ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { DISHES_BY_CITY } from "@/data/marketing-mock";
import type { LeaderboardEntry } from "@forked/supabase";

interface CityLeaderboardViewerProps {
  onOpenEarlyAccess: () => void;
}

interface FlagshipBoard {
  citySlug: string;
  cityName: string;
  dishTypeSlug: string;
  dishTypeName: string;
}

async function getFlagshipPreview(): Promise<{ flagship: FlagshipBoard; entries: LeaderboardEntry[] } | null> {
  try {
    const supabase = await createClient();
    const { data: flagshipRows } = await supabase.rpc("get_flagship_board");
    const flagship = flagshipRows?.[0];
    if (!flagship) return null;

    const { data: entries } = await supabase.rpc("get_leaderboard", {
      p_city_id: flagship.city_id,
      p_dish_type_id: flagship.dish_type_id,
      p_limit: 6,
    });

    return {
      flagship: {
        citySlug: flagship.city_slug,
        cityName: flagship.city_name,
        dishTypeSlug: flagship.dish_type_slug,
        dishTypeName: flagship.dish_type_name,
      },
      entries: (entries as unknown as LeaderboardEntry[]) ?? [],
    };
  } catch {
    return null;
  }
}

export async function CityLeaderboardViewer({ onOpenEarlyAccess }: CityLeaderboardViewerProps) {
  const preview = IS_WAITLIST_MODE ? null : await getFlagshipPreview();
  const useLiveData = !!preview?.entries?.length;
  const nolaDishes = DISHES_BY_CITY["nola"] ?? [];

  return (
    <section id="leaderboards" className="py-16 sm:py-24 bg-bg border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-text-primary text-bg text-xs font-mono font-medium uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            Official Scoreboard
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-text-primary tracking-tight leading-tight">
            The Leaderboard.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-2">
            Dishes ranked purely on pairwise battles by people who paid for their food. No star averages, no tourist inflation.
          </p>
        </div>

        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-7 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
              Dish Championship Scoreboard
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-text-primary mt-0.5">
              {useLiveData ? preview!.flagship.dishTypeName : "Po'boy"}
            </h3>
            <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
              {useLiveData
                ? `Live rankings in ${preview!.flagship.cityName}`
                : "Variant comparisons across New Orleans • 1,420+ pairwise battles logged"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEarlyAccess}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-display font-bold text-bg bg-text-primary hover:brightness-110 transition-colors"
            >
              {IS_WAITLIST_MODE ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Request Beta</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Rank in App</span>
                </>
              )}
            </button>
          </div>
        </div>

        {useLiveData ? (
          <div className="space-y-3">
            {preview!.entries.map((entry) => (
              <div
                key={`${entry.restaurant_name}-${entry.rank}`}
                className={`rounded-2xl border transition-all p-4 sm:p-5 flex items-center justify-between gap-4 ${
                  entry.rank === 1
                    ? "bg-surface border-accent shadow-sm ring-1 ring-accent/20"
                    : "bg-surface border-border hover:border-text-tertiary"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-display font-black leading-none ${
                      entry.rank === 1 ? "bg-accent text-accent-on" : "bg-surface-2 text-text-primary border border-border"
                    }`}
                  >
                    <span className="text-lg">#{entry.rank}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-lg text-text-primary truncate">
                      {entry.restaurant_name}
                    </h4>
                    <div className="text-xs sm:text-sm text-text-secondary truncate">{entry.address}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-text-tertiary">{entry.total_ratings} ratings</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {nolaDishes.map((dish) => {
              const isFirst = dish.rank === 1;
              return (
                <div
                  key={dish.id}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isFirst
                      ? "bg-surface border-text-primary shadow-sm ring-1 ring-text-primary/20"
                      : "bg-surface border-border hover:border-text-tertiary"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-display font-black leading-none ${
                        isFirst ? "bg-accent text-accent-on shadow-xs" : "bg-surface-2 text-text-primary border border-border"
                      }`}
                    >
                      <span className="text-lg">#{dish.rank}</span>
                    </div>
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display font-black text-lg sm:text-xl text-text-primary leading-snug">
                        Po&apos;boy
                      </h4>
                      <div className="text-xs font-mono font-bold text-accent uppercase tracking-wider mt-0.5">
                        Variant: {dish.variant}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-text-secondary flex items-center gap-1.5 mt-1">
                        <span className="text-text-primary font-bold">{dish.restaurant}</span>
                        <span className="text-text-tertiary">&bull;</span>
                        <span className="text-text-tertiary">{dish.neighborhood}</span>
                        {dish.priceNote && (
                          <>
                            <span className="text-text-tertiary">&bull;</span>
                            <span className="text-text-tertiary font-mono">{dish.priceNote}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary mt-1.5 italic max-w-xl line-clamp-1 sm:line-clamp-2">
                        &quot;{dish.localTake}&quot;
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between pt-3 sm:pt-0 border-t sm:border-t-0 border-border shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                      <div className="font-display font-black text-lg sm:text-xl text-text-primary">
                        {dish.winRate}% <span className="text-xs font-mono font-normal text-text-tertiary">Win Rate</span>
                      </div>
                      <div className="text-[11px] font-mono text-text-tertiary">
                        {dish.totalBattles.toLocaleString()} head-to-head battles
                      </div>
                    </div>
                    <button
                      onClick={onOpenEarlyAccess}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-display font-bold bg-surface-2 hover:bg-text-primary hover:text-bg text-text-primary transition-colors flex items-center gap-1"
                    >
                      <span>{IS_WAITLIST_MODE ? "Join Waitlist" : "Vote in App"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-3xl bg-[#121212] border border-[#2E2E34] p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#E13B22] uppercase tracking-wider mb-2">
              {IS_WAITLIST_MODE ? (
                <>
                  <Clock className="w-4 h-4" />
                  Finalized Features &bull; In Testing
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  Thousands More Dishes In The App
                </>
              )}
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white mb-2">
              Want to see pizza, burgers, ramen, tacos, or wings?
            </h3>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              {IS_WAITLIST_MODE
                ? "Full leaderboards for pizza, smash burgers, hot chicken, and tacos are finalized and in private beta. Join the waitlist to test the app."
                : "Full leaderboards for pizza, smash burgers, hot chicken, and tacos are live in the app. Download now to settle your local debates."}
            </p>
          </div>
          <button
            onClick={onOpenEarlyAccess}
            className="px-6 py-3.5 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-black text-sm flex items-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
          >
            <span>{IS_WAITLIST_MODE ? "Join Beta Waitlist" : "Open in App"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
```

Note the `entry.rank === 1` ring/border uses `ring-accent/20` (token) for the live-data branch, while the mock branch keeps `ring-text-primary/20` matching v2's original ink-ring styling for its rank-1 row — this is intentional, not a typo: the two branches render different data shapes and were styled independently in the source designs.

- [ ] **Step 3: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS. If `LeaderboardEntry`'s actual field names differ from `restaurant_name`/`address`/`total_ratings`/`rank` (check `packages/supabase`'s generated types if the compiler errors here), fix the field references to match — do not change the RPC call shape.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/marketing/city-leaderboard-viewer.tsx
git commit -m "web: add city leaderboard viewer with live data and mock fallback"
```

---

### Task 7: AntiSlopComparison section

**Files:**
- Create: `apps/web/src/components/marketing/anti-slop-comparison.tsx`

**Interfaces:**
- Consumes: `COMPARISON_DATA` from `@/data/marketing-mock` (Task 1).
- Produces: `AntiSlopComparison()` (no props) — consumed by Task 13.

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/AntiSlopComparison.tsx` in full. This entire section is a permanently-dark exception — copy verbatim into `apps/web/src/components/marketing/anti-slop-comparison.tsx` with only these changes:
- Drop `import React from 'react';`.
- Change the data import to `import { COMPARISON_DATA } from "@/data/marketing-mock";`.
- `export const AntiSlopComparison: React.FC = () => {` → `export function AntiSlopComparison() {`; trailing `};` → `}`.
- Keep `id="compare"` on the `<section>`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/anti-slop-comparison.tsx
git commit -m "web: add anti-slop comparison table section"
```

---

### Task 8: SubredditReceipts section

**Files:**
- Create: `apps/web/src/components/marketing/subreddit-receipts.tsx`

**Interfaces:**
- Consumes: `SUBREDDIT_RECEIPTS` from `@/data/marketing-mock` (Task 1).
- Produces: `SubredditReceipts()` (no props) — consumed by Task 13.

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/SubredditReceipts.tsx` in full. This section is mostly light (token-convert) except the final "Origin Catalyst Box" (`bg-[#121212] text-white ...`), which is a permanently-dark exception — keep it literal. Create `apps/web/src/components/marketing/subreddit-receipts.tsx`:
- Drop `import React from 'react';`; data import → `import { SUBREDDIT_RECEIPTS } from "@/data/marketing-mock";`.
- `export const SubredditReceipts: React.FC = () => {` → `export function SubredditReceipts() {`; trailing `};` → `}`.
- Section root `bg-[#FBF9F5] border-b border-[#E6E1D8]` → `bg-bg border-b border-border`.
- Header badge `bg-[#121212] text-white` → `bg-text-primary text-bg`; icon `text-[#E13B22]` → `text-accent`.
- Headline `text-[#121212]` → `text-text-primary`; body `text-[#525252]` → `text-text-secondary`.
- Each receipt card: `bg-white border-[#E6E1D8] ... hover:border-[#121212]` → `bg-surface border-border ... hover:border-text-primary`.
- Card header row: `text-[#E13B22]` subreddit name → `text-accent`; `bg-[#F3EFEA] text-[#525252] border-[#E0D9CF]` frequency badge → `bg-surface-2 text-text-secondary border-border`; `text-[#737373]` upvote/comment line → `text-text-tertiary`.
- Title `text-[#121212]` → `text-text-primary`.
- "The Recurring Question" box `bg-[#F8F6F2] border-[#E6E1D8]` → `bg-surface-2 border-border`; its label `text-[#737373]` → `text-text-tertiary`; its quote `text-[#525252]` → `text-text-secondary`.
- "The 100+ Comment Scroll" box: keep `bg-[#FAF6F0] border-[#E8DFC8]` **as literal hex** (this is a deliberately warm/aged-paper callout distinct from the standard muted-card color, not a semantic token in this design — leave unchanged); its label `text-[#C02A14]` stays literal (accent-dark, matches the "always dark accent" callouts elsewhere); icon `text-[#E13B22]` stays literal; body `text-[#262626]` stays literal. (These four are the one deliberate exception-within-a-light-section: the comment-chaos callout is styled as a fixed "warning sticky note" regardless of theme, matching v2's intent — leave every color in this specific inner box unconverted.)
- Persona footer strip: `border-[#E6E1D8]` → `border-border`; `bg-[#FBF9F5]` → `bg-bg`; avatar circle `bg-[#121212] text-white` → `bg-text-primary text-bg`; name `text-[#121212]` → `text-text-primary`; role/location `text-[#737373]` → `text-text-tertiary`; quote `text-[#525252]` → `text-text-secondary`.
- The final "Origin Catalyst Box" (`bg-[#121212] text-white`, its `text-[#E13B22]` label, `text-[#A3A3A3]` body, and its white CTA button `hover:bg-[#E13B22]`) — copy **verbatim, unchanged**.
- Keep `id="receipts"` on the `<section>`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/subreddit-receipts.tsx
git commit -m "web: add subreddit receipts section using theme tokens"
```

---

### Task 9: FaqSection

**Files:**
- Create: `apps/web/src/components/marketing/faq-section.tsx`

**Interfaces:**
- Consumes: `FAQS` from `@/data/marketing-mock` (Task 1).
- Produces: `FaqSection()` (no props) — consumed by Task 13.

- [ ] **Step 1: Write the component**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/FaqSection.tsx` in full — fully light, token-convert everything. Create `apps/web/src/components/marketing/faq-section.tsx`:
- Drop `import React, { useState } from 'react';` → `import { useState } from "react";`; data import → `import { FAQS } from "@/data/marketing-mock";`.
- `export const FaqSection: React.FC = () => {` → `export function FaqSection() {`; trailing `};` → `}`.
- Section root `bg-[#FBF9F5] border-b border-[#E6E1D8]` → `bg-bg border-b border-border`.
- Header badge `bg-[#121212] text-white` → `bg-text-primary text-bg`; icon `text-[#E13B22]` → `text-accent`; headline `text-[#121212]` → `text-text-primary`; body `text-[#525252]` → `text-text-secondary`.
- Each accordion row: `bg-white border-[#E6E1D8]` → `bg-surface border-border`; hover `hover:bg-[#FAF8F5]` → `hover:bg-surface-2`; question text `text-[#121212]` → `text-text-primary`; chevron circle `bg-[#F3EFEA] ... text-[#737373]` (closed) / `bg-[#121212] text-white` (open) → `bg-surface-2 text-text-tertiary` (closed) / `bg-text-primary text-bg` (open); answer text `text-[#525252]` → `text-text-secondary`; answer top border `border-[#F3EFEA]` → `border-border`.
- Keep `id="faq"` on the `<section>` and the `useState` open/close logic unchanged.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/marketing/faq-section.tsx
git commit -m "web: add faq section using theme tokens"
```

---

### Task 10: Navbar (marquee + new nav, real routes preserved)

**Files:**
- Modify: `apps/web/src/components/layout/navbar.tsx` (full rewrite)

**Interfaces:**
- Consumes: `IS_WAITLIST_MODE` from `@/lib/waitlist`.
- Produces: `Navbar()` (no props, unchanged signature) — consumed by `page.tsx` (Task 13) and every route that already renders it (`/leaderboard/**`, and after Task 12, `/blog`, `/privacy`, `/terms`).

- [ ] **Step 1: Rewrite the component**

Read `apps/web/src/components/layout/navbar.tsx` (current version) and `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/Header.tsx` in full. Replace `apps/web/src/components/layout/navbar.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { track } from "@vercel/analytics";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

const MARQUEE_DISHES = [
  "Pizza", "Smash Burger", "Tacos al Pastor", "Roast Beef Po'boy", "Hot Chicken",
  "Tonkotsu Ramen", "Italian Beef", "Buffalo Wings", "Birria Tacos",
  "Fried Chicken Sandwich", "Pad Thai", "Cheesesteak", "Lobster Roll",
  "Texas Brisket", "Fish & Chips", "Chicken Tikka Masala", "Biryani",
  "Dan Dan Noodles", "Gumbo", "Bagel & Lox", "Carnitas", "French Dip",
  "Clam Chowder", "Pork Belly Bao", "Shawarma", "Mac & Cheese",
];

const allNavLinks = [
  { href: "/#the-enemy", label: "The Enemy" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#leaderboards", label: "Leaderboards" },
  { href: "/#compare", label: "Compare" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

const waitlistHiddenHrefs = ["/blog"];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navLinks = IS_WAITLIST_MODE
    ? allNavLinks.filter((l) => !waitlistHiddenHrefs.includes(l.href))
    : allNavLinks;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="bg-[#121212] text-[#FBF9F5] py-2 border-b border-[#252525] overflow-hidden whitespace-nowrap select-none">
        <div className="animate-marquee flex items-center">
          {[0, 1].map((loop) => (
            <div key={loop} className="flex items-center">
              {MARQUEE_DISHES.map((dish, i) => (
                <div key={`dish-${loop}-${i}`} className="inline-flex items-center gap-3 px-4 shrink-0">
                  <span className="text-xs font-medium tracking-wider text-white/90 uppercase">{dish}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E13B22]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          isScrolled || isMobileOpen
            ? "bg-bg/90 backdrop-blur-md border-b border-border shadow-xs py-3"
            : "bg-bg border-b border-border py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/images/fork-logo/fork-gold.png" alt="Forked logo" width={36} height={36} />
              <div className="flex flex-col">
                <span className="font-display font-black text-2xl tracking-tight leading-none text-text-primary">
                  FORKED
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-tertiary leading-none mt-0.5">
                  Rank The Dish
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-text-secondary">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => track("nav_link_click", { label: link.label })}
                  className="px-3 py-1.5 rounded-md hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="p-2 rounded-lg text-text-primary hover:bg-surface-2 focus:outline-none"
                aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileOpen}
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileOpen && (
          <div className="lg:hidden bg-bg border-b border-border px-4 pt-3 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    track("nav_link_click", { label: link.label });
                    setIsMobileOpen(false);
                  }}
                  className="px-3 py-2 text-sm font-medium rounded-md text-text-secondary bg-surface-2 hover:brightness-95"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
```

The `animate-marquee` keyframe already exists in `apps/web/src/app/globals.css`? Check with `grep -n "animate-marquee" apps/web/src/app/globals.css`. If it's missing, add it (copy from v2's `src/index.css`):

```css
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 40s linear infinite;
  will-change: transform;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
```

Append it to `apps/web/src/app/globals.css` (after the existing scrollbar rules) only if the grep found nothing.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/navbar.tsx apps/web/src/app/globals.css
git commit -m "web: revamp navbar with marquee bar and new section anchors"
```

---

### Task 11: Footer (dark restyle, real links preserved, optional waitlist CTA)

**Files:**
- Modify: `apps/web/src/components/layout/footer.tsx` (full rewrite)

**Interfaces:**
- Consumes: `IS_WAITLIST_MODE` from `@/lib/waitlist`.
- Produces: `Footer({ onOpenEarlyAccess }: { onOpenEarlyAccess?: () => void })` — note the prop is **new** and **optional** (current signature is no-args); consumed by `page.tsx` (Task 13, passing the callback) and every other route that renders `<Footer />` with no props (unchanged call sites on `/leaderboard/**`, and after Task 12, `/blog`, `/privacy`, `/terms` — these keep compiling because the prop is optional).

- [ ] **Step 1: Rewrite the component**

Read `apps/web/src/components/layout/footer.tsx` (current version) and `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/Footer.tsx` in full. This entire section is a permanently-dark exception (Global Constraints) — port v2's markup with its literal hex unchanged, but: use real `/blog`, `/privacy`, `/terms` links (not just `#anchor`s), make in-page anchors `/#anchor`, drop `isWaitlistMode()` for `IS_WAITLIST_MODE`, keep the existing `ThemeToggle`, and make the waitlist CTA degrade to a `Link` to `/` when `onOpenEarlyAccess` isn't provided (i.e. on non-home pages).

Replace `apps/web/src/components/layout/footer.tsx` with:

```tsx
import Link from "next/link";
import { Flame, Mail } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface FooterProps {
  onOpenEarlyAccess?: () => void;
}

export function Footer({ onOpenEarlyAccess }: FooterProps = {}) {
  return (
    <footer className="bg-[#0D0D0E] text-[#A3A3A3] pt-16 pb-12 border-t border-[#26262A] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#222226]">
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#E13B22] text-white flex items-center justify-center font-display font-black text-lg tracking-tight">
                F
              </div>
              <span className="font-display font-black text-2xl tracking-tight text-white">FORKED</span>
            </Link>
            <p className="text-sm text-[#D4D4D4] max-w-sm leading-relaxed">
              <strong>Rank the dish, not the place.</strong> Settle the debate with pairwise head-to-head battles and public citywide leaderboards.
            </p>
            <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-[#18181A] border border-[#2E2E32] text-xs text-white">
              <Flame className="w-4 h-4 text-[#E13B22] shrink-0" />
              <span>Strictly zero star averages. 100% paid meals.</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#the-enemy" className="hover:text-white transition-colors">The Enemy (Anti-Star)</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">The Three Pillars</Link></li>
              <li><Link href="/#leaderboards" className="hover:text-white transition-colors">Dish Leaderboards</Link></li>
              <li><Link href="/#compare" className="hover:text-white transition-colors">Compare vs Beli & Yelp</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ & Math Model</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              {IS_WAITLIST_MODE ? "Private Beta" : "Get Forked"}
            </h4>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {IS_WAITLIST_MODE
                ? "Core features are finalized and in active testing. Reserve your spot for the next test cohort on iOS and Android."
                : "Available now on iOS and Android. Settle the debate with pairwise head-to-head battles."}
            </p>
            {IS_WAITLIST_MODE ? (
              onOpenEarlyAccess ? (
                <button
                  onClick={onOpenEarlyAccess}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Join Beta Waitlist</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Join Beta Waitlist</span>
                </Link>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#18181A] hover:bg-[#222226] border border-[#2E2E32] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>App Store</span>
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#18181A] hover:bg-[#222226] border border-[#2E2E32] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Google Play</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
          <div className="flex items-center gap-6">
            <span>&copy; 2026 Forked. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px]">Made for Mobile First</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS. Existing call sites `<Footer />` (no args) on `/leaderboard/**` must still typecheck since the prop is optional.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/footer.tsx
git commit -m "web: revamp footer with real legal/blog links and optional waitlist CTA"
```

---

### Task 12: Move blog/privacy/terms out of `(marketing)` into `(content)`

**Files:**
- Create: `apps/web/src/app/(content)/layout.tsx`
- Create: `apps/web/src/app/(content)/error.tsx`
- Move: `apps/web/src/app/(marketing)/blog/` → `apps/web/src/app/(content)/blog/`
- Move: `apps/web/src/app/(marketing)/privacy/` → `apps/web/src/app/(content)/privacy/`
- Move: `apps/web/src/app/(marketing)/terms/` → `apps/web/src/app/(content)/terms/`

**Interfaces:**
- Produces: `/blog`, `/blog/[slug]`, `/privacy`, `/terms` continue to resolve to the same URLs (route groups don't affect the URL path) — no change for Task 14 (sitemap) or any code linking to these paths.

- [ ] **Step 1: Create the new layout**

Read `apps/web/src/app/(marketing)/layout.tsx` (current version — it wraps children in `<Navbar /><main className="pt-24 pb-16 min-h-screen bg-bg">{children}</main><Footer />`). The `pt-24` exists to clear the `Navbar`'s `sticky`/scroll-shadow header (not a marketing-specific style), so it's still required here. Create `apps/web/src/app/(content)/layout.tsx`:

```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create the new error boundary**

Read `apps/web/src/app/(marketing)/error.tsx` in full and copy it verbatim to `apps/web/src/app/(content)/error.tsx` (it's generic — no marketing-specific references).

- [ ] **Step 3: Move the route folders**

```bash
cd apps/web/src/app
mkdir -p "(content)"
git mv "(marketing)/blog" "(content)/blog"
git mv "(marketing)/privacy" "(content)/privacy"
git mv "(marketing)/terms" "(content)/terms"
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web` from the repo root. Then `npm run dev -w forked-web` and confirm `/blog`, `/privacy`, `/terms` load with the (still-old, pre-Task-13) Navbar/Footer.
Expected: PASS; pages render.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(content)" "apps/web/src/app/(marketing)"
git commit -m "web: move blog/privacy/terms out of the marketing route group"
```

---

### Task 13: Swap the landing page and delete the old marketing surface

**Files:**
- Modify: `apps/web/src/app/page.tsx` (full rewrite)
- Create: `apps/web/src/components/marketing/cta-section.tsx` (overwrites the old file at this exact path)
- Delete: `apps/web/src/app/(marketing)/` (now contains only `about/`, `how-it-works/`, `layout.tsx` — `error.tsx` was superseded by `(content)/error.tsx` in Task 12, delete it here too if still present)
- Delete: `apps/web/src/components/marketing/about/` (entire folder)
- Delete: `apps/web/src/components/marketing/how-it-works/` (entire folder)
- Delete: `apps/web/src/components/marketing/hero-section.tsx`
- Delete: `apps/web/src/components/marketing/vision-section.tsx`
- Delete: `apps/web/src/components/marketing/how-it-works-section.tsx`
- Delete: `apps/web/src/components/marketing/elo-battle-section.tsx`
- Delete: `apps/web/src/components/marketing/leaderboard-preview.tsx`
- Delete: `apps/web/src/components/marketing/mission-section.tsx`
- Delete: `apps/web/src/components/marketing/problem-section.tsx`
- Delete: `apps/web/src/components/marketing/stats-section.tsx`
- Delete: `apps/web/src/components/marketing/qr-code-download.tsx`
- Delete: `apps/web/src/components/marketing/waitlist-form.tsx`

**Interfaces:**
- Consumes: `Navbar`, `Footer` (Tasks 10, 11); `Hero`, `TheEnemy`, `ThreePillars`, `CityLeaderboardViewer`, `AntiSlopComparison`, `SubredditReceipts`, `FaqSection`, `EarlyAccessModal` (Tasks 2–9); `IS_WAITLIST_MODE`.
- Produces: `src/app/page.tsx` default export — the site's `/` route.

- [ ] **Step 1: Confirm nothing else references the files being deleted**

```bash
cd apps/web/src
grep -rln "components/marketing/hero-section\|components/marketing/vision-section\|components/marketing/how-it-works-section\|components/marketing/elo-battle-section\|components/marketing/leaderboard-preview\|components/marketing/mission-section\|components/marketing/problem-section\|components/marketing/stats-section\|components/marketing/qr-code-download\|components/marketing/waitlist-form\|components/marketing/about\|components/marketing/how-it-works/" . | grep -v "^app/(marketing)"
```

Expected: no output (everything referencing these paths lives inside `app/(marketing)/`, which is deleted in this same task). If anything else shows up, stop and investigate before proceeding — do not delete a file something else still imports.

- [ ] **Step 2: Write the new CtaSection (real waitlist wiring, overwrites the old file)**

Read `/Users/avi/workspace/forked/forked-marketing/forked-marketing-v2/src/components/CtaSection.tsx` in full — entire section is a permanently-dark exception, keep literal hex. Overwrite `apps/web/src/components/marketing/cta-section.tsx` with the v2 markup, changing only:
- Drop `import React, { useState } from 'react';` → `import { useState, useTransition } from "react";`.
- Add `import { IS_WAITLIST_MODE } from "@/lib/waitlist"; import { joinWaitlist } from "@/app/actions/waitlist-action";`.
- `export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenEarlyAccess }) => {` → `export function CtaSection({ onOpenEarlyAccess }: CtaSectionProps) {`; trailing `};` → `}`.
- Replace the local `const [submitted, setSubmitted] = useState(false); const inWaitlistMode = isWaitlistMode();` and `handleSubmit` with:

```tsx
const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
const [message, setMessage] = useState("");
const [isPending, startTransition] = useTransition();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  startTransition(async () => {
    const result = await joinWaitlist(email, "cta-section");
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  });
};
```

- Every `inWaitlistMode` reference → `IS_WAITLIST_MODE`.
- Both success-state blocks (`{submitted ? (...`) → `{status === "success" ? (` and their `<p>` body → `{message}` (dropping the hardcoded "We saved {email}..." copy, since `joinWaitlist`'s real response message already covers this).
- Both submit buttons: add `disabled={isPending}` and swap the label for `{isPending ? "Submitting..." : "Request Invite"}` / `{isPending ? "Submitting..." : "Join Digest"}` respectively.
- Add an error line under each form: `{status === "error" && <p className="text-red-400 text-xs font-bold mt-2">{message}</p>}`.
- Everything else (badges, headline, store buttons, platform-availability strip) copied verbatim.

- [ ] **Step 3: Write the new `page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { TheEnemy } from "@/components/marketing/the-enemy";
import { ThreePillars } from "@/components/marketing/three-pillars";
import { CityLeaderboardViewer } from "@/components/marketing/city-leaderboard-viewer";
import { AntiSlopComparison } from "@/components/marketing/anti-slop-comparison";
import { SubredditReceipts } from "@/components/marketing/subreddit-receipts";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { EarlyAccessModal } from "@/components/marketing/early-access-modal";

export default function Home() {
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col selection:bg-accent selection:text-accent-on">
      <Navbar />
      <main className="flex-1">
        <Hero onOpenEarlyAccess={() => setEarlyAccessOpen(true)} />
        <TheEnemy />
        <ThreePillars />
        <CityLeaderboardViewer onOpenEarlyAccess={() => setEarlyAccessOpen(true)} />
        <AntiSlopComparison />
        <SubredditReceipts />
        <FaqSection />
        <CtaSection onOpenEarlyAccess={() => setEarlyAccessOpen(true)} />
      </main>
      <Footer onOpenEarlyAccess={() => setEarlyAccessOpen(true)} />
      <EarlyAccessModal isOpen={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </div>
  );
}
```

`CityLeaderboardViewer` is an `async` server component (Task 6) but is being rendered from a client component (`page.tsx` is `"use client"` because of the `useState` for the modal) — Next.js does not allow an async server component to be imported and rendered directly inside a client component tree in the same module graph this way for data fetching to work correctly. **Resolve this by keeping `page.tsx` itself a server component** and lifting the `earlyAccessOpen` state into a small client wrapper instead:

Create `apps/web/src/components/marketing/landing-page-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { TheEnemy } from "@/components/marketing/the-enemy";
import { ThreePillars } from "@/components/marketing/three-pillars";
import { AntiSlopComparison } from "@/components/marketing/anti-slop-comparison";
import { SubredditReceipts } from "@/components/marketing/subreddit-receipts";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { EarlyAccessModal } from "@/components/marketing/early-access-modal";

export function LandingPageClient({ leaderboardSection }: { leaderboardSection: React.ReactNode }) {
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const openEarlyAccess = () => setEarlyAccessOpen(true);

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col selection:bg-accent selection:text-accent-on">
      <Navbar />
      <main className="flex-1">
        <Hero onOpenEarlyAccess={openEarlyAccess} />
        <TheEnemy />
        <ThreePillars />
        {leaderboardSection}
        <AntiSlopComparison />
        <SubredditReceipts />
        <FaqSection />
        <CtaSection onOpenEarlyAccess={openEarlyAccess} />
      </main>
      <Footer onOpenEarlyAccess={openEarlyAccess} />
      <EarlyAccessModal isOpen={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </div>
  );
}
```

`CityLeaderboardViewer` still needs `onOpenEarlyAccess` — since it's a server component rendered from the server `page.tsx`, it can't receive a client closure directly either. **Change `CityLeaderboardViewer`'s prop from a callback to nothing**, and have its two "join"/"open app" buttons become plain anchor links to `/#leaderboards`-adjacent behavior instead: replace `onOpenEarlyAccess` usage inside `city-leaderboard-viewer.tsx` (Task 6) — go back and amend that file now:
- Remove the `onOpenEarlyAccess` prop entirely from `CityLeaderboardViewerProps` (delete the interface/prop).
- Change the "Request Beta"/"Rank in App" button and the "Join Waitlist"/"Vote in App" button and the bottom "Join Beta Waitlist"/"Open in App" button from `<button onClick={onOpenEarlyAccess}>` to `<a href="/#faq">` (linking users to the FAQ/CTA area of the page, which has the real join form) with the same classes and label logic.
- Update `apps/web/src/components/marketing/city-leaderboard-viewer.tsx`'s exported signature to `export async function CityLeaderboardViewer()` (no props) and remove the now-unused `CityLeaderboardViewerProps` interface.

Now `apps/web/src/app/page.tsx` becomes a server component:

```tsx
import { LandingPageClient } from "@/components/marketing/landing-page-client";
import { CityLeaderboardViewer } from "@/components/marketing/city-leaderboard-viewer";

export const revalidate = 600;

export default function Home() {
  return <LandingPageClient leaderboardSection={<CityLeaderboardViewer />} />;
}
```

- [ ] **Step 4: Delete the old route group and dead components**

```bash
cd apps/web/src
git rm -r "app/(marketing)/about" "app/(marketing)/how-it-works" "app/(marketing)/layout.tsx"
[ -f "app/(marketing)/error.tsx" ] && git rm "app/(marketing)/error.tsx"
rmdir "app/(marketing)" 2>/dev/null || true
git rm components/marketing/hero-section.tsx components/marketing/vision-section.tsx \
  components/marketing/how-it-works-section.tsx components/marketing/elo-battle-section.tsx \
  components/marketing/leaderboard-preview.tsx components/marketing/mission-section.tsx \
  components/marketing/problem-section.tsx components/marketing/stats-section.tsx \
  components/marketing/qr-code-download.tsx components/marketing/waitlist-form.tsx
```

If the `app/(marketing)` directory still contains files after the above (it shouldn't — blog/privacy/terms moved out in Task 12, about/how-it-works/layout/error removed here), stop and investigate rather than force-deleting.

- [ ] **Step 5: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web` from the repo root.
Expected: PASS. Then `npm run dev -w forked-web` and manually check: `/` renders the full new one-pager top to bottom, the "Join"/"Request Beta" buttons in `Hero`/`ThreePillars`/`CtaSection`/`Footer`/`EarlyAccessModal` open or submit correctly, and `/blog`, `/privacy`, `/terms` still render via `(content)/layout.tsx`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/components/marketing/cta-section.tsx \
  apps/web/src/components/marketing/landing-page-client.tsx \
  apps/web/src/components/marketing/city-leaderboard-viewer.tsx
git commit -m "web: swap in the new one-page landing layout, delete old marketing routes"
```

---

### Task 14: Update sitemap

**Files:**
- Modify: `apps/web/src/app/sitemap.ts`

**Interfaces:**
- Produces: same `sitemap()` default export shape, updated entry list.

- [ ] **Step 1: Edit the static pages list**

In `apps/web/src/app/sitemap.ts`, replace the `staticPages` array's `/about` and `/how-it-works` entries (delete them) and add `/privacy` and `/terms`:

```tsx
const staticPages: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${SITE_URL}/leaderboard`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];
```

Leave the rest of the file (dynamic leaderboard/blog page generation) unchanged.

- [ ] **Step 2: Verify**

Run: `npm run typecheck -w forked-web && npm run lint -w forked-web`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/sitemap.ts
git commit -m "web: update sitemap for revamped marketing routes"
```

---

### Task 15: Final build verification and manual walkthrough

**Files:** none (verification only)

- [ ] **Step 1: Full workspace build**

Run from the repo root: `npm run build -w forked-web`.
Expected: PASS — Next.js build succeeds, sitemap/robots generation (`next-sitemap`, per `next-sitemap.config.js`) runs without error.

- [ ] **Step 2: Manual dev-server walkthrough**

Run `npm run dev -w forked-web`, then in a browser:
1. Load `/` — confirm the full one-pager renders (marquee, hero, the-enemy, three-pillars with working variant tabs, leaderboard section, comparison table, subreddit receipts, faq accordion, CTA, footer).
2. Click a "Join"/"Request Beta" CTA — confirm the `EarlyAccessModal` opens, submit a test email, and confirm a real row lands in the `user_waitlist` Supabase table (or the appropriate "already on the list" message on a repeat submission).
3. Load `/blog`, `/privacy`, `/terms` — confirm they render with the new Navbar/Footer and correct content.
4. From `/blog`, click a Footer product link (e.g. "Dish Leaderboards") — confirm it navigates to `/#leaderboards` on the home page (not a dead in-page anchor).
5. Toggle dark mode via the Footer's `ThemeToggle` on `/blog` — confirm `Hero`/`ThreePillars`/`FaqSection`/the live-data branch of `CityLeaderboardViewer` respond to the toggle, while `TheEnemy`, `AntiSlopComparison`, `CtaSection`, `Footer`, `EarlyAccessModal`, and the marquee bar stay visually dark regardless.
6. Load `/sitemap.xml` — confirm it lists `/`, `/leaderboard`, `/blog`, `/privacy`, `/terms` (and dynamic leaderboard/blog entries), with no `/about` or `/how-it-works`.

- [ ] **Step 3: Record any issues**

If any check in Step 2 fails, fix it in a follow-up commit (do not silently patch without a commit) before considering this plan complete.

---

## Self-Review Notes

- **Spec coverage:** Routing (Tasks 12–13), new page composition (Task 13), theme convergence (Tasks 3–9 token table, Task 4/7 dark exceptions), data wiring (Tasks 2, 6, 13), env vars (no task needed — nothing to change), package.json (no task needed — nothing to add), SEO (Task 14), verification (Task 15). All eight design areas from the approved design have a task.
- **Server/client boundary fix:** the original sequencing assumed `page.tsx` could stay a single client component; Task 13 corrects this by splitting into a server `page.tsx` + client `landing-page-client.tsx`, and drops the callback prop from the async server component `CityLeaderboardViewer` accordingly. This is reflected consistently in Task 6's final signature note and Task 13's Step 3.
- **Type consistency:** `IS_WAITLIST_MODE` (not `isWaitlistMode()`), `joinWaitlist(email, source?)`, `Footer({ onOpenEarlyAccess? })`, `CityLeaderboardViewer()` (no props, post-Task-13 amendment) are used consistently across every task that references them.
