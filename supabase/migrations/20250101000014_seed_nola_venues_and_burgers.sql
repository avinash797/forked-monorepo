-- Seed data: 5 New Orleans restaurants and 5 burgers
-- Purpose: Provide initial test data for the rating flow

-- ============================================================================
-- INSERT VENUES (5 New Orleans Restaurants)
-- ============================================================================

insert into public.venues (
  id,
  name,
  address_street,
  address_city,
  address_state,
  address_zip,
  address_country,
  latitude,
  longitude,
  cuisine_types,
  is_chain,
  price_range,
  created_at,
  updated_at
) values
-- 1. Port of Call - Famous for their massive burgers and loaded baked potatoes
(
  '11111111-1111-1111-1111-111111111111',
  'Port of Call',
  '838 Esplanade Ave',
  'New Orleans',
  'LA',
  '70116',
  'USA',
  29.96502800,
  -90.06148300,
  ARRAY['American', 'Burgers', 'Bar Food'],
  false,
  2, -- $$
  now(),
  now()
),
-- 2. Company Burger - Gourmet burgers in the French Quarter
(
  '22222222-2222-2222-2222-222222222222',
  'Company Burger',
  '4600 Freret St',
  'New Orleans',
  'LA',
  '70115',
  'USA',
  29.92742400,
  -90.10129200,
  ARRAY['American', 'Burgers', 'Casual Dining'],
  false,
  2, -- $$
  now(),
  now()
),
-- 3. The Delachaise - French Quarter wine bar with excellent burgers
(
  '33333333-3333-3333-3333-333333333333',
  'The Delachaise',
  '3442 St Charles Ave',
  'New Orleans',
  'LA',
  '70115',
  'USA',
  29.92483600,
  -90.09842100,
  ARRAY['American', 'Wine Bar', 'Burgers'],
  false,
  2, -- $$
  now(),
  now()
),
-- 4. Bud's Broiler - Local New Orleans burger chain since 1952
(
  '44444444-4444-4444-4444-444444444444',
  'Bud''s Broiler',
  '500 City Park Ave',
  'New Orleans',
  'LA',
  '70119',
  'USA',
  29.98651200,
  -90.09623800,
  ARRAY['American', 'Burgers', 'Fast Casual'],
  false,
  1, -- $
  now(),
  now()
),
-- 5. Cowbell - Upscale burger joint in Mid-City
(
  '55555555-5555-5555-5555-555555555555',
  'Cowbell',
  '8801 Oak St',
  'New Orleans',
  'LA',
  '70118',
  'USA',
  29.96197300,
  -90.12534700,
  ARRAY['American', 'Burgers', 'Gastropub'],
  false,
  3, -- $$$
  now(),
  now()
);

-- ============================================================================
-- INSERT DISHES (5 Burgers - one for each venue)
-- ============================================================================

insert into public.dishes (
  id,
  venue_id,
  name,
  category,
  variety,
  current_price,
  currency,
  description,
  dietary_tags,
  spice_level,
  is_available,
  date_added,
  updated_at,
  dish_type_id,
  average_rating,
  review_count
) values
-- 1. Port of Call - The Monsoon Burger
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Monsoon Burger',
  'entree',
  'Classic',
  15.95,
  'USD',
  'Half-pound chargrilled burger served with a loaded baked potato. A New Orleans institution since 1963.',
  ARRAY['gluten'],
  0, -- not spicy
  true,
  now(),
  now(),
  '65151adb-d260-44e1-af6b-778e7c7b25ed',
  0.0,
  0
),
-- 2. Company Burger - The Company Burger
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'The Company Burger',
  'entree',
  'Classic',
  12.50,
  'USD',
  'Fresh ground beef patty with American cheese, lettuce, tomato, pickles, and Company sauce on a brioche bun.',
  ARRAY['gluten', 'dairy'],
  0, -- not spicy
  true,
  now(),
  now(),
  '65151adb-d260-44e1-af6b-778e7c7b25ed',
  0.0,
  0
),
-- 3. The Delachaise - The Delachaise Burger
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'Delachaise Burger',
  'entree',
  'Gourmet',
  16.00,
  'USD',
  'Grass-fed beef burger with gruyere cheese, caramelized onions, bacon, and truffle aioli on a pretzel bun.',
  ARRAY['gluten', 'dairy'],
  0, -- not spicy
  true,
  now(),
  now(),
  '65151adb-d260-44e1-af6b-778e7c7b25ed',
  0.0,
  0
),
-- 4. Bud's Broiler - The Original Bud's Burger
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '44444444-4444-4444-4444-444444444444',
  'Original Bud''s Burger',
  'entree',
  'Classic',
  8.99,
  'USD',
  'Flame-broiled burger with hickory sauce, a New Orleans favorite since 1952. Simple and delicious.',
  ARRAY['gluten'],
  0, -- not spicy
  true,
  now(),
  now(),
  '65151adb-d260-44e1-af6b-778e7c7b25ed',
  0.0,
  0
),
-- 5. Cowbell - Cowbell Burger
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '55555555-5555-5555-5555-555555555555',
  'Cowbell Burger',
  'entree',
  'Gourmet',
  18.00,
  'USD',
  'Double patty burger with white cheddar, bacon jam, pickled red onions, and garlic aioli on a house-made bun.',
  ARRAY['gluten', 'dairy'],
  0, -- not spicy
  true,
  now(),
  now(),
  '65151adb-d260-44e1-af6b-778e7c7b25ed',
  0.0,
  0
);

-- Add comment for documentation
comment on table public.venues is 'Seed data includes 5 authentic New Orleans restaurants';
comment on table public.dishes is 'Seed data includes 5 signature burgers from New Orleans venues';
