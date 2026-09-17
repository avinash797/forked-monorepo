# FORKED — Brand Strategy Document

**Product:** Forked — iOS and Android app, with a web companion at forkedapp.com
**Version:** 0.2 — September 13, 2026
**Status:** Draft, aligned to the current app build (v0.1.0, near-complete). Assumptions and open decisions in §12.
**Purpose:** The single source of truth for how we describe, position, and present Forked. Marketing, design, product, and sales decisions should trace back to this document. If something built later doesn't match what's here, either the work drifted or this document needs a revision — not both.

**What changed from 0.1.** This revision was rewritten against the app as built, not the intake conversation. The strategic spine survives intact: the dish is the main character, battles not stars, the city decides. What changed: the rating vocabulary now matches the product (Liked it / It was okay / Didn't like it); the ranking math is described as it actually ships (Elo-derived personal scores, credibility-weighted community scores with confidence tiers) instead of the earlier "normalize, don't average" claim; the score out of 10 is acknowledged rather than denied; shipped features that didn't exist at intake are folded into the pillars (Discover, Rising Stars, the battle ticker, taste tags on dish pages, city unlocking, Best Ever, badges, share cards); and a new §3 inventories exactly what exists so no team promises what isn't there. Three places where the app's own copy contradicts this document are listed in §12 for a decision.

---

## 1. Executive summary

Forked is a mobile app that settles the argument every city has: where the best version of a specific dish actually is. You pick the restaurant, pick the dish, and say how it was — liked it, it was okay, didn't like it — with an optional photo, taste tags, and a note. Forked then runs a short series of head-to-head battles against dishes you've already rated in that category ("Which Po'Boy wins?"), and turns your answers into a score and a ranked list for that dish. Across everyone in a city, those battle-derived scores become one public leaderboard per dish — *Best Po'Boys in New Orleans* — with a confidence label on every entry that says how much data is behind it.

It's built for the person whose whole personality is one dish — the pizza partisan, the po'boy loyalist — who currently argues in Facebook groups and subreddits with no way to win. Tourists and newcomers benefit second: when they land in New Orleans and want the best po'boy, Forked is the app to open.

The core promise: **the dish is the main character.** Not the restaurant, not the ambiance, not the influencer. The enemy is the five-star average, which flattens a thousand restaurants into a 4.1-to-4.5 blur and buries a hole-in-the-wall with a transcendent lunch pizza under its own mediocre service reviews.

Where Beli ranks restaurants and dish-tracking apps ask you for an absolute score, Forked never asks for a number: you compare, and the number is computed. Today the product is a working iOS/Android app with personal rankings anywhere in the US, city leaderboards that unlock as a city reaches critical mass (New Orleans first), a Discover feed of champions and rising stars, and share cards built for ending threads. Personality in one line: **opinionated, unfussy, and here to end the debate.**

---

## 2. The idea, in the founder's words

Lightly edited from Avi's intake; vocabulary preserved on purpose.

> The idea came from scrolling Facebook groups and subreddits for New Orleans and seeing the same post over and over: "What's the best pizza in the city?" "Best burger?" A hundred comments, fifty different places. There's no single source of truth. There are influencers — one guy going around giving pizza scores — but that's one person with one palate, and they're getting the food for free, so they're kind of obliged to say something nice.
>
> The five-star system is broken. A thousand places sit between 4.1 and 4.5. A casual lunch spot might have three stars overall but make a genuinely great pizza, and it'll never show up when you search "best pizza near me." Hole-in-the-wall places with ten ratings never surface at all.
>
> In Forked, users look up a place, pick the dish and its variant — pepperoni, margherita, chicken sandwich, BLT — and say: bad, okay, or great. They can add notes, images, tags. The next time they eat that dish somewhere else, they rate again and then battle it against what they've already ranked. Over time that builds their personal top five, top ten. Across many users, we normalize — not average — into a mathematically honest ranking of the best pizza, best burger, best jambalaya in a city.
>
> The difference from classical ranking: there, the restaurant defines the dish. Here, the dish is the main character and just happens to be served at a certain restaurant. It's not "go to XYZ for good pizza." It's "get the margherita at XYZ."
>
> Long term: a taste graph for each user, built from their ranking history and their tags — liked it spicy, didn't like it oily — so recommendations get personal.
>
> Forked should be the place to settle the debate. Beli does for restaurants what Forked does for dishes. Beli is a bit fancy; Forked doesn't care about appearance. It cares about one thing: does this pizza beat that one.

*Note for 0.2:* the intent above is fully intact in the build. Two details evolved in implementation and the rest of this document follows the build: the community score is a credibility-weighted, confidence-labeled combination of battle-derived scores rather than a strict "normalize, not average" (see §3.3), and variants are tracked on your rating but battles and leaderboards run per dish type (see §3.1).

---

## 3. The product today (v0.1.0, September 2026)

Written from a read of the mobile codebase. This is the section to check before promising anything in copy.

### 3.1 The core loop: Rate → Battle → Rank

1. **Pick the restaurant.** Nearby places are listed first, sorted by GPS. Search covers Forked's own database plus Google Places, so any restaurant in the US can be rated on the first try; a manual-add fallback exists for the rest.
2. **Pick the dish.** A curated list of dish types, with the city's signature dishes surfaced first ("Popular in This City"), then everything else. Dishes already rated at that restaurant appear on top ("Most Rated Here"). A variation (roast beef vs. shrimp po'boy, margherita vs. pepperoni) can be attached — it's tracked on your rating and shown on the dish page, but battles and leaderboards run per dish type.
3. **Say how it was.** Three choices: *Liked it! / It was okay / Didn't like it.* Optional: one photo (camera or library, with the in-app note "Adding a photo will add weight to your rating"), up to five taste tags drawn from a per-dish-type list, and a free-text note. That is the only input the scoring ever takes from you. No numbers, no stars — a hard rule in the codebase, not just a style choice.
4. **Battle.** If you've already rated other dishes of that type with the same sentiment, Forked pairs the new one against them, binary-search style: "Which Po'Boy wins? Step 2 of 3." Photo versus photo; tap the winner. At most ⌊log₂N⌋+1 comparisons, so ten prior po'boys means four taps. Skip ends the battle. Battles only ever happen within one dish type and within one sentiment zone — a "liked" gumbo never fights a "didn't like" gumbo.
5. **Rank.** Every comparison updates a score for both dishes immediately. Your list for that dish reorders on the spot. Re-rating the same dish at the same place replaces the old entry and re-runs battles; the dish page asks "Has your opinion changed?" first.

