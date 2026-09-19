#!/usr/bin/env node
//
// Seed New Orleans as a real user would, one account per run.
//
//   npm run seed:nola                 # asks for everything
//   npm run seed:nola -- --env dev    # skip the database question
//   npm run seed:nola -- --seed 42    # reproducible choices (sentiments, venues, battles)
//   npm run seed:nola -- --fast       # no "think time" pauses between taps
//
// Nothing here writes tables directly. The script signs in with the anon key as the
// person whose details you type, and then goes through the same client calls the
// mobile app makes, in the same order:
//
//   sign in / sign up  ->  edit profile (name, username, bio, home city)
//   for each dish:  pick venue (DB search first, else upsert_restaurant_from_google)
//                   ->  create_rating  ->  submit_comparison until battle_complete
//
// Because of that, every dependent row is produced by the database's own RPCs and
// triggers: profiles (auth trigger), neighborhoods + restaurants (upsert RPC),
// personal_ratings + personal_rating_tags + battle_sessions (create_rating),
// comparisons (submit_comparison), restaurant_dishes (rating trigger),
// global_dish_scores + profile stats + user_badges (rating RPCs). RLS applies exactly
// as it does for the app, so the script cannot create anything a user couldn't.
//
// Leaderboards only list a restaurant+dish once 2 DIFFERENT users have rated it, and
// Discover only recommends places you haven't rated. So run this several times with
// different accounts (3-5 is plenty); the venue weighting makes their picks overlap.
//
// Prod is refused outright (see CLAUDE.md: never target prod from a script).

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
    validateDisplayName,
    validateEmail,
    validatePassword,
    validateUsername,
} from '@forked/utils/validators';
import { DISH_POOLS, NOTES, VENUES } from './restaurants.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------- tunables
const DISH_SLUGS = ['gumbo', 'po-boy', 'fried-chicken'];
const RATINGS_PER_DISH = [4, 6]; // inclusive range, per user per dish type
const SENTIMENTS = ['liked', 'okay', 'disliked'];
const SKIP_RATE = 0.05; // chance a user skips a battle step (ends the battle)
const NOTE_RATE = 0.5;
const VARIATION_RATE = 0.35;
const MAX_TAGS = 2;
const BIO_MAX = 160; // mirrors the edit-profile form
// Hidden "how much I actually enjoyed it" per sentiment, on the app's 1-10 display
// scale (the same bands the Elo clamps enforce). Battle answers come from this, so a
// user's head-to-head picks agree with their own sentiments instead of being noise.
const TASTE_BANDS = { liked: [7.0, 10.0], okay: [4.0, 6.9], disliked: [1.0, 3.9] };

// ---------------------------------------------------------------- output
const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = c('1');
const dim = c('2');
const red = c('31');
const green = c('32');
const yellow = c('33');
const cyan = c('36');
const SENTIMENT_LABEL = {
    liked: green('liked it'),
    okay: yellow('it was ok'),
    disliked: red("didn't like it"),
};

function die(msg) {
    console.error(red(`\nerror: ${msg}`));
    process.exit(1);
}

// ---------------------------------------------------------------- args
function parseArgs(argv) {
    const args = { env: null, seed: null, fast: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--env') args.env = argv[++i];
        else if (a === '--seed') args.seed = Number(argv[++i]);
        else if (a === '--fast') args.fast = true;
        else if (a === '-h' || a === '--help') {
            console.log('usage: npm run seed:nola -- [--env local|dev] [--seed <int>] [--fast]');
            process.exit(0);
        } else die(`unknown argument '${a}' (try --help)`);
    }
    if (args.seed !== null && !Number.isInteger(args.seed)) die('--seed must be an integer');
    return args;
}

// ---------------------------------------------------------------- prompts
// One readline for the whole run. Lines are queued as they arrive, so answers typed
// (or piped) while the script is busy on the network are never dropped.
const input = { rl: null, lines: [], waiter: null, muted: false, closed: false };

function startInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: Boolean(process.stdin.isTTY),
    });
    const write = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (s) => {
        if (!input.muted) write(s); // hides password keystrokes
    };
    rl.on('line', (line) => {
        if (input.waiter) {
            const w = input.waiter;
            input.waiter = null;
            w(line);
        } else input.lines.push(line);
    });
    rl.on('close', () => {
        input.closed = true;
        if (input.waiter) die('input closed before all questions were answered');
    });
    input.rl = rl;
}

