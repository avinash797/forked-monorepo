# Marketing Page Design Decisions

This document explains the rationale behind every design change made during the UI redesign of the Forked marketing pages.

---

## Design Philosophy

Forked is a **competitive food ranking platform** — not a restaurant directory or review site. The brand sits at the intersection of sports competition and food culture. The design should feel:

- **Editorial and bold** — like a sports magazine (think *ESPN The Magazine*) meets food journalism
- **Data-driven and credible** — numbers, rankings, and scores are primary content
- **Energetic but focused** — this is a competition platform, not a casual dining guide
- **Alternating dark/light rhythm** — sections alternate to create visual breathing room and prevent fatigue

Style classification: **Vibrant & Block-based** with **Editorial Grid** influences. Not skeuomorphic, not glassmorphism. Clean geometry, bold type, purposeful accent usage.

---

## Hero Section

### Stats Strip Below CTAs
**Decision:** Added three community stats (`12,000+ Dishes Ranked`, `3 Cities Live`, `48K+ Community Ratings`) separated from the CTA buttons by a subtle divider line.

**Why:** Social proof is one of the most powerful conversion tools for consumer apps. Showing real usage numbers immediately after the CTA answers the question "but does anyone actually use this?" without requiring the user to scroll. Positioned below the CTAs so it doesn't compete with the primary download action — it reinforces it.

**Rule applied:** `landing` domain — *Hero + Testimonials + CTA* pattern recommends social proof near the primary CTA. `ux` rule `primary-action` — one primary CTA per section, social proof subordinate.

### Animated Pulse Dot on Badge
**Decision:** Replaced the static `Flame`/`Zap` icon in the availability badge with a pulsing CSS animation dot (Tailwind `animate-ping`).

**Why:** The pulsing dot signals "live" or "active" — a universally understood UI convention borrowed from status indicators (Discord online dot, live broadcast indicators). It communicates availability status faster than text or a static icon and draws the eye to the badge without being distracting. Removed the Lucide icons from the badge since the dot conveys the same meaning more efficiently.

**Rule applied:** `animation` — `motion-meaning`: every animation must express cause-effect, not just be decorative. The pulse means "currently active/available."

### Noise/Grain Texture Overlay
**Decision:** Added a subtle SVG fractal noise texture overlay with `opacity-[0.025]` over the hero background.

**Why:** Flat digital backgrounds at scale can feel sterile. A barely-perceptible grain texture adds material depth without adding visual noise — the technique is standard in editorial print design (newspaper backgrounds, magazine pages). It distinguishes Forked from generic SaaS landing pages. At 2.5% opacity it is imperceptible at a glance but adds subconscious richness.

**Accessibility note:** `aria-hidden="true"` on the overlay so screen readers ignore it completely.

### Larger Background Blobs
**Decision:** Increased the ambient glow blobs from `w-[600px]` to `w-[900px]` and from `blur-[100px]` to `blur-[200px]`.

**Why:** The larger, more diffuse blobs create a cinematic ambient light effect that doesn't compete with content (they're 5–10% opacity) but makes the hero feel premium rather than flat. They also extend further off-screen, avoiding any visible edge artifacts.

### Ring Treatment on Floating Images
**Decision:** Added `ring-1 ring-border` to the floating food images.

**Why:** The faint ring creates a subtle frame that elevates the images from raw cropped photos to curated content. It also visually ties the floating images to the rest of the UI's border language.

---

## Vision Section

### Left-Border Feature Cards (replacing box-icon cards)
**Decision:** Replaced the `bg-surface-2 border rounded-xl p-4` box-icon cards with a minimal `border-l-2` left-border accent style.

**Why:** The box-icon treatment (common in SaaS feature grids) reads as generic. Left-border style is an editorial/newspaper convention that creates visual hierarchy without structural weight — it lets the text breathe while the accent border clearly delineates each item. It also scales better at small sizes and avoids the card-inside-card nesting that reduces information density.

**Hover state:** Border transitions from `border-border` to `border-accent` on hover, reinforcing interactivity without changing layout bounds.