### 3.2 What you see

**Discover (home).** A location pill (your city, or *Nearby* when you're far from an unlocked city), a search bar that reads "What are you craving?", a live ticker of other people's battles ("@marcus picked Parkway over Domilise's · Po'Boy · 2 hours ago"), **Popular among Users** — the #1 dish per type in your area, requiring five or more ratings and hiding places you've already rated so it's always somewhere new — and **Rising Stars** — dishes scoring 7.5 or better on only two to nine ratings, with a "Be an early reviewer!" nudge.

**Leaderboard.** *Best Po'Boys in New Orleans.* Top ten per dish type per city, dish pills ordered by activity, each row with rank (medals for the top three), photo, neighborhood, rating count, confidence tier, and score. A share button exports a Top-5 card.

**Your Dishes.** Your full ranking per dish type: rank, photo, variation, your sentiment, score, date. Shareable as "My top Po'Boys ranked on Forked."

**Dish page** (one dish at one restaurant). Hero photo, community score, confidence tier, rating count, variations offered, the crowd's most-cited taste tags, a photo gallery drawn from raters, your own rating in plain English ("You liked this po'boy, and described it as crispy and messy. You noted: …"), and a "Rate This Dish" / "Update Rating" button.

**Restaurant page.** Google-sourced details (type, address opening in Maps, phone, website), photos, every dish rated there with its score, and "Rate a Dish Here."

**Profile.** Avatar, display name, @username, home city, bio; three stats — dishes · cities · battles; **Your Best Ever** — your top dish in each category, shareable ("My best Gumbo? Dooky Chase in New Orleans! Scored 8.7/10 on Forked"); and **Badges**, awarded server-side with a celebration modal.

**Onboarding.** Four slides, already on-brand: *Rank Dishes, Not Restaurants* ("Because a 3-star dive can have the best po'boy in the city.") · *Ditch the Stars, Choose the Winner* ("Play a fast, head-to-head game. Which dish actually wins?") · *Snap a Photo to Prove It* ("No fake ratings. If you didn't take a picture, you weren't there.") · *Find the Definitive List* ("See the #1 ranked dishes near you in under 30 seconds.").

### 3.3 The math, as shipped

**The one line for users:** You never give a number. Your battles produce your score; the city's score is everyone's battle scores combined, weighted toward people who've rated more, and labeled with how much data is behind it.

**The version for the team:**

- *Personal.* Your sentiment sets a starting score band; each battle moves both dishes with an Elo update whose step size shrinks as a dish accumulates comparisons. Scores are clamped to the band, so a "liked" dish always shows 7.0–10.0, an "okay" dish 4.0–6.9, a "didn't like" dish 1.0–3.9. The badge is green, yellow, or red by band.
- *Community.* A Bayesian average of raters' scores, weighted by each rater's credibility (which grows with the log of their total ratings and caps at 1.0), with photo-backed ratings weighted 1.25×, and shrunk toward the city's mean for that dish type until enough ratings arrive. Leaderboard entries need a minimum number of raters (a server-side constant).
- *Confidence tiers* by rating count: **New Entry** (under 5) · **Emerging** (5–9) · **Established** (10–24) · **Verified Champion** (25+). Shown as a pill on every leaderboard row and dish page.

**Why this matters for the brand.** The 0.1 draft promised "normalized, not averaged." The shipped system is a weighted, shrunk average of battle-derived scores. The claims that still hold, and that we lead with: no star input, ever; one palate can't dominate (credibility cap, Bayesian shrink toward the mean); low-volume places surface with an honest *New Entry* or *Emerging* label instead of being buried; and the number on the badge came from comparisons, not from a form. Don't say "we don't average." Say "we don't average stars."

### 3.4 Geography

US-wide from day one: rate a dish anywhere and it always counts toward your personal rankings. Public leaderboards are per city and unlock when a city crosses an activity threshold, evaluated nightly. Until a city unlocks, users there see a *Nearby* view on Discover (about a two-mile radius). Neighborhood filtering is built but hidden until it's ready. New Orleans is the launch city; per-city "known dish" lists (po'boy, gumbo, and so on) drive the "Popular in This City" ordering and are how the signature-dish wedge (§6) is expressed in the product.

### 3.5 Trust, safety, and platform

Sign in with Apple, Google, or email; 13 and up. Report a photo (inappropriate, offensive, spam, other) or block a user from any dish or restaurant page; zero-tolerance terms; account deletion in-app. Offline-aware: cached leaderboards and rankings show with an offline banner, while rating and battling need a connection. Light, dark, or system theme. Haptics on battle start and every tap. A store-review prompt after five completed ratings, no more than monthly. Amplitude analytics. Web: forkedapp.com is a "coming soon" page with a live "Champions Wall" sample leaderboard, backed by a CDN-cached public leaderboard API that the app also uses.

### 3.6 Not built — don't promise it

- **Taste graph and personalized recommendations** ("people like me"). Taste tags are collected and shown per dish; nothing learns from them yet.
- **Social graph.** No follows, friends, feeds, or comments. The battle ticker is the only community-visible activity.
- **Neighborhood, state, or country leaderboards.** Neighborhood is built and hidden; the others don't exist.
- **GPS-verified ratings.** Location sorts nearby restaurants and sets your city; it does not gate whether you can rate. The repository README claims otherwise — see §12.
- **Mandatory photos.** Photos are optional and weighted. The onboarding slide and the website say otherwise — see §12.
- **Charms** (mentioned in the README; stubbed), restaurant-side tools, monetization.

