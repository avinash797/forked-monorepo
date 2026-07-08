-- ============================================================
-- DRAFT SEED — data required for a functional database
-- Apply AFTER draft_01..draft_04. Idempotent (ON CONFLICT DO NOTHING).
--
-- Sources:
--   * app_constants: copied from 20260302234506_extensions_and_tables.sql
--   * badge_definitions: copied from 20260309010000_badge_system.sql
--   * dish_types: authored here — the US-wide national starter set
--     (prod dish_types was empty; the old Gemini enrichment path is removed).
--     New types are added manually by admins from here on.
--   * cities: New Orleans only (mirrors prod, slug new-orleans-la-usa).
-- ============================================================

-- ============================================================
-- 1. App constants (Elo / Bayesian / zone boundaries)
-- ============================================================
INSERT INTO public.app_constants (key, value, description) VALUES
    ('ELO_INITIAL_LIKED',    1800,  'Starting Elo for "loved it" sentiment'),
    ('ELO_INITIAL_OKAY',     1500,  'Starting Elo for "it was fine" sentiment'),
    ('ELO_INITIAL_DISLIKED', 1200,  'Starting Elo for "didn''t like it" sentiment'),
    ('ELO_MIN',              1000,  'Minimum Elo (clamped)'),
    ('ELO_MAX',              2000,  'Maximum Elo (clamped)'),
    ('K_MAX',                64,    'Maximum K-factor for new dishes'),
    ('K_DECAY',              0.15,  'K-factor decay rate'),
    ('CREDIBILITY_SCALE',    500,   'Logarithmic credibility normalization constant'),
    ('BAYESIAN_C',           5,     'Bayesian prior strength (phantom votes)'),
    ('ZONE_LIKED_MIN',       1600,  'Lower Elo bound for "liked" search zone'),
    ('ZONE_OKAY_MIN',        1200,  'Lower Elo bound for "okay" search zone'),
    ('ZONE_OKAY_MAX',        1800,  'Upper Elo bound for "okay" search zone'),
    ('ZONE_DISLIKED_MAX',    1400,  'Upper Elo bound for "disliked" search zone'),
    ('ELO_CLAMP_LIKED_MIN',    1700,  'Score floor for "liked" sentiment (display 7.0)'),
    ('ELO_CLAMP_LIKED_MAX',    2000,  'Score ceiling for "liked" sentiment (display 10.0)'),
    ('ELO_CLAMP_OKAY_MIN',     1400,  'Score floor for "okay" sentiment (display 4.0)'),
    ('ELO_CLAMP_OKAY_MAX',     1690,  'Score ceiling for "okay" sentiment (display 6.9)'),
    ('ELO_CLAMP_DISLIKED_MIN', 1100,  'Score floor for "disliked" sentiment (display 1.0)'),
    ('ELO_CLAMP_DISLIKED_MAX', 1390,  'Score ceiling for "disliked" sentiment (display 3.9)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2. Dish types — national starter set (US-wide launch)
--    is_active=true: available for rating everywhere from day one.
-- ============================================================
INSERT INTO public.dish_types (name, slug, emoji, is_active, launch_order, aliases) VALUES
    -- National staples
    ('Burger',        'burger',         '🍔', true, 1,  ARRAY['hamburger','cheeseburger','smash burger']),
    ('Pizza',         'pizza',          '🍕', true, 2,  ARRAY['pie','slice','neapolitan','deep dish']),
    ('Tacos',         'tacos',          '🌮', true, 3,  ARRAY['taco','street tacos','birria']),
    ('Wings',         'wings',          '🍗', true, 4,  ARRAY['chicken wings','buffalo wings','hot wings']),
    ('Fried Chicken', 'fried-chicken',  '🍗', true, 5,  ARRAY['chicken tenders','hot chicken','chicken sandwich']),
    ('BBQ',           'bbq',            '🍖', true, 6,  ARRAY['barbecue','brisket','ribs','pulled pork']),
    ('Sandwich',      'sandwich',       '🥪', true, 7,  ARRAY['sub','hoagie','deli sandwich','cheesesteak']),
    ('Burrito',       'burrito',        '🌯', true, 8,  ARRAY['breakfast burrito','mission burrito']),
    ('Ramen',         'ramen',          '🍜', true, 9,  ARRAY['tonkotsu','shoyu','miso ramen']),
    ('Sushi',         'sushi',          '🍣', true, 10, ARRAY['nigiri','sashimi','maki','roll']),
    ('Pho',           'pho',            '🍲', true, 11, ARRAY['vietnamese noodle soup']),
    ('Pad Thai',      'pad-thai',       '🍝', true, 12, ARRAY['thai noodles']),
    ('Biryani',       'biryani',        '🍛', true, 13, ARRAY['chicken biryani','hyderabadi biryani']),
    ('Pancakes',      'pancakes',       '🥞', true, 14, ARRAY['flapjacks','hotcakes']),
    -- New Orleans heritage (flagship city)
    ('Gumbo',         'gumbo',          '🍲', true, 15, ARRAY['seafood gumbo','chicken and sausage gumbo']),
    ('Po'' Boy',      'po-boy',         '🥖', true, 16, ARRAY['poboy','po boy','shrimp po boy'])
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Cities — New Orleans (matches prod slug), active/grandfathered
-- ============================================================
INSERT INTO public.cities (name, state, country, slug, coordinates, is_active)
VALUES (
    'New Orleans', 'LA', 'USA', 'new-orleans-la-usa',
    extensions.ST_SetSRID(extensions.ST_MakePoint(-90.0715, 29.9511), 4326)::extensions.geography,
    true
)
ON CONFLICT (slug) DO NOTHING;

-- NOLA curated known dishes (admin-managed pairing)
INSERT INTO public.city_known_dishes (city_id, dish_type_id, display_order)
SELECT c.id, dt.id, x.display_order
FROM public.cities c
JOIN (VALUES ('gumbo', 1), ('po-boy', 2), ('fried-chicken', 3), ('sandwich', 4)) AS x(slug, display_order) ON true
JOIN public.dish_types dt ON dt.slug = x.slug
WHERE c.slug = 'new-orleans-la-usa'
ON CONFLICT (city_id, dish_type_id) DO NOTHING;

-- ============================================================
-- 4. Badge definitions (from 20260309010000_badge_system.sql)
-- ============================================================
INSERT INTO public.badge_definitions
    (slug, name, description, category, rule_type, threshold, dish_type_id, is_active, sort_order)
VALUES
    ('first_bite',      'First Bite',      'Submitted your first dish rating',        'milestone', 'total_ratings',     1,   NULL, true,  10),
    ('getting_started', 'Getting Started', 'Rated 10 dishes',                         'milestone', 'total_ratings',     10,  NULL, true,  20),
    ('foodie',          'Foodie',          'Rated 50 dishes',                         'milestone', 'total_ratings',     50,  NULL, true,  30),
    ('connoisseur',     'Connoisseur',     'Rated 100 dishes',                        'milestone', 'total_ratings',     100, NULL, true,  40),
    ('battle_tested',   'Battle Tested',   'Completed 25 This vs That battles',       'battle',    'total_comparisons', 25,  NULL, true,  50),
    ('battle_master',   'Battle Master',   'Completed 100 This vs That battles',      'battle',    'total_comparisons', 100, NULL, true,  60),
    ('explorer',        'Explorer',        'Rated dishes in 3 different cities',      'explorer',  'cities_count',      3,   NULL, false, 70),
    ('diverse_palate',  'Diverse Palate',  'Tried 5 different dish types',            'explorer',  'dish_types_count',  5,   NULL, true,  80)
ON CONFLICT (slug) DO NOTHING;

-- One dish-type badge per active dish type (threshold = 10 ratings of that type)
INSERT INTO public.badge_definitions
    (slug, name, description, category, rule_type, threshold, dish_type_id, is_active, sort_order)
SELECT
    lower(regexp_replace(dt.name, '[^a-zA-Z0-9]', '_', 'g')) || '_expert',
    dt.name || ' Expert',
    'Rated 10 ' || dt.name || ' dishes',
    'dish_type',
    'dish_type_count',
    10,
    dt.id,
    true,
    100 + (ROW_NUMBER() OVER (ORDER BY dt.name))::INTEGER
FROM public.dish_types dt
WHERE dt.is_active = true
ON CONFLICT (slug) DO NOTHING;