function stopInput() {
    input.waiter = null;
    input.rl?.close();
}

function ask(question, { hidden = false } = {}) {
    if (!input.rl) startInput();
    process.stdout.write(question);
    return new Promise((resolve) => {
        const done = (line) => {
            if (hidden) {
                input.muted = false;
                process.stdout.write('\n');
            }
            resolve(line.trim());
        };
        if (input.lines.length) return done(input.lines.shift());
        if (input.closed) die('input closed before all questions were answered');
        input.muted = hidden;
        input.waiter = done;
    });
}

async function askValid(question, validate, opts) {
    for (;;) {
        const value = await ask(question, opts);
        const problem = validate(value);
        if (!problem) return value;
        console.log(red(`  ${problem}`));
    }
}

async function confirm(question) {
    const answer = await ask(`${question} ${dim('[y/N]')} `);
    return /^y(es)?$/i.test(answer);
}

// ---------------------------------------------------------------- rng
// mulberry32: tiny seeded PRNG so a run can be replayed with --seed.
function makeRng(seed) {
    let t = seed >>> 0;
    return () => {
        t = (t + 0x6d2b79f5) >>> 0;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const uniform = (rng, lo, hi) => lo + rng() * (hi - lo);

function shuffle(rng, arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function weightedSample(rng, items, n) {
    const pool = [...items];
    const out = [];
    while (out.length < n && pool.length) {
        const total = pool.reduce((s, it) => s + it.weight, 0);
        let r = rng() * total;
        const idx = pool.findIndex((it) => (r -= it.weight) < 0);
        out.push(pool.splice(idx === -1 ? pool.length - 1 : idx, 1)[0]);
    }
    return out;
}

function sampleUpTo(rng, arr, max) {
    return shuffle(rng, arr).slice(0, randInt(rng, 0, Math.min(max, arr.length)));
}

// ---------------------------------------------------------------- target database
function parseEnvFile(path) {
    const out = {};
    if (!existsSync(path)) return out;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (!m) continue; // also skips commented-out lines
        out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return out;
}

function resolveTarget(envName) {
    const projects = parseEnvFile(join(ROOT, 'supabase', 'projects.env'));
    const prodRef = projects.SUPABASE_PROJECT_REF_PROD;
    const devRef = projects.SUPABASE_PROJECT_REF_DEV;
    if (!prodRef || !devRef) die('supabase/projects.env is missing the dev/prod project refs');

    let url;
    let anonKey;
    if (envName === 'local') {
        let raw;
        try {
            raw = execFileSync('supabase', ['status', '-o', 'env'], {
                cwd: ROOT,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        } catch {
            die('could not read the local stack (is Docker running? try `npm run db:start`)');
        }
        const vars = {};
        for (const line of raw.split('\n')) {
            const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
            if (m) vars[m[1]] = m[2];
        }
        url = vars.API_URL;
        anonKey = vars.ANON_KEY || vars.PUBLISHABLE_KEY;
        if (!url || !anonKey) die('`supabase status` did not report API_URL / ANON_KEY');
    } else if (envName === 'dev') {
        url = `https://${devRef}.supabase.co`;
        anonKey = process.env.SUPABASE_ANON_KEY;
        if (!anonKey) {
            // Reuse the mobile app's dev config, but only if it really points at dev.
            const mobile = parseEnvFile(join(ROOT, 'apps', 'mobile', '.env.local'));
            if (mobile.EXPO_PUBLIC_SUPABASE_URL === url) anonKey = mobile.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        }
        if (!anonKey) {
            die(`no anon key for dev. Set SUPABASE_ANON_KEY, or point apps/mobile/.env.local at ${url}`);
        }
    } else if (envName === 'prod') {
        die('refusing to seed prod. Seed data only goes to local or dev.');
    } else {
        die(`unknown environment '${envName}' (expected local or dev)`);
    }

    if (url.includes(prodRef)) die('resolved URL points at the prod project; refusing.');
    return { envName, url, anonKey };
}

// ---------------------------------------------------------------- helpers
const normalizeName = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function unwrap({ data, error }, what) {
    if (error) throw new Error(`${what}: ${error.message}${error.details ? ` (${error.details})` : ''}`);
    return data;
}

// ---------------------------------------------------------------- main
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const seed = args.seed ?? Math.floor(Math.random() * 2 ** 31);
    const rng = makeRng(seed);
    const think = args.fast ? async () => {} : () => sleep(randInt(rng, 350, 1200));

    console.log(bold('\nForked: seed New Orleans as a real user\n'));

    // 1. Which database -----------------------------------------------------------
    let envName = args.env;
    while (!envName) {
        const answer = (await ask(`Which database? ${dim('(local / dev)')} `)).toLowerCase();
        if (answer === 'local' || answer === 'dev' || answer === 'prod') envName = answer;
    }
    const target = resolveTarget(envName);
    console.log(dim(`  -> ${target.envName}: ${target.url}`));

    const supabase = createClient(target.url, target.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // 2. New Orleans id in THIS database -----------------------------------------
    let city;
    for (;;) {
        const cityId = await ask('\nNew Orleans city id in this database (cities.id): ');
        if (!UUID_RE.test(cityId)) {
            console.log(red('  That is not a UUID.'));
            continue;
        }
        const { data, error } = await supabase
            .from('cities')
            .select('id, name, state, country, is_active')
            .eq('id', cityId)
            .maybeSingle();
        if (error) die(`reading cities: ${error.message}`);
        if (!data) {
            console.log(red('  No city with that id in this database.'));
            continue;
        }
        if (data.name !== 'New Orleans' && !(await confirm(yellow(`  That id is "${data.name}, ${data.state}", not New Orleans. Use it anyway?`)))) {
            continue;
        }
        city = data;
        break;
    }
    console.log(dim(`  -> ${city.name}, ${city.state} (${city.id})`));
    if (!city.is_active) {
        console.log(yellow('  Note: this city is not active yet, so its leaderboards stay hidden in the app'));
        console.log(yellow('  until the nightly evaluate_city_unlocks job (or an admin) activates it.'));
    }

    // 3. Dish types ----------------------------------------------------------------
    const dishRows = unwrap(
        await supabase.from('dish_types').select('id, name, slug, is_active').in('slug', DISH_SLUGS),
        'reading dish_types'
    );
    const dishes = DISH_SLUGS.map((slug) => {
        const row = dishRows.find((d) => d.slug === slug);
        if (!row) die(`dish type '${slug}' does not exist in this database`);
        if (!row.is_active) die(`dish type '${slug}' is not active in this database`);
        return row;
    });

    // 4. Profile details -------------------------------------------------------------
    console.log(bold('\nProfile details'));
    const email = await askValid('  Email: ', validateEmail);
    const password = await askValid('  Password: ', (v) => (v ? null : 'Password is required'), { hidden: true });
    const displayName = await askValid('  Display name: ', validateDisplayName);
    const username = await askValid(
        `  Username ${dim('(letters, numbers, _)')}: `,
        (v) => (v ? validateUsername(v) : 'Username is required for seed users')
    );
    const bio = await askValid(`  Bio ${dim('(optional)')}: `, (v) =>
        v.length > BIO_MAX ? `Bio must be less than ${BIO_MAX} characters` : null
    );

    // 5. Sign in (or sign up, exactly like the app's email flow) -----------------------
    let session;
    {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
            session = data.session;
            console.log(green(`\n  Signed in as ${email}`));
        } else if (/invalid login credentials/i.test(error.message)) {
            if (!(await confirm(`\n  No account matches that email + password. Create one for ${email}?`))) {
                die('stopped: no account');
            }
            const problem = validatePassword(password);
            if (problem) die(problem);
            const signUp = await supabase.auth.signUp({
                email,
                password,
                options: { data: { display_name: displayName } },
            });
            if (signUp.error) die(`sign up failed: ${signUp.error.message}`);
            if (signUp.data.user && signUp.data.user.identities?.length === 0) {
                die('an account with this email already exists; the password was wrong');
            }
            if (!signUp.data.session) {
                die('account created but email confirmation is on for this project. Confirm the email, then run again.');
            }
            session = signUp.data.session;
            console.log(green(`\n  Signed up and signed in as ${email}`));
        } else {
            die(`sign in failed: ${error.message}`);
        }
    }
    const userId = session.user.id;

    // The on_auth_user_created trigger creates the profile row; wait for it.
    let profile = null;
    for (let i = 0; i < 10 && !profile; i++) {
        profile = unwrap(
            await supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            'reading profile'
        );
        if (!profile) await sleep(300);
    }
    if (!profile) die('signed in, but no profiles row exists for this user');
    if (profile.is_banned) die('this account is banned');

    // 6. Edit profile (username must be free, same as the unique constraint) -----------
    let finalUsername = username;
    for (;;) {
        const taken = unwrap(
            await supabase.from('profiles').select('id').eq('username', finalUsername).maybeSingle(),
            'checking username'
        );
        if (!taken || taken.id === userId) break;
        console.log(red(`  Username "${finalUsername}" is taken.`));
        finalUsername = await askValid('  Pick another username: ', (v) =>
            v ? validateUsername(v) : 'Username is required for seed users'
        );
    }
    unwrap(
        await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                username: finalUsername,
                bio: bio || null,
                home_city_id: city.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId),
        'updating profile'
    );
    console.log(green(`  Profile saved: ${displayName} (@${finalUsername}), home city ${city.name}`));

    // 7. What the rating screen loads per dish: taste tags + variations ----------------
    const catalog = {};
    for (const dish of dishes) {
        const tags = unwrap(
            await supabase.from('taste_tags').select('id, name').or(`dish_type_id.eq.${dish.id},dish_type_id.is.null`),
            'reading taste_tags'
        );
        const variations = unwrap(
            await supabase
                .from('dish_type_variations')
                .select('id, name')
                .eq('dish_type_id', dish.id)
                .eq('is_active', true),
            'reading dish_type_variations'
        );
        catalog[dish.slug] = { tags, variations };
    }

    // Hidden per-rating enjoyment on the 1-10 scale; drives every battle answer.
    const tastes = new Map();
    const tasteFor = (ratingId, fallbackScore) => {
        if (!tastes.has(ratingId)) {
            tastes.set(ratingId, Number(fallbackScore ?? 5) + uniform(rng, -0.3, 0.3));
        }
        return tastes.get(ratingId);
    };

    async function battle(battleId, newRatingId, firstOpponent) {
        let opponent = firstOpponent;
        for (let step = 1; step <= 16; step++) {
            const mine = tasteFor(newRatingId);
            const theirs = tasteFor(opponent.rating_id, opponent.derived_score);
            const result = rng() < SKIP_RATE ? 'skipped' : mine >= theirs ? 'new_wins' : 'opponent_wins';
            const verdict =
                result === 'skipped' ? dim('skipped') : result === 'new_wins' ? green('this one wins') : yellow(`${opponent.restaurant_name} wins`);
            console.log(dim(`      vs ${opponent.restaurant_name} (${opponent.derived_score}) -> `) + verdict);
            await think();
            const res = unwrap(
                await supabase.rpc('submit_comparison', { p_battle_id: battleId, p_result: result }),
                'submit_comparison'
            );
            if (res.battle_complete) return res;
            opponent = res.opponent;
        }
        throw new Error(`battle ${battleId} did not finish in 16 steps`);
    }

    function reportBadges(badges) {
        for (const b of badges ?? []) console.log(cyan(`      badge earned: ${b.name}`));
    }

    // 8. Finish any battle left open by an interrupted earlier run --------------------
    const openSessions = unwrap(
        await supabase
            .from('battle_sessions')
            .select('id, rating_id, candidate_ids, low_idx, high_idx')
            .eq('user_id', userId)
            .eq('status', 'active'),
        'reading battle_sessions'
    );
    for (const s of openSessions) {
        const oppId = s.candidate_ids[Math.floor((s.low_idx + s.high_idx) / 2)];
        const rows = unwrap(
            await supabase
                .from('personal_ratings')
                .select('id, sentiment, derived_score, restaurant:restaurants(name)')
                .in('id', [s.rating_id, oppId]),
            'reading open battle ratings'
        );
        const mine = rows.find((r) => r.id === s.rating_id);
        const opp = rows.find((r) => r.id === oppId);
        if (!mine || !opp) continue;
        console.log(yellow(`\n  Finishing an open battle for ${mine.restaurant?.name}`));
        tastes.set(mine.id, uniform(rng, ...TASTE_BANDS[mine.sentiment]));
        const done = await battle(s.id, mine.id, {
            rating_id: opp.id,
            restaurant_name: opp.restaurant?.name,
            derived_score: opp.derived_score,
        });
        console.log(`      final score ${bold(done.final_derived_score)}`);
    }

    // 9. Decide where this person ate ---------------------------------------------------
    // Already-rated venue+dish pairs are skipped (a person doesn't re-rate by accident).
    const existing = unwrap(
        await supabase
            .from('personal_ratings')
            .select('dish_type_id, restaurant:restaurants(name, city_id)')
            .eq('user_id', userId),
        'reading existing ratings'
    );
    const alreadyRated = new Set(
        existing
            .filter((r) => r.restaurant?.city_id === city.id)
            .map((r) => `${r.dish_type_id}:${normalizeName(r.restaurant.name)}`)
    );
    const isRated = (dish, venueKey) => alreadyRated.has(`${dish.id}:${normalizeName(VENUES[venueKey].name)}`);

    const rate = unwrap(await supabase.rpc('check_rate_limit'), 'check_rate_limit')[0];
    let allowance = rate?.can_rate ? rate.max_allowed - rate.ratings_last_hour : 0;

    const plan = [];
    for (const dish of dishes) {
        const pool = DISH_POOLS[dish.slug].filter((p) => !isRated(dish, p.venue));
        const want = randInt(rng, ...RATINGS_PER_DISH);
        for (const p of weightedSample(rng, pool, want)) plan.push({ dish, venueKey: p.venue });
    }
    let visits = shuffle(rng, plan); // people don't eat all the gumbo first
    if (visits.length > allowance) {
        console.log(yellow(`\n  Rate limit: ${rate.ratings_last_hour} ratings in the last hour, trimming plan to ${allowance}.`));
        visits = visits.slice(0, Math.max(allowance, 0));
    }
    if (!visits.length) {
        console.log(yellow('\n  Nothing left to rate for this user. Try another account.'));
        await supabase.auth.signOut();
        return;
    }

    console.log(bold(`\nPlan for @${finalUsername}`) + dim(`  (seed ${seed}, replay with --seed ${seed})`));
    for (const dish of dishes) {
        const names = visits.filter((v) => v.dish === dish).map((v) => VENUES[v.venueKey].name);
        console.log(`  ${dish.name.padEnd(14)} ${names.join(', ') || dim('(none)')}`);
    }
    if (existing.length) console.log(dim(`  (${existing.length} earlier ratings kept, not re-rated)`));
    if (!(await confirm(`\nWrite ${visits.length} ratings to ${target.envName}?`))) {
        await supabase.auth.signOut();
        console.log('Stopped. Nothing rated.');
        return;
    }

    // 10. Pick venue -> rate -> battle, one visit at a time --------------------------------
    const venueCache = new Map();
    async function selectVenue(venueKey) {
        if (venueCache.has(venueKey)) return venueCache.get(venueKey);
        const v = VENUES[venueKey];
        // Venue picker: DB results come first; only fall back to "Google" if not there.
        const found = unwrap(await supabase.rpc('search_restaurants', { search_term: v.name }), 'search_restaurants');
        let restaurant = found.find((r) => r.city_id === city.id && normalizeName(r.name) === normalizeName(v.name));
        let how = 'found in search';
        if (!restaurant) {
            const fullAddress = `${v.street}, ${city.name}, ${city.state} ${v.zip}, ${city.country ?? 'USA'}`;
            const types = ['restaurant', 'food', 'point_of_interest', 'establishment'];
            const rows = unwrap(
                await supabase.rpc('upsert_restaurant_from_google', {
                    p_google_place_id: `seed:nola:${venueKey}`,
                    p_name: v.name,
                    p_address: fullAddress,
                    p_city_name: city.name,
                    p_state: city.state,
                    p_country: city.country ?? 'USA',
                    p_neighborhood_name: v.neighborhood,
                    p_lat: v.lat,
                    p_lng: v.lng,
                    p_types: types,
                    p_location_properties: {
                        name: v.name,
                        full_address: fullAddress,
                        street: v.street,
                        city: city.name,
                        state: city.state,
                        zip: v.zip,
                        country: city.country ?? 'USA',
                        neighborhood: v.neighborhood,
                        lat: v.lat,
                        lng: v.lng,
                        phone: null,
                        website: null,
                        types,
                    },
                }),
                'upsert_restaurant_from_google'
            );
            restaurant = rows?.[0];
            how = 'picked from Google';
        }
        if (!restaurant) throw new Error(`could not select ${v.name}`);
        if (restaurant.city_id !== city.id) {
            throw new Error(`${v.name} resolved to city ${restaurant.city_id}, not ${city.id}; skipping it`);
        }
        const entry = { restaurant, how };
        venueCache.set(venueKey, entry);
        return entry;
    }

    let done = 0;
    let failed = 0;
    for (const [i, visit] of visits.entries()) {
        const { dish, venueKey } = visit;
        const venue = VENUES[venueKey];
        console.log(bold(`\n[${i + 1}/${visits.length}] ${dish.name} at ${venue.name}`) + dim(`  ${venue.neighborhood}`));
        try {
            const { restaurant, how } = await selectVenue(venueKey);
            console.log(dim(`      venue ${how}`));
            await think();

            const sentiment = pick(rng, SENTIMENTS);
            const { tags, variations } = catalog[dish.slug];
            const chosenTags = sampleUpTo(rng, tags, MAX_TAGS);
            const variation = variations.length && rng() < VARIATION_RATE ? pick(rng, variations) : null;
            const note = rng() < NOTE_RATE ? pick(rng, NOTES[sentiment][dish.slug]) : null;
            const extras = [
                variation && `variation: ${variation.name}`,
                chosenTags.length && `tags: ${chosenTags.map((t) => t.name).join(', ')}`,
                note && `"${note}"`,
            ].filter(Boolean);
            console.log(`      ${SENTIMENT_LABEL[sentiment]}${extras.length ? dim(`  ${extras.join('  ')}`) : ''}`);

            const created = unwrap(
                await supabase.rpc('create_rating', {
                    p_restaurant_id: restaurant.id,
                    p_dish_type_id: dish.id,
                    p_sentiment: sentiment,
                    p_variation_id: variation?.id,
                    p_notes: note ?? undefined,
                    p_taste_tag_ids: chosenTags.length ? chosenTags.map((t) => t.id) : undefined,
                }),
                'create_rating'
            );
            tastes.set(created.rating_id, uniform(rng, ...TASTE_BANDS[sentiment]));

            if (created.battle_complete) {
                console.log(`      no battle needed, score ${bold(created.derived_score)}`);
                reportBadges(created.new_badges);
            } else {
                console.log(dim(`      This vs That: ${created.total_candidates} ${dish.name} to place against`));
                const result = await battle(created.battle_id, created.rating_id, created.opponent);
                console.log(`      final score ${bold(result.final_derived_score)} after ${result.comparisons_made} step(s)`);
                reportBadges(result.new_badges);
            }
            done++;
        } catch (err) {
            failed++;
            console.log(red(`      failed: ${err.message}`));
        }
        await think();
    }

    // 11. What this user now sees -------------------------------------------------------------
    console.log(bold('\nResult'));
    const stats = unwrap(await supabase.rpc('get_user_stats'), 'get_user_stats');
    console.log(
        `  @${stats.username}: ${stats.total_ratings} ratings, ${stats.total_comparisons} comparisons, credibility ${stats.credibility_score}`
    );
    for (const dish of dishes) {
        const board = unwrap(
            await supabase.rpc('get_leaderboard', { p_dish_type_id: dish.id, p_city_id: city.id }),
            'get_leaderboard'
        );
        const top = board.slice(0, 3).map((e) => `${e.restaurant_name} ${e.bayesian_score}`);
        console.log(`  ${dish.name.padEnd(14)} leaderboard: ${board.length} entr${board.length === 1 ? 'y' : 'ies'}${top.length ? dim(`  top: ${top.join(' | ')}`) : ''}`);
    }
    const recs = unwrap(
        await supabase.rpc('get_discover_heroes', { p_city_id: city.id, p_per_dish_limit: 3 }),
        'get_discover_heroes'
    );
    console.log(`  Discover recommendations for this user: ${recs.length}`);
    for (const r of recs.slice(0, 6)) {
        const dishName = dishes.find((d) => d.id === r.dish_type_id)?.name ?? 'other';
        console.log(dim(`    ${dishName}: ${r.restaurant_name} (${r.bayesian_score}, ${r.total_ratings} ratings)`));
    }
    if (!recs.length) {
        console.log(dim('    (appear once other users have rated places this user has not; seed more accounts)'));
    }

    await supabase.auth.signOut();
    console.log(`\n${green(`Done: ${done} rated`)}${failed ? red(`, ${failed} failed`) : ''}.\n`);
    if (failed) process.exitCode = 1;
}

main()
    .then(stopInput)
    .catch((err) => die(err.stack || err.message));