---

## 4. Problem and opportunity

### The problem (from the audience's side)

"I know what I think the best po'boy in the city is, and I'd fight anyone about it — but there's nowhere that argument gets *counted.* Every 'best X' thread is fifty opinions and zero resolution. Star ratings tell me a restaurant is fine on average, not whether its one great dish is worth the trip. And I don't trust an influencer who ate for free."

### The current alternatives

| Alternative | What it gives | Where it fails the audience |
|---|---|---|
| Facebook groups / subreddit threads | Passionate, local, dish-specific opinions | No memory, no tally, no ranking. The debate restarts every week. |
| Google / Yelp star ratings | Ubiquitous, easy | Restaurant-level averages. Compress everything to 4.1–4.5. Service complaints bury great dishes. Low-volume places never surface. |
| Food influencers (e.g., a touring pizza reviewer) | A single strong opinion, entertaining | One palate. Comped meals create a soft obligation to be positive. |
| Beli | Pairwise ranking, social, gamified | Ranks *restaurants*, not dishes. Apples-to-oranges comparisons (BBQ vs. brunch). Skews toward reservation culture and appearance. |
| Dish-tracking apps (Savor, DishView, Crumble, etc.) | Dish-level logging with scores | Absolute scores, mostly private journaling. Don't produce a city-level verdict. Thin coverage outside major metros. |
| Personal memory / notes app | Free | Doesn't scale, doesn't compare, doesn't settle anything. |

### Why now

- Beli proved that a pairwise "which did you like more?" mechanic is something a mass audience will do for fun, and that a food-ranking app can spread socially. The mechanic is now familiar; the audience doesn't need to be taught it.
- Trust in aggregate star ratings and in sponsored influencer reviews is visibly eroding — the "is Yelp broken?" conversation is mainstream.
- Local food identity is a live cultural topic: cities argue about their signature dishes in public, constantly, and those arguments already happen in searchable, joinable online communities.
- On-device photo capture, geolocation, and place APIs make a dish-level rating a few taps rather than a chore — and Forked's build confirms it: restaurant, dish, one sentiment tap, a handful of battles.

### The opportunity

Nobody has combined the three things the audience wants: **dish-level focus**, **ranking by comparison instead of scoring**, and a **public, city-wide verdict**. Beli has the mechanic but the wrong unit; dish apps have the unit but the wrong math and no public answer. Forked owns the intersection — and, as of this build, the intersection exists and works.

---

## 5. Target audience

### 5.1 Primary audience: the dish partisan

The person with a strong, specific, defended opinion about one dish in their city. Not a generalist "foodie" — a *pizza person*, a *po'boy person*, a *burger person*. They already:

- Post or comment in "best X in [city]" threads, and get annoyed when the thread goes nowhere
- Have a mental top-three they'll recite unprompted
- Will drive across town to try a rumored contender
- Judge a restaurant by one plate, not by décor or service
- Distrust ratings that don't distinguish the great slice from the mediocre salad at the same place

**Trigger to reach for Forked:** they just ate the dish somewhere new and immediately want to place it — "better or worse than my usual?" Or they're mid-argument and want ammunition.

**Fear:** that the app is another tourist-grade "top 10" list, or that it's a status game for people who can afford tasting menus.

**How they'd recommend it:** "It's the app that finally ranks pizza against pizza. My top five is on there. Come fight me."

**Where to find them:** city subreddits, neighborhood Facebook groups, local food Discords and group chats, comment sections under local food influencer posts, restaurant-industry friends.

### 5.2 Secondary audiences (ranked)

1. **The visitor with one meal to get right.** Tourists and newcomers who want the city's best version of its signature dish. They *consume* the leaderboard rather than build it. Messaging to them is about trust and speed: "the locals already settled this." In the product they live on Discover and Leaderboard, and the web Champions Wall (once live) is their no-install entry point. They matter because they're the reason the leaderboard needs to be public and legible, not just a private ranking.

2. **The casual rater.** People who like Beli-style ranking as a habit and want it to be about what they ate. They contribute volume, and the product rewards them for it: badges, the battles stat, Best Ever cards. Messaging is about the satisfying quick rating and the personal ranking.

3. **Small restaurants with one great dish.** Not users, but beneficiaries — and eventually advocates. Rising Stars is the feature built for them: a three-star lunch spot with a 7.9 gumbo on four ratings gets a card on every local's home screen with "Be an early reviewer!" underneath. No messaging to them yet; they're a future channel, not a launch audience.

### 5.3 Who this is NOT for

- People who want a restaurant score, an ambiance rating, or a reservation flex. Beli exists.
- People who want to write long reviews about service and parking. Yelp exists. (Notes on a rating are a sentence, not a review.)
- Influencers seeking a platform to publish comped verdicts. Community scores are credibility-weighted and shrunk toward the mean precisely so that no single palate — paid or not — dominates.
- People who need a photo-first food diary with AI tagging. The dish-journal apps do that better, and Forked shouldn't chase them.
- Anyone who wants the app to tell them a dish is good because the restaurant is fancy. Appearance is not an input.

### 5.4 Personas

*Names and details are illustrative.*

**Marcus — the po'boy partisan**
Lives in Mid-City, New Orleans; has argued roast beef po'boys in a neighborhood Facebook group for years.
- **Job-to-be-done:** "I want my ranking to count for something and I want to know if I'm right."
- **Trigger:** A new spot opened and everyone's saying it's better than his longtime favorite. He goes, eats, and wants to place it *immediately.*
- **Current workaround:** Comments, mental list, the occasional Notes-app entry he never looks at.
- **Objections:** "Is this another influencer thing? Will it be full of tourists ranking Bourbon Street?" Also: "Do I have to rate the whole restaurant? I only care about the sandwich."
- **What the build gives him:** Rates the new spot's roast beef, battles it against his four ranked po'boys in three taps, sees it land at #2. Opens the city leaderboard, sees his #1 is the city's #1 with *Verified Champion* under it, shares the Top-5 card into the thread.
- **Where he is:** r/AskNOLA, neighborhood Facebook groups, local food group chats.