### Gradient Blockquote Divider
**Decision:** Changed the `border-l-2 border-accent` pull quote divider to `bg-gradient-to-b from-accent to-accent/0` — a gradient that fades from orange to transparent.

**Why:** The gradient gives the pull quote a "fading authority" visual metaphor — strong at the start, dissipating. It's more editorial and refined than a flat rule. It also feels more natural at the top of the quote where the reader's eye begins.

### "THE PROBLEM" Section Label
**Decision:** Added a `THE PROBLEM` eyebrow label above the headline, replacing the lack of section context.

**Why:** Users scanning a long landing page need orientation cues. Section labels (`THE PROBLEM`, `HOW IT WORKS`, `THE MISSION`) act as navigation anchors that help users understand the narrative structure without reading everything. Consistent with the treatment in `HowItWorksSection` and `MissionSection`.

### Decorative Offset Image Frame
**Decision:** Changed the offset frame from `border border-border rounded-3xl` to `border border-accent/20 rounded-2xl` with a negative offset.

**Why:** The accent-colored frame subtly connects the image to the brand's orange color, reinforcing visual consistency. The 20% opacity ensures it reads as decoration, not interface chrome. The negative offset creates depth: the image appears to "float" above the frame.

---

## How It Works Section

### Large Ghost Step Numbers in Card Backgrounds
**Decision:** Added large (`text-[5.5rem]`), faded (`text-text-primary/5`) italic step numbers (`01`, `02`, `03`, `04`) positioned absolutely in the top-right of each card.

**Why:** This technique is borrowed from editorial sports design — large background numbers create depth, reinforce the step sequence visually, and make each card feel distinct without adding content complexity. At 5% opacity they're imperceptible until the user hovers, where they transition to `text-accent/10` — a subtle "easter egg" that rewards attention.

**Accessibility:** `aria-hidden="true"` and `select-none pointer-events-none` ensure screen readers and users don't interact with the decorative numbers.

### Circular Icon Container
**Decision:** Changed the icon container from `rounded-xl` (rounded square) to `rounded-full` (circle) with `border border-accent/20`.

**Why:** The circle is a more universal "step indicator" convention — it reads more like a numbered process step than a feature icon. The accent border at 20% opacity ties it to the brand without overwhelming the icon.

### Hover Border Accent
**Decision:** Added `hover:border-accent/30` to cards alongside the existing `hover:bg-surface-2`.

**Why:** The dual hover treatment (background change + border accent) makes the interactive state feel more substantial. The border change responds faster perceptually than background changes.

---

## Elo Battle Section

### ELO Score Delta Animation (+15 / -12)
**Decision:** Added animated score change indicators (`+15` in green, `-12` in red) with `TrendingUp`/`TrendingDown` icons that appear after voting.

**Why:** The core interaction of the battle section is demonstrating how Elo ratings work in practice — a dish wins, scores change. Without seeing the actual change happen, the concept remains abstract. The delta indicators make the mechanic concrete and satisfying. `AnimatePresence` ensures smooth entry/exit.

**Rule applied:** `animation` → `motion-meaning`: animations express cause-effect. The delta appears as a direct consequence of the vote.

### Loser Card Dimming
**Decision:** When a vote is cast, the losing card fades to `opacity-40` in addition to the winner getting the accent border glow.

**Why:** Without contrast between winner and loser, the vote outcome is ambiguous. Dimming the loser creates a clear binary outcome that communicates the zero-sum nature of Elo battles — one wins, one loses. This is standard in tournament UI (chess, e-sports).

### Contextual Hint Text
**Decision:** Added animated hint text ("Tap a dish to decide who wins this round") that transitions to "Elo scores updated in real-time" after voting using `AnimatePresence`.

**Why:** Clear instruction reduces confusion for first-time users who may not know the section is interactive. The text updates after interaction to confirm what just happened. `AnimatePresence mode="wait"` ensures smooth crossfade.