**Priya — the pizza person who travels**
Lives in Brooklyn, travels for work, has a pizza ranking in every city she's spent a week in.
- **Job-to-be-done:** "Keep one running ranking of every slice I've had, and tell me where to go when I land somewhere new."
- **Trigger:** New city, one free night, doesn't want to waste it on a 4.3-star place that's fine.
- **Current workaround:** Google Maps saved list, Beli (frustrated it ranks the whole restaurant), asking locals on Reddit.
- **Objections:** "Will the leaderboard be empty in a mid-sized city?" "Is rating fast enough that I'll actually do it?"
- **What the build gives her:** Her personal ranking works in any US city from her first rating, whether or not that city's leaderboard has unlocked. Where it hasn't, Discover falls back to Nearby. Her Best Ever card is the thing she sends her group chat.
- **Where she is:** Beli, r/pizza, city subreddits, food Instagram.

**Dev — the visitor**
In New Orleans for three days for a conference. Wants one great po'boy and one great gumbo. Doesn't want to build anything.
- **Job-to-be-done:** "Just tell me where locals actually go, by dish."
- **Trigger:** Lands, searches "best po'boy New Orleans," gets fifty conflicting listicles.
- **Current workaround:** Google's top result, hotel concierge, a friend of a friend.
- **Objections:** "Why should I trust this over Google?"
- **What the build gives him:** Opens Discover, sees the #1 po'boy card with its neighborhood and *Established · 18 ratings*, taps into the leaderboard, goes to #2 because it's closer, and it's great. Tells the next person. Once forkedapp.com's Champions Wall is live, he doesn't even need the app.

---

## 6. Competitive landscape

Research done September 2026 via web search; sources in the appendix.

| Player | What they claim | Who they serve | Where they're weak (for our audience) |
|---|---|---|---|
| **Beli** | Rank your restaurants, see friends' rankings, get recs | Gen-Z / young professionals, reservation culture, social flex | Restaurant-level unit; users themselves complain it forces apples-to-oranges comparisons across cuisines and occasions. Skews polished and status-driven. |
| **Yelp / Google Maps** | Everything about every place | Everyone | Five-star averages compress into a 4.1–4.5 band; a great dish is buried under service reviews; low-volume places never surface. |
| **Savor / DishView / Crumble / Dishcision** | Rate the plate, not the place | Serious loggers, photo-diary keepers, major-metro users | Absolute scores rather than comparison; private-journal orientation; Dishcision's coverage is thin outside big cities. None produces a clean "who won" for a city. |
| **Food influencers** | "I tried every X in the city" | Entertainment audiences | One palate, comped meals, no mechanism for the crowd to disagree. |
| **Local Reddit / Facebook** | The real argument | Locals | No resolution, no memory. This is Forked's *acquisition channel*, not a competitor. |

### Category conventions

- Ratings apps default to a numeric scale (stars or 1–10), presented as a decimal average.
- The restaurant is the primary object; dishes are tags or photos hanging off it.
- Discovery is social-graph-first ("your friends liked…") and increasingly status-flavored (reservations, tasting menus, "food resume").
- Brand aesthetics skew clean, editorial, and aspirational — the look of a lifestyle magazine.

### Where we can win

- **Unit:** the dish, with variations recorded for the recommendation ("get the roast beef at Parkway"), so comparisons are always like-for-like. This directly fixes the most-cited Beli complaint, and it's shipped.
- **Math:** you never type a score; battles produce it, and the community number carries a confidence label. Nobody else in the category shows *how much* data sits behind a rank. This is the anti-star claim, and it's ours to explain in plain language (§3.3).
- **Output:** a public, city-level leaderboard per dish — a *verdict*, not a feed — plus share cards designed to be dropped into the thread that started the argument.
- **Tone:** unfussy and argumentative rather than aspirational. The category is dressed up; Forked can show up in a t-shirt.
- **Wedge:** cities with a signature-dish identity (New Orleans po'boy, New York slice, Chicago deep dish, Nashville hot chicken). These places already argue; Forked gives the argument a scoreboard, and the product's per-city known-dish lists and city-unlock mechanic are built for exactly this rollout.

---

## 7. Positioning

### 7.1 Positioning statement

> For **dish partisans** — people with a strong, defended opinion about a specific dish in their city — who **just ate it somewhere new and want to know where it ranks**, **Forked** is the **food ranking app** that **ranks dishes against dishes and turns the whole city's battles into one leaderboard.** Unlike **Beli and star-rating apps**, we **make the dish the main character — never the restaurant, never the décor, never the influencer.**

### 7.2 The enemy

**The five-star average.** We believe a great margherita shouldn't be hidden behind a 3.4 because the parking is bad and the salad is boring. A rating that can't tell a transcendent slice from a decent one is not information. Forked exists to replace "this restaurant is 4.2" with "this is the third-best pizza in the city, here's the variation to order, and here's how many people have weighed in."

A second, quieter enemy: **the comped verdict.** A ranking should belong to the people who paid for the food.

A note on precision, because the product now shows a number: Forked *does* combine opinions — a leaderboard is a combination of opinions. What it never does is take a star or a score as input, weight every rater the same, or hide how thin the data is. The enemy is the star average, not arithmetic.

### 7.3 Category decision

**Claim an existing category and reframe it.** Forked is a "food ranking app" — the phrase people already search and the phrase Beli established. We don't invent a category ("taste engine," "dish arena"); the audience would have to learn it before they could want it. Instead we reframe *what gets ranked*: dishes, not places. "Beli for dishes" is an acceptable shorthand in early conversations because it's instantly understood, but it should never appear in our own copy — it makes us a derivative, and our unit, our confidence labels, and our public leaderboard are genuinely different.

### 7.4 Options considered

- **"The honest food ratings app" (anti-influencer, anti-Yelp trust play).** Rejected as the *lead*: trust is a supporting pillar, but leading with it makes Forked a complaint about other apps rather than a thing with its own identity. Also, "honest" is unfalsifiable and everyone claims it. The confidence tiers are the *proof* of honesty; they aren't the headline.
- **"Your personal food ranking" (Beli-style self-tracking, dish-level).** Rejected: this collapses into the dish-journal category (Savor, Crumble) and gives up the public verdict, which is the most distinctive and most shareable thing Forked does. Your Dishes and Best Ever are supporting features, not the point.
- **"Settle the debate" as a category-creating stance (Forked as a voting/argument product).** Kept as the *promise and tagline territory*, but not as the category. It's what Forked does; "food ranking app" is what Forked is.

---

## 8. Value proposition and messaging hierarchy

### 8.1 Core promise

**Forked tells you where the best version of a dish actually is — decided by the people who ate it, ranked dish against dish.**

### 8.2 Messaging pillars

Every proof point below is shipped unless marked otherwise.

**Pillar 1 — The dish is the main character**
*Claim:* Find the best po'boy, not the best "sandwich place."
*Proof points:*
- Every rating is one dish type at one restaurant, with the variation you ate recorded on it, so comparisons are always like-for-like and the recommendation reads "get the roast beef at Parkway," never "go to Parkway."
- Leaderboards, Discover cards, search results, and the dish page all treat *a dish at a place* as the object. The restaurant page is a list of its dishes and their scores — there is no restaurant score anywhere in the app.
- A three-star lunch spot with a great gumbo shows up on the gumbo leaderboard, because the leaderboard doesn't know or care about the restaurant's star average.

**Pillar 2 — Battles, not stars**
*Claim:* You never give it a number. You pick which one wins.
*Proof points:*
- Three-way rating (Liked it / It was okay / Didn't like it), then quick head-to-head battles against dishes you've already rated in that category — "Which Po'Boy wins?" — photo against photo, a few taps.
- Your score and your ranked list are computed from your battles. There's no star anywhere in the product; the codebase forbids the symbol.
- Battles are fair by construction: only within a dish type, only within a sentiment zone, at most a handful per rating. Skip is always available.
- Re-rating is welcome. Changed your mind? Rate it again and battle again; the old entry is replaced.

**Pillar 3 — The city decides**
*Claim:* One leaderboard per dish per city, built by locals who paid for their food — and it tells you how sure it is.
*Proof points:*
- Public leaderboards per dish per city, top ten, with a confidence tier on every row: New Entry, Emerging, Established, Verified Champion. No other app in the category shows the size of the crowd behind a rank.
- Community scores are weighted toward raters with a track record and shrunk toward the city mean while data is thin, so one loud palate — comped or not — can't own the board. Influencers can rate like anyone else; they count as one.
- Rising Stars puts places with two to nine ratings and a high score in front of everyone, so volume is not a prerequisite for being found.
- Share cards for the city Top 5, your personal Top list, and your Best Ever — each with the forkedapp.com footer — are the link you send to end the thread. The battle ticker on the home screen shows the city arguing in real time.

*Future pillar (not for launch messaging): "It learns your palate."* The taste graph becomes a fourth pillar once it exists. Taste tags are already collected on every rating and shown as the crowd's description on the dish page ("crispy, messy, spicy"), which is the honest way to talk about tags today. Don't promise recommendations yet.

### 8.3 Elevator pitches

**10-second:** Forked is the app that ranks dishes, not restaurants — you battle the po'boy you just ate against the ones you've had, and the whole city's battles become one leaderboard for the best po'boy in town.

**30-second:** Every city argues about its best pizza, best burger, best po'boy, and the argument never ends because nobody's keeping score. Star ratings don't help — they rate the whole restaurant, and a thousand places sit between 4.1 and 4.5. Forked fixes the unit and the math. You rate a dish — liked it, it was okay, didn't like it — then pick head-to-head against dishes you've already rated. That gives you your own ranking for every dish you care about. Across everyone in a city, Forked combines those battle-derived scores into one leaderboard per dish, with a label on every entry that says how many people have weighed in. It's where the debate finally gets settled — and the app you open when you land somewhere and want the best version of the thing that city is known for.

**Pitch / partner framing (optional, for later):** Beli proved people will happily do pairwise ranking for fun. Forked applies that mechanic to the unit people actually argue about — the dish — and turns it into a public, city-level verdict with a confidence label. The product is built and works US-wide; city leaderboards unlock as cities hit critical mass, starting with New Orleans. The wedge is signature-dish cities; the moat is the battle data and, eventually, per-user taste graphs.

### 8.4 Key objections and responses

- **"Isn't this just Beli?"** Beli ranks restaurants and forces you to compare Korean BBQ against a bagel shop. Forked ranks po'boys against po'boys, and publishes the city's answer.
- **"Why not just use Google?"** Google tells you a restaurant averages 4.2. Forked tells you its gumbo is #3 in the city, that eighteen people have weighed in, and that its po'boy isn't ranked at all. Different question.
- **"It shows a score out of 10. Isn't that just a rating?"** You never typed it. It came from which dishes you picked over which. Same for the city score: it's built from everyone's battles, not from a form.
- **"How do I know the #1 isn't one guy's opinion?"** Every entry says how many ratings are behind it and what tier that puts it in. A *New Entry* is labeled as one. A *Verified Champion* has 25+ people behind it.
- **"The leaderboard will be empty in my city."** Your own ranking works from your first rating, anywhere in the US. City leaderboards unlock as a city gets active, and Discover shows what's near you in the meantime. New Orleans is first.
- **"Rankings are subjective."** Yes — that's why we don't ask for a number and don't treat every rater the same. Battles plus weighting surface consensus without pretending a single number is truth.
- **"I don't want another app I have to maintain."** Restaurant, dish, one tap for how it was, a few battles. Photo, tags, and notes are optional.

---

## 9. Brand personality and voice

### 9.1 Personality attributes

**Opinionated, not preachy.** Forked has a point of view — the dish matters, stars lie — and says so plainly. It never lectures the user about their taste or tells them they're wrong.

**Unfussy, not sloppy.** No white tablecloths, no reservation flex, no lifestyle-magazine sheen. But the product is tight and precise; "unfussy" describes the attitude, not the craft.

**Competitive, not cruel.** It's a scoreboard and it loves an argument. It never punches down at a restaurant or a person; the joy is in the fight, not in the loser.

**Local, not provincial.** It sounds like it grew up in the city it's ranking and knows the neighborhood spots. It works anywhere; it just refuses to sound like a travel brochure.

*Test:* "The parking's bad and the salad's boring. The gumbo is #2 in the city. Order accordingly." — a line Beli, Yelp, or Savor would not write. The app's own "Because a 3-star dive can have the best po'boy in the city" passes the same test.

### 9.2 Voice guidelines

**How we sound:** Like the friend who has strong opinions about po'boys and has done the fieldwork — direct, a little combative, funny when it's earned, never performative.

| Do | Don't |
|---|---|
| Name the dish and the variation: "Roast beef po'boy at Parkway — #1." | Talk about "dining experiences" or "culinary journeys." |
| Frame it as a fight: "Which Po'Boy wins?" / "Beats your #3. Update your list?" | Frame it as journaling: "Your memory has been saved to your food diary." |
| Be plain about the math: "Ranked by battles, not stars. 18 ratings behind it." | Hide behind jargon: "Our proprietary algorithm leverages…" |
| Let the leaderboard speak: "The city says #1. You say #4. Discuss." | Editorialize on the user's taste: "Great choice!" / "Interesting pick…" |
| Own the enemy: "A 4.2 tells you nothing. Battle it." | Trash specific competitors by name in-product. |
| Keep verbs short: rate, battle, rank, settle, share. | Use "empower," "seamless," "curate," "elevate," "foodie." |

**Vocabulary we use (aligned to the product):** dish, variation, rate / rating, battle, wins, rank, leaderboard, Best [Dish] in [City], Your Dishes, Your Best Ever, Rising Star, New Entry / Emerging / Established / Verified Champion, the city says, main character, settle.

**Vocabulary we avoid:** foodie, curated, elevated, culinary, dining experience, review / reviewer, stars, "must-try," "hidden gem," "taste journey," "food resume," seamless, empower, revolutionize.

**Where the app currently breaks its own vocabulary** (decisions in §12): the "Foodie" badge name; "Hidden Gems to Discover" and "Rate a Hidden Spot" under Rising Stars; "Be an early reviewer!" on the Rising Star card. None of these is fatal, but each is exactly the category cliché the voice is built to avoid.

### 9.3 Tone shifts

- **Marketing site / App Store / onboarding:** Most combative. Lead with the enemy and the promise. Short, declarative, slightly cocky. The four onboarding slides are the reference: "Rank Dishes, Not Restaurants." "Ditch the Stars, Choose the Winner."
- **In-product UI:** Fastest and quietest. Labels are verbs. "How was it?" "What did you eat?" "What are you craving?" The battle screen is two photos, "Which Po'Boy wins?", a step counter, and Skip — nothing else.
- **The battle itself:** The one place the product is allowed to be theatrical. The haptic drumroll on step one, the VS badge, the NEW tag. Keep it to the battle screen; don't let it leak into lists.
- **Empty and error states:** Honest and a little wry. The current leaderboard empty state — "Be the trendsetter and rate one!" — is on tone. Error: "That didn't save. Your ranking's safe; try once more."
- **Notifications (when they exist):** Rare, earned, and framed as news, not nagging. "A new spot just entered the po'boy top five." Never "You haven't rated in three days!"
- **Support / email:** Warm, direct, no ticket-speak. Still opinionated about the dish, never about the person.
- **Social:** This is where the fight lives. Leaderboard reveals, city-vs-city, "the city says vs. you say," Best Ever cards. Playful, provocative, always about dishes — never about individuals or dunking on a restaurant.

---

## 10. Visual and experiential direction

Direction for the design team, not a spec. Where the build has already made a choice, it's noted as the current state, not as a mandate.

**Personality translated to design**
- *Opinionated, not preachy* → strong hierarchy and big, confident rank numerals. The verdict is the hero on every screen. The current leaderboard rows (rank, medal for the top three, score badge on the right) and the #1 hero card already do this. No inspirational quotes, no onboarding sermons.
- *Unfussy, not sloppy* → utilitarian surfaces, generous tap targets, dense-but-clean lists. Warmth comes from real user photos of real food, not from illustration or gloss. Avoid the editorial-magazine look that Beli and The Infatuation own.
- *Competitive, not cruel* → scoreboard and bracket references are fair game (the VS badge, the NEW tag, step counters, medals, "moved up / moved down" motion), but nothing that shames a restaurant or a user. No red X on the loser.
- *Local, not provincial* → the city is a first-class object in the UI (the location pill, "Best Po'Boys in New Orleans," "Popular in This City"), but the system must feel identical in New Orleans, Brooklyn, and Chicago. No NOLA-only iconography baked into the core.

**Current state worth knowing**
- The wordmark in-app is lowercase with a period — *forked.* — next to a fork mark. The share cards use the same mark and a forkedapp.com footer.
- Scores show in a badge banded green (7.0+), yellow (4.0–6.9), red (under 4.0). Sentiment uses the same three colors with heart / thumbs-up / thumbs-down icons.
- Confidence tiers are pills with an icon each (sparkles, trending-up, check, flame).
- Light, dark, and system themes are supported; every surface has to read in both.

**Mood and references**
- Draw from: scoreboards and brackets, transit-map clarity, diner and sandwich-shop signage energy, Strava's "your number in context" framing, Letterboxd's confidence in ranked lists.
- Avoid: reservation-app polish, tasting-menu photography, muted "lifestyle" palettes, anything that reads as an invite-only club.

**Design system priorities**
1. Speed of the rating — restaurant → dish → how was it → battles, a few taps each. Every screen in the flow should be judged against this.
2. Legibility of rank and confidence — a stranger should understand a leaderboard row (rank, place, score, how sure) in two seconds.
3. Photo-friendliness without photo-dependence — photos enrich a rating and add weight; they are never required. Placeholders in battles and lists must look intentional, not broken.
4. Shareability — the three share cards (city Top 5, your Top list, Best Ever) should be recognizable as Forked at thumbnail size.
5. Accessibility — contrast and tap size matter more than motion, in both themes.

**Explicit non-directions**
- No star iconography anywhere. Not even for internal states. (Already enforced in code.)
- No restaurant-level rating surfaced in the UI. (Already true; the restaurant page lists dish scores only.)
- No "food resume," follower counts, or status ladders as primary features. Badges are personal milestones, not a public ranking of people. *(Confirmed by the build: there is no social graph.)*
- Nothing that requires an invite or waitlist aesthetic.
- Watch item: a red score badge on a public dish page reads as the app punching down at a restaurant. Consider reserving red for the user's own lists and using a neutral treatment for low public scores. Design's call.

---

## 11. Naming and tagline

### Name assessment

**"Forked" works and should be kept.** It's short, a real word, instantly food-adjacent, and has a built-in double meaning that matches the brand exactly: a fork in the road (this or that — the battle) and, colloquially, the state of the losing dish. It supports the competitive personality without being mean. It stretches to any dish and any city. The in-app wordmark — lowercase *forked.* with a period — reads as a verdict, which is the right instinct.

Risks to check:
- **Sayability / spelling:** low risk; one common spelling.
- **Distinctiveness:** "fork" is heavily used in food and in software (Git). Search and App Store discoverability will need "Forked app" and the dish-ranking framing to disambiguate. Check for existing "Forked" food apps and restaurants in launch markets.
- **Trademark and domain:** forkedapp.com is in use and on the share cards; the app is listed under com.forked.prod. Still needs a real trademark search — a lawyer should run it before any paid marketing.

### Tagline options

1. **"Rank the dish, not the place."** — *Category reframe.* Explains the product in six words and takes a stance against every restaurant-first app. Yelp and Beli cannot say it. **Recommended.** The onboarding headline "Rank Dishes, Not Restaurants" is the acceptable long-form variant; use one or the other consistently, not both.
2. **"Settle the debate."** — *Promise.* The founder's own phrase; shorter, punchier, more emotional. Slightly less specific — doesn't say what's being debated. Excellent as a campaign line or social handle bio under the primary tagline.
3. **"A 4.2 tells you nothing."** — *Enemy.* The most provocative; great for a launch poster or ad, too aggressive as a permanent line. The onboarding's "Ditch the Stars, Choose the Winner" is the softer, in-product cousin.

Use #1 as the primary tagline; #2 as the secondary line and social voice; #3 as campaign material.

---

## 12. Assumptions, open decisions, and validation plan

### 12.1 Copy conflicts to resolve (the app disagrees with itself or with this document)

| # | Conflict | Where | Recommendation |
|---|---|---|---|
| A | **Photos: mandatory or optional?** Onboarding says "If you didn't take a picture, you weren't there" and forkedapp.com says "mandatory photo verification." The rating screen makes the photo optional and says it "adds weight." | Onboarding slide 3, website, rating screen | Pick one. This document follows the build: optional, weighted. If that stands, rewrite slide 3 to "Snap a photo to back it up — photos carry more weight" and fix the website. If photos should be mandatory, that's a product change with a real drop-off cost; decide with data after launch. |
| B | **GPS verification.** The README claims "GPS verification to prevent armchair reviews." The app uses location to sort nearby restaurants and pick your city; it never gates a rating by distance. | README, marketing risk | Don't claim it anywhere until it's enforced. If it's enforced later, it becomes a Pillar 3 proof point ("you had to be there"). |
| C | **Vocabulary breaks.** "Foodie" badge; "Hidden Gems to Discover" / "Rate a Hidden Spot" / "Hidden Gems Await"; "Be an early reviewer!" | Badge seed, Rising Star card and empty state | Rename the badge (e.g., "Regular" or "Fifty Deep"); make "Rising Stars" the whole name and drop "hidden gem"; change "reviewer" to "Be one of the first to rate it." Cheap fixes, high consistency payoff. |

### 12.2 Assumptions

| # | Assumption | Confidence | How to validate |
|---|---|---|---|
| 1 | Dish partisans (not general foodies) are the right first audience and will do the work of rating. | Medium | Ten interviews with active "best X in NOLA" commenters; measure ratings-per-user in the first two weeks after a subreddit launch. |
| 2 | A public city leaderboard is the most shareable, acquisition-driving feature. | Medium | Three share cards ship (city Top 5, personal Top, Best Ever). Track share → install per card type; expect Best Ever to win on personal social and Top 5 to win in threads. |
| 3 | The one-line math explanation in §3.3 is understood and trusted. | Medium — *was Low in 0.1; the math is now defined* | User-test the one-liner and the confidence labels with five non-users. Watch for "so it IS an average?" — the answer is "of battle scores, not stars," and that line must land. |
| 4 | Cold start: the city-unlock threshold plus confidence tiers keep thin leaderboards credible. | Medium — *mechanism exists; thresholds unvalidated* | Instrument how a second city's leaderboard reads at unlock; tune the unlock threshold, the minimum-raters constant, and the tier boundaries. Test whether "Nearby" is a satisfying fallback or a confusing one. |
| 5 | Social should compare rankings, not rank people (no status ladders). | High — *confirmed by the build* | Revisit only if retention data says the casual rater needs a social hook. If a social layer is added, it should be "compare your list with a friend's," not follower counts. |
| 6 | The rating flow is fast enough to become habitual. | Medium | Time the flow end-to-end with and without a photo; instrument drop-off per step (restaurant, dish, sentiment, each battle step, skip rate). The app promises "under 30 seconds" for discovery; hold rating to the same bar. |
| 7 | Tourists will trust a locals-built leaderboard over Google. | Medium | Validate after the NOLA leaderboard is populated, ideally via the web Champions Wall, which is the no-install path. |
| 8 | "Forked" is clear of trademark and app-store conflicts in target markets. | Unknown | Trademark search (lawyer) and App Store / Play Store search before paid marketing. |
| 9 | No monetization is required for the strategy to hold. | High for now | Revisit if the product moves from side project to startup; restaurant-side products would conflict with the "no comped verdicts" stance and need careful handling. |
| 10 | Badges reward volume without turning into a status ladder. | Medium | They're private to the profile today. Keep them off leaderboards and share cards; watch whether the milestone names ("Connoisseur") drift toward the voice the brand avoids. |
| 11 | Personas are inferred from intake, not interviewed. | — | All persona details are illustrative until interviews in #1 are done. |

---

## 13. How each team uses this document

**Marketing:** Pull the positioning statement (§7.1), the enemy (§7.2), the three pillars (§8.2) as site sections, the objection responses (§8.4) for FAQ and ad copy, and the primary tagline (§11). Every feature you name must appear in §3.1–3.5; anything in §3.6 is off-limits until it ships. Launch channel is New Orleans subreddits and Facebook groups; lead with the po'boy leaderboard and the Top-5 share card, not the app's feature list. Resolve §12.1-A before the website copy is final. Never use "Beli for dishes" in owned copy.

**Design:** Pull §9.1 personality contrasts and §10 in full. Speed of the rating flow and legibility of rank-plus-confidence are the two design-system priorities; "no stars, no restaurant rating in the UI" are hard constraints already enforced. In-product copy follows §9.2's do/don't table and the tone rules in §9.3; the three vocabulary breaks in §12.1-C are the first fixes. Own the red-badge question in §10's non-directions.

**Product:** Pull §5.3 (who this is NOT for) for scope decisions — it rules out restaurant scores, long reviews, photo-first journaling, and status ladders. §3 is the current feature inventory; keep it in sync when things ship. Own §12.1-A and -B (photo policy, GPS claim) and assumption #4 (unlock thresholds, minimum raters, tier boundaries) before the second city. Taste graph is post-launch; taste tags already feed the dish page and are the right place to build from.

**Sales / pitching:** Pull the 30-second pitch and the partner framing (§8.3), the competitive table (§6), and "where we can win." The story is: the mechanic is proven, the unit is wrong everywhere else, the product is built and works US-wide, and the wedge is signature-dish cities starting with New Orleans.

---

## Appendix

### Research sources
- Codebase audit of the Forked mobile app (`apps/mobile`: screens, hooks, stores, CLAUDE.md, README, terms, badge plan, rating-algorithm design notes), September 13, 2026
- forkedapp.com landing page ("Coming Soon"; Champions Wall sample leaderboard), September 2026
- TODAY.com — how Beli gamifies restaurant ranking and friend feeds
- Apple App Store — Beli listing and user reviews, including the apples-to-oranges comparison complaint
- Crumble — 2026 guide contrasting forced-ranking apps (Beli) with absolute-rating apps
- Savor — positioning around "rate the plate, not the place" and dish-level journaling
- SciHub101 — 2026 overview of dish-discovery apps including Dishcision and its coverage limits in smaller cities
- Founder intake transcript and follow-up answers (Avi, September 2026)

### Glossary (brand term → what it is in the product)
- **Dish** (product: *dish type*) — the thing being ranked (po'boy, gumbo, pizza, burger). The unit of the product. Curated list; each city has its own "known dishes" surfaced first.
- **Variation** — a sub-type of a dish (roast beef po'boy, margherita). Recorded on your rating and shown on the dish page; battles and leaderboards run per dish, not per variation.
- **Rating** (product: *sentiment*) — the three-way first answer: Liked it / It was okay / Didn't like it. Plus optional photo, up to five taste tags, and a note. Replaces "verdict" from 0.1 for this meaning.
- **Battle** — a head-to-head choice between the dish just rated and one already ranked in the same dish type and sentiment zone. "Which Po'Boy wins?" A rating triggers at most ⌊log₂N⌋+1 of them; Skip ends the sequence.
- **Score** — the 0–10 number derived from battles, never typed. Personal scores live in a band set by sentiment; community scores are credibility-weighted and shrunk toward the city mean.
- **Your Dishes** — your ranked list per dish type. **Your Best Ever** — your top dish in each category, on the profile.
- **Leaderboard** — *Best [Dish] in [City]*: the top ten for a dish in a city, ordered by community score, each with a confidence tier.
- **Confidence tier** — New Entry (under 5 ratings) · Emerging (5–9) · Established (10–24) · Verified Champion (25+).
- **Rising Star** — a dish scoring 7.5+ on two to nine ratings; the product's "find it before everyone else" surface.
- **Verdict / the city says** — brand shorthand for what the leaderboard concludes. Used in UI and social copy, not as a product feature name.
- **Unlocked city** — a city whose public leaderboards are live because it crossed the activity threshold. Until then, users there get *Nearby*.
- **Taste tags** — per-dish-type descriptors (crispy, spicy, messy…) chosen on the rating screen; aggregated on the dish page as the crowd's description. Input to the future taste graph.
- **Taste graph** — planned per-user model built from ranking history and tags; not a launch feature.