### Spring-Based Trophy Animation
**Decision:** Changed the trophy icon entrance from basic `{ scale: 1 }` to `type: "spring", stiffness: 300, damping: 20`.

**Why:** Spring physics feels more physical and satisfying — like a trophy being "slammed" down. Linear or ease-based transforms feel digital and artificial for a celebratory moment. `stiffness: 300` creates a snappy, punchy feel appropriate for a competition win.

---

## Leaderboard Preview

### Medal Colors for Top 3 Ranks
**Decision:** Applied `text-gold` (#F59E0B), `text-silver` (#9CA3AF), `text-bronze` (#B45309) to ranks #1, #2, #3 respectively. Ranks #4+ use `text-text-tertiary`.

**Why:** The gold/silver/bronze hierarchy is a universally understood podium metaphor — it communicates ranking importance instantly without explanation. The design tokens for these colors already existed in the system (`--gold`, `--silver`, `--bronze`); using them here ensures consistency with any future medal usage elsewhere (leaderboard pages, user profiles).

### Gold Gradient Row for #1
**Decision:** Applied `bg-gradient-to-r from-gold/5 to-transparent border-gold/20` to the #1 ranked row.

**Why:** The champion deserves visual distinction beyond just a colored rank number. The subtle gold gradient creates a "champion's row" treatment — high-status, visually distinct, but not garish. At 5% opacity it reads as a premium highlight, not a color block.

**Rule applied:** `visual-hierarchy` — establish hierarchy through spacing and contrast, not color alone. The gradient supplements the rank color (already conveying position) rather than replacing it.

### "LIVE RANKINGS" Eyebrow Label
**Decision:** Added a `LIVE RANKINGS` label above the section header.

**Why:** Communicates that this data is dynamic and real — not a static mock. For a data-driven app, the word "live" is a trust signal. It also gives the section proper orientation in the page narrative.

### Tabular Numbers
**Decision:** Added `tabular-nums` class to all numeric displays (ELO, scores, stats).

**Why:** Tabular (monospaced) numerals prevent layout shift as numbers change (e.g., when Elo scores update in the battle section), and create a cleaner, more data-dashboard feel. Typography rule `number-tabular` from the design system.

---

## Mission Section

### Numbered Statements with Horizontal Dividers
**Decision:** Replaced the centered stacked text layout with a left-aligned list format: large faded accent number on the left (`01`–`04`), statement text on the right, horizontal dividers separating each row.

**Why:**

1. **Horizontal dividers** create an editorial list feel — like a manifesto or editorial column. Each statement gets equal visual weight with clear separation.
2. **Left-side numbers** add structure and make the section scannable. A user can see "4 things" at a glance before reading any of them.
3. **Left alignment** on a centered page creates movement and visual interest — it breaks the monotony of centered text sections that bracket the mission.
4. **Hover accent on statement text** rewards engagement and creates subtle interactivity even in a static text section.

**Rule applied:** `visual-hierarchy` — size, spacing, and contrast over color alone. The numbers don't add meaning; they add structure.

### Accent Number Hover State
**Decision:** The large faded numbers (`text-accent/25`) transition to `text-accent/50` on row hover.

**Why:** The hover state provides subtle tactile feedback that confirms interactivity. The numbers are otherwise purely decorative — the hover state gives them a secondary function (visual confirmation of row focus).

---

## CTA Section

### App Store / Google Play Branded Buttons
**Decision:** Replaced the generic `Smartphone` icon + "Get it for iOS/Android" text with properly branded download buttons using the actual Apple and Google Play SVG logo paths.

**Why:** The original buttons were too generic — the Smartphone icon could mean anything. Platform-specific branding (apple logo, play store logo) is immediately recognizable and sets correct user expectations about where they're going. These are the two most-recognized icons in consumer mobile app distribution.

**Visual treatment:** Dark background (`bg-text-primary`) that inverts to accent orange on hover, left-aligned text with "Download on the / App Store" hierarchy.

### Social Proof Strip Below Downloads
**Decision:** Added a stats strip (`12K+ Dishes Ranked`, `48K+ Battles Fought`, `3 Cities Live`) below the download buttons, mirroring the hero stats strip.

**Why:** Closing the page narrative with the same social proof that opened it creates symmetry and reinforces the numbers on the way out. A user who scrolled all the way to the CTA section needs a final confidence boost before committing to a download. The stats provide that without being pushy.

### Consistent Stats Strip Pattern
**Decision:** The stats strip uses the same visual pattern as the hero section (`border-t border-border/60`, `font-display italic font-black`, `tabular-nums`).

**Why:** Visual consistency between page-opening (hero) and page-closing (CTA) stats creates a frame for the entire page. The user sees the same data format twice — once to establish the product, once to close the sale — without it feeling repetitive.

---

## Global Decisions

### `ease: [0.16, 1, 0.3, 1]` Custom Easing
**Decision:** Applied `[0.16, 1, 0.3, 1]` cubic-bezier easing to major entrance animations (vision section headline, image scale, CTA scale).

**Why:** This is the same easing curve used in the Expo design system for "elastic out" — it snaps quickly to the target and slightly overshoots then corrects. At the distances used (50px slides, 0.9→1 scale), it reads as confident and snappy without being cartoonish. `linear` and `ease-out` produce more clinical, corporate-feeling entrances.

**Rule applied:** `spring-physics` — prefer spring/physics-based curves for natural feel.

### No Hardcoded Hex Values in New Code
All new color references use design token utilities (`bg-accent`, `text-gold`, `border-border/60`). No `bg-[#...]` values were introduced.

**Why:** The token system already has the right values. Bypassing it would create drift between the web and mobile app's shared design language. Only dark-only sections (Navbar, Footer, Hero elements with explicit white text) use hardcoded dark values, consistent with the existing codebase.

### `tabular-nums` on All Numeric Displays
Applied consistently across hero stats, leaderboard scores, battle ELO scores.

**Why:** Numbers that change (battle scores) need tabular numerals to prevent layout shift. Numbers that don't change (stats strip) benefit from the data-display aesthetic that tabular numerals bring — they read as authoritative data, not decorative text.

---

## What Was NOT Changed

- **Navbar/Footer**: Functional, accessible, and on-brand. No changes needed.
- **Animations timing**: Existing 0.6–1s durations are within the 150–400ms micro-interaction and 400–800ms page-level range. No changes.
- **Section order**: The narrative flow (Hero → Problem → Solution → Demo → Proof → Mission → CTA) is sound. Rearranging would break the storytelling.
- **Color tokens**: The existing token system is well-designed. No new tokens were introduced.
- **Font families**: The display/sans pairing works for the editorial bold style. No changes.

---

## Round 2: Brand Voice & Copy Overhaul

After reviewing `product_description.md`, the visual design was solid but the copy was not aligned with the product's brand voice. The product description articulates: *"Forked sounds like a friend who knows where to eat, not a tech company trying to disrupt dining."* The original copy explained the product; it did not argue for it.

### The Three Biggest Gaps Found

1. **The founding insight was absent.** "The most useful food recommendation is not 'go to this restaurant.' It's 'order the gumbo at Dooky Chase.'" — this is the core of the entire product. It appeared nowhere on the page.

2. **The controversy hook was missing.** The product description explicitly states: "Food arguments drive downloads. Controversy is the growth engine. 'Disagree? Download Forked and vote.'" This mechanism — controversy → argument → download → vote → ranking changes → more controversy — appeared nowhere.

3. **The anti-corporate trust signals were buried.** "Not sponsored. Not paid. The only way to climb is to serve better food." is the most differentiating thing about the product. It appeared only in the FAQ (How It Works page), not on the landing page.

---

### Hero Section Copy Decisions

**Subheadline:** "Not 'go to this restaurant.' Get the gumbo at Dooky Chase. Dish-level rankings from real head-to-head battles, verified by photos. Under 30 seconds to vote."

**Why:** Three brand pillars in one sentence: (1) founding insight stated directly, (2) photo-as-proof verification, (3) "under 30 seconds" speed signal that differentiates from long-form review apps. The Dooky Chase reference is specific to New Orleans — the launch market — and makes the product feel local rather than generic.

**Stats "Cities Fighting" / "Battles Decided":** "Cities Live" sounds like a status dashboard. "Fighting" is in-universe language that reinforces the competitive frame. "Battles Decided" vs. "Community Ratings" — "ratings" is neutral app-speak; "battles decided" implies consequence and permanence.

**Secondary CTA "SEE WHO'S WINNING":** "Explore Leaderboards" is passive exploration. "See Who's Winning" creates urgency and implies there is something to witness — a live competition, not a static directory.

**Scroll hint "Settle the argument":** Plants the core hook on the first interaction — before the user has scrolled anywhere.

---

### Vision Section Copy Decisions

**Headline "Nobody Eats a Restaurant.":** The product description says to lead with the founding insight. "Google Reviews Are Broken" attacks a competitor, which is weaker than reframing the problem from first principles. "Nobody eats a restaurant" is a truth the user already believes — it enrolls them in the argument before making any product claim.

**Body copy with Dooky Chase reference:** The original copy used generic examples ("a 4.8-star steakhouse," "a hole-in-the-wall with 3 stars"). The new copy names a real New Orleans institution (Dooky Chase) which: (a) signals the product is local and authentic, (b) is specific enough to be memorable, (c) creates an image in the user's mind rather than an abstract comparison.

**Pull quote "The hole-in-the-wall with the best gumbo in the city is losing to a steakhouse with a valet.":** The original quote ("We value the sweat, the seasoning, and the craft") was poetic but unclear about what was being criticized. The new quote has a specific villain (the steakhouse with a valet), a specific victim (the hole-in-the-wall), and a specific injustice (the valet-haver is winning). It creates immediate recognition for anyone who has been burned by inflated ratings.

**Feature cards "Not Sponsored. Not Paid." and "Under 30 Seconds to Vote":** These two trust/speed signals were buried in copy elsewhere. Making them feature card labels gives them visual weight and scannable prominence — users who skip body copy will still see them.

**Image overlay "THE HOLE-IN-THE-WALL WINS HERE." / "THE 4.8-STAR TRAP":** "The Overhyped Spot" was vague. "The 4.8-Star Trap" is specific, immediately recognizable to anyone who has been disappointed by a highly-rated restaurant, and creates micro-copy that communicates the entire problem in 4 words.

---

### How It Works Copy Decisions

**Headline changed to "EAT. SNAP. BATTLE. RANK.":** Step 03 was renamed from "Compare" to "Battle" throughout. "Compare" sounds like a spreadsheet exercise. "Battle" is the actual verb used everywhere else in the product (battle section, battles decided, etc.). Consistency between section headline and step title matters.

**Step 02 "Anyone can leave a number — not everyone can prove they showed up.":** The original copy said "This is your proof." The new version explains *why* the proof requirement is different from every other app: ghost reviewers cannot fake a photo. This is a trust differentiator, not just a product rule.

**Step 04 "The argument is settled.":** This is the payoff of the "Settle the argument" hook planted in the hero scroll hint. The page narrative threads from "Settle the argument" (hero) through the steps to "The argument is settled" (step 04). Narrative closure increases conversion.

**Section subtitle "From the table to the leaderboard. Under 30 seconds.":** "Four simple steps to find the best food in your city" is generic. The new version quantifies the experience (30 seconds), establishes the journey metaphor (table → leaderboard), and is specific to what makes the product different.

---

### Battle Section Copy Decisions

**Headline "You Have An Opinion. Prove It.":** "Forget 5 Stars. Welcome to the Arena." was reasonably punchy. But the new headline directly addresses the user and challenges them — it is more personal, more confrontational, and sets up the interactive demo as a test of the user's conviction rather than just a product demo.

**Body copy removal of "just like chess or competitive gaming":** The product description's target users are local food obsessives and tourists. Comparing the rating system to chess or competitive gaming is the wrong cultural reference for a food app audience. The new copy explains the mechanic in plain language: "you pick which dish wins, head-to-head. Points transfer from the loser to the winner."

**Hint text "You already have an opinion. Pick one.":** "Tap a dish to decide who wins this round" is instruction. "You already have an opinion. Pick one." is an argument. The latter implies the user is already invested — it removes the friction of "I don't know these dishes" by asserting that the user's food intuition is valid.

**"That's your vote. It counts.":** Post-vote, the user needs to feel that their action had consequence. "Elo scores updated in real-time" is technical confirmation. "That's your vote. It counts." is emotional confirmation — it makes the experience feel consequential, not just mechanical.

**"FIGHT AGAIN":** "Reset Battle" is interface language. "Fight Again" is sports/game language consistent with the competitive frame.

---

### Leaderboard Section Copy Decisions

**Headline "The Real List.":** "The Champions Wall" sounds like a trophy case — static and closed. "The Real List" activates the third brand pillar directly ("The real list. Not sponsored. Not paid.") and implies that other lists are fake. It is also shorter and more confident.

**Subtitle "Not sponsored. Not paid. The only way to climb is to serve better food.":** This is the highest-trust claim the product can make. Placing it directly under the ranking headline means any user who pauses to look at the rankings immediately understands why this list should be trusted over Yelp, Google, or any other platform. Bury it in the FAQ and it's wasted.

**CTA "Disagree with this list? Download Forked and vote. Your battles change the ranking.":** This is the controversy-as-CTA mechanic the product description explicitly identifies as the growth engine. The user has just looked at a ranked list. They have opinions about it. The CTA gives those opinions a consequence (download, vote, change the ranking). It is the most direct implementation of "Disagree? Download Forked and vote." as a conversion mechanism.

---

### Mission Section Copy Decisions

**Label "WHY WE BUILT THIS":** "THE MISSION" is standard startup-speak. "Why we built this" is how a founder talks. It is personal, direct, and sets up the following statements as genuine convictions rather than marketing pillars.

**Statement 1 "Nobody eats a restaurant. They eat a dish.":** The founding insight as the first manifesto statement. It works here because this section is the deepest scroll point — users who reach it have opted in to understanding the product. The founding insight lands harder here than in the hero where users are still orienting.

**Statement 2 "The best gumbo in the city might have 3 stars. We fix that.":** More specific than "Never wonder where to eat again." It names the injustice (3 stars for the best gumbo) and takes ownership of fixing it. "We fix that" is confrontational in the right way.

**Statement 3 "Not sponsored. Not paid. Not filtered. Just real battles.":** The trust signals get their own manifesto statement. This is appropriate given that "not paid" is the most differentiating thing about the product's ranking integrity.

**Statement 4 "Your argument is data. Your vote changes the list.":** This empowers the user as the mechanism of the product rather than as its beneficiary. "Push chefs to compete" (original) positions the user as an activator of supplier behavior. "Your vote changes the list" positions the user as an owner of the rankings. The latter is more motivating for a consumer app.

---

### CTA Section Copy Decisions

**Headline "The Argument's Not Over.":** "Ready to Fork?" is a pun that works but asks a permission question ("are you ready?"). "The Argument's Not Over" is a statement that implies: (a) the ranking is live and contested, (b) the user's participation is needed, (c) there is urgency. It closes the narrative loop: the hero says "Settle the argument," and the CTA says "the argument's not over — your vote is still needed."

**Subtitle "Someone in your city is wrong about the best dish.":** This is the controversy hook stated directly. It creates a villain (the wrong ranker), a stakes (the list is incorrect), and implies the user can do something about it. "Download Forked today and start pushing the best dishes to the top of the leaderboard" is passive and vague. The new version is specific, adversarial, and more motivating.

**"Arguments Settled":** "Battles Fought" was already in-universe language. "Arguments Settled" maps to the CTA's controversy frame — completing the "settle the argument" thread that runs from the hero scroll hint through the section.
