-- Seed data: Additional New Orleans venues with diverse dish types
-- Purpose: Expand test data with variety of cuisines and dish types

-- ============================================================================
-- INSERT NEW DISH TYPES (Sushi, Ramen, Sashimi)
-- ============================================================================

insert into public.dish_types (
  id,
  name,
  category,
  description,
  alternate_names,
  common_dietary_tags,
  created_at,
  updated_at
) values
(
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Sushi Roll',
  'entree',
  'Japanese rolled sushi with rice, nori, and various fillings',
  ARRAY['sushi', 'maki', 'roll'],
  ARRAY['seafood', 'gluten-free'],
  now(),
  now()
),
(
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  'Nigiri',
  'entree',
  'Hand-pressed sushi rice topped with fresh fish or seafood',
  ARRAY['sushi', 'nigiri sushi'],
  ARRAY['seafood', 'gluten-free'],
  now(),
  now()
),
(
  'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  'Sashimi',
  'appetizer',
  'Thinly sliced raw fish or seafood served without rice',
  ARRAY['sashimi plate'],
  ARRAY['seafood', 'gluten-free'],
  now(),
  now()
),
(
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'Ramen',
  'entree',
  'Japanese noodle soup with broth, noodles, and various toppings',
  ARRAY['ramen bowl'],
  ARRAY['gluten'],
  now(),
  now()
);

-- ============================================================================
-- INSERT VENUES (Additional New Orleans Restaurants)
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
-- 6. Commander's Palace - Iconic Creole fine dining
(
  '66666666-6666-6666-6666-666666666666',
  'Commander''s Palace',
  '1403 Washington Ave',
  'New Orleans',
  'LA',
  '70130',
  'USA',
  29.92587300,
  -90.08532100,
  ARRAY['Creole', 'Fine Dining', 'Cajun'],
  false,
  4, -- $$$$
  now(),
  now()
),
-- 7. Café Du Monde - Famous for beignets and café au lait
(
  '77777777-7777-7777-7777-777777777777',
  'Café Du Monde',
  '800 Decatur St',
  'New Orleans',
  'LA',
  '70116',
  'USA',
  29.95779500,
  -90.06209100,
  ARRAY['Café', 'Bakery', 'French'],
  false,
  1, -- $
  now(),
  now()
),
-- 8. Domenica - Italian restaurant in the Roosevelt Hotel
(
  '88888888-8888-8888-8888-888888888888',
  'Domenica',
  '123 Baronne St',
  'New Orleans',
  'LA',
  '70112',
  'USA',
  29.95138900,
  -90.07083300,
  ARRAY['Italian', 'Pizza', 'Pasta'],
  false,
  3, -- $$$
  now(),
  now()
),
-- 9. Juan's Flying Burrito - Casual Mexican with NOLA flair
(
  '99999999-9999-9999-9999-999999999999',
  'Juan''s Flying Burrito',
  '2018 Magazine St',
  'New Orleans',
  'LA',
  '70130',
  'USA',
  29.92856700,
  -90.08691200,
  ARRAY['Mexican', 'Tex-Mex', 'Casual Dining'],
  false,
  2, -- $$
  now(),
  now()
),
-- 10. Willie Mae's Scotch House - Famous fried chicken
(
  'aaaaaaaa-aaaa-aaaa-aaaa-111111111111',
  'Willie Mae''s Scotch House',
  '2401 St Ann St',
  'New Orleans',
  'LA',
  '70119',
  'USA',
  29.96890400,
  -90.08523600,
  ARRAY['Southern', 'Soul Food', 'American'],
  false,
  2, -- $$
  now(),
  now()
),
-- 11. Brennan's - Classic Creole breakfast and brunch
(
  'bbbbbbbb-bbbb-bbbb-bbbb-111111111111',
  'Brennan''s',
  '417 Royal St',
  'New Orleans',
  'LA',
  '70130',
  'USA',
  29.95387200,
  -90.06542800,
  ARRAY['Creole', 'Breakfast', 'Fine Dining'],
  false,
  4, -- $$$$
  now(),
  now()
),
-- 12. Peche Seafood Grill - Modern seafood restaurant
(
  'cccccccc-cccc-cccc-cccc-111111111111',
  'Peche Seafood Grill',
  '800 Magazine St',
  'New Orleans',
  'LA',
  '70130',
  'USA',
  29.94193800,
  -90.07265400,
  ARRAY['Seafood', 'Contemporary', 'Grill'],
  false,
  3, -- $$$
  now(),
  now()
),
-- 13. Dat Dog - Gourmet hot dogs and sides
(
  'dddddddd-dddd-dddd-dddd-111111111111',
  'Dat Dog',
  '5030 Freret St',
  'New Orleans',
  'LA',
  '70115',
  'USA',
  29.93465800,
  -90.10298700,
  ARRAY['American', 'Hot Dogs', 'Casual Dining'],
  false,
  1, -- $
  now(),
  now()
),
-- 14. Ninja - Modern Japanese sushi and izakaya
(
  'eeeeeeee-eeee-eeee-eeee-111111111111',
  'Ninja',
  '8433 Oak St',
  'New Orleans',
  'LA',
  '70118',
  'USA',
  29.96095600,
  -90.12197800,
  ARRAY['Japanese', 'Sushi', 'Izakaya'],
  false,
  3, -- $$$
  now(),
  now()
),
-- 15. Rock-n-Sake - Upbeat sushi bar and lounge
(
  'ffffffff-ffff-ffff-ffff-111111111111',
  'Rock-n-Sake',
  '823 Fulton St',
  'New Orleans',
  'LA',
  '70130',
  'USA',
  29.94281500,
  -90.06887200,
  ARRAY['Japanese', 'Sushi', 'Asian Fusion'],
  false,
  3, -- $$$
  now(),
  now()
),
-- 16. Hana Japanese Restaurant - Traditional sushi and ramen
(
  '10101010-1010-1010-1010-101010101010',
  'Hana Japanese Restaurant',
  '8116 Hampson St',
  'New Orleans',
  'LA',
  '70118',
  'USA',
  29.95863200,
  -90.11847600,
  ARRAY['Japanese', 'Sushi', 'Ramen'],
  false,
  2, -- $$
  now(),
  now()
);

-- ============================================================================
-- INSERT DISHES (Diverse menu items across all venues)
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

-- Commander's Palace dishes
(
  'f1111111-1111-1111-1111-111111111111',
  '66666666-6666-6666-6666-666666666666',
  'Turtle Soup',
  'appetizer',
  'Classic',
  12.00,
  'USD',
  'Rich, savory soup made with turtle meat, vegetables, and sherry - a New Orleans tradition.',
  ARRAY['gluten'],
  1,
  true,
  now(),
  now(),
  '95bca2a9-07d0-451b-8d84-fa0b62e0e8f3', -- Gumbo (closest match)
  0.0,
  0
),
(
  'f2222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  'Pecan Crusted Gulf Fish',
  'entree',
  'Premium',
  38.00,
  'USD',
  'Fresh gulf fish with pecan crust, meuniere sauce, and seasonal vegetables.',
  ARRAY['tree nuts', 'gluten'],
  0,
  true,
  now(),
  now(),
  '2528015a-9388-490e-96e2-4be9e92b664d', -- Shrimp and Grits (seafood entree)
  0.0,
  0
),
(
  'f3333333-3333-3333-3333-333333333333',
  '66666666-6666-6666-6666-666666666666',
  'Creole Bread Pudding Soufflé',
  'dessert',
  'Signature',
  14.00,
  'USD',
  'Light soufflé made from bread pudding with whiskey sauce - a Commander''s Palace signature.',
  ARRAY['gluten', 'dairy', 'eggs'],
  0,
  true,
  now(),
  now(),
  'a129c493-054a-4a6d-bdfa-568fefafa843', -- Cheesecake
  0.0,
  0
),

-- Café Du Monde dishes
(
  'f4444444-4444-4444-4444-444444444444',
  '77777777-7777-7777-7777-777777777777',
  'Beignets (Order of 3)',
  'dessert',
  'Classic',
  3.50,
  'USD',
  'Three pillowy beignets dusted generously with powdered sugar. A New Orleans icon.',
  ARRAY['gluten', 'dairy'],
  0,
  true,
  now(),
  now(),
  '513d8753-555e-4090-9398-8b51dd08a616', -- Beignets
  0.0,
  0
),

-- Domenica dishes
(
  'f5555555-5555-5555-5555-555555555555',
  '88888888-8888-8888-8888-888888888888',
  'Pizza Margherita',
  'entree',
  'Classic',
  16.00,
  'USD',
  'Wood-fired pizza with San Marzano tomatoes, fresh mozzarella, and basil.',
  ARRAY['gluten', 'dairy'],
  0,
  true,
  now(),
  now(),
  '98d044d1-1cc5-42aa-971d-934d70a184be', -- Pizza
  0.0,
  0
),
(
  'f6666666-6666-6666-6666-666666666666',
  '88888888-8888-8888-8888-888888888888',
  'Meatballs Pomodoro',
  'entree',
  'Classic',
  18.00,
  'USD',
  'House-made meatballs with tomato sauce, parmesan, and grilled bread.',
  ARRAY['gluten', 'dairy'],
  0,
  true,
  now(),
  now(),
  'bc6d10c4-8d73-4366-80d3-2ed766defd94', -- Spaghetti and Meatballs
  0.0,
  0
),
(
  'f7777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  'Mozzarella en Carrozza',
  'appetizer',
  'Classic',
  12.00,
  'USD',
  'Fried mozzarella "in a carriage" with anchovy sauce and lemon.',
  ARRAY['gluten', 'dairy', 'fish'],
  0,
  true,
  now(),
  now(),
  '7f5d7f67-656c-4186-984b-95f316ffcb75', -- Mozzarella Sticks
  0.0,
  0
),

-- Juan's Flying Burrito dishes
(
  'f8888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'Blackened Fish Tacos',
  'entree',
  'Specialty',
  14.00,
  'USD',
  'Three tacos with blackened fish, cabbage slaw, pico de gallo, and chipotle aioli.',
  ARRAY['gluten', 'fish'],
  2,
  true,
  now(),
  now(),
  'f0fe647e-9361-43a8-a8a2-0566970267c3', -- Tacos
  0.0,
  0
),
(
  'f9999999-9999-9999-9999-999999999999',
  '99999999-9999-9999-9999-999999999999',
  'Loaded Nachos',
  'appetizer',
  'Classic',
  11.00,
  'USD',
  'Tortilla chips loaded with black beans, cheese, jalapeños, sour cream, and guacamole.',
  ARRAY['dairy'],
  1,
  true,
  now(),
  now(),
  '5bb91019-e4b7-421d-bf7c-20686d70c210', -- Nachos
  0.0,
  0
),

-- Willie Mae's Scotch House dishes
(
  'faaaaaaa-aaaa-aaaa-aaaa-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-111111111111',
  'Fried Chicken (Dark Meat)',
  'entree',
  'Signature',
  12.00,
  'USD',
  'Crispy, perfectly seasoned fried chicken - James Beard Award winner.',
  ARRAY['gluten'],
  0,
  true,
  now(),
  now(),
  '90965eb0-aadd-4db4-910a-1f285598ff92', -- Fried Chicken
  0.0,
  0
),
(
  'fbbbbbbb-bbbb-bbbb-bbbb-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-111111111111',
  'Mac and Cheese',
  'side',
  'Classic',
  6.00,
  'USD',
  'Creamy, homemade macaroni and cheese - the perfect side for fried chicken.',
  ARRAY['gluten', 'dairy'],
  0,
  true,
  now(),
  now(),
  '5bca6ec6-167f-471a-8296-1a3d49433b86', -- Mac and Cheese
  0.0,
  0
),

-- Brennan's dishes
(
  'fccccccc-cccc-cccc-cccc-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-111111111111',
  'Eggs Sardou',
  'breakfast',
  'Classic',
  24.00,
  'USD',
  'Poached eggs on artichoke bottoms with creamed spinach and hollandaise sauce.',
  ARRAY['gluten', 'dairy', 'eggs'],
  0,
  true,
  now(),
  now(),
  '31581e5a-a550-4f9d-8e7c-cf3624690e16', -- Omelette
  0.0,
  0
),
(
  'fddddddd-dddd-dddd-dddd-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-111111111111',
  'Bananas Foster',
  'dessert',
  'Signature',
  16.00,
  'USD',
  'Bananas flambéed tableside with rum, brown sugar, and cinnamon, served over vanilla ice cream.',
  ARRAY['dairy'],
  0,
  true,
  now(),
  now(),
  'a40c3e26-a2f7-4442-ba14-6e7d25f0932e', -- Ice Cream
  0.0,
  0
),
(
  'feeeeeee-eeee-eeee-eeee-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-111111111111',
  'Turtle Soup au Sherry',
  'appetizer',
  'Classic',
  14.00,
  'USD',
  'Rich turtle soup finished with sherry - a Brennan''s tradition.',
  ARRAY['gluten'],
  1,
  true,
  now(),
  now(),
  '95bca2a9-07d0-451b-8d84-fa0b62e0e8f3', -- Gumbo
  0.0,
  0
),

-- Peche Seafood Grill dishes
(
  'ffffffff-ffff-ffff-ffff-111111111111',
  'cccccccc-cccc-cccc-cccc-111111111111',
  'Whole Grilled Fish',
  'entree',
  'Premium',
  32.00,
  'USD',
  'Whole fish grilled over hardwood coals with lemon and herbs.',
  ARRAY['fish'],
  0,
  true,
  now(),
  now(),
  '2528015a-9388-490e-96e2-4be9e92b664d', -- Shrimp and Grits
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-222222222222',
  'cccccccc-cccc-cccc-cccc-111111111111',
  'Shrimp & Grits',
  'entree',
  'Classic',
  26.00,
  'USD',
  'Gulf shrimp with stone-ground grits, andouille, and Creole sauce.',
  ARRAY['shellfish', 'pork'],
  1,
  true,
  now(),
  now(),
  '2528015a-9388-490e-96e2-4be9e92b664d', -- Shrimp and Grits
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-333333333333',
  'cccccccc-cccc-cccc-cccc-111111111111',
  'Catfish Étouffée',
  'entree',
  'Specialty',
  24.00,
  'USD',
  'Smothered catfish in a rich roux-based sauce with the holy trinity, served over rice.',
  ARRAY['fish', 'gluten'],
  2,
  true,
  now(),
  now(),
  '121fc908-07fd-4b9b-9e9f-2879f5a27b1a', -- Étouffée
  0.0,
  0
),

-- Dat Dog dishes
(
  'f0000000-0000-0000-0000-444444444444',
  'dddddddd-dddd-dddd-dddd-111111111111',
  'Crawfish Étouffée Dog',
  'entree',
  'Specialty',
  9.50,
  'USD',
  'House-made sausage topped with crawfish étouffée on a toasted bun.',
  ARRAY['gluten', 'shellfish'],
  1,
  true,
  now(),
  now(),
  '121fc908-07fd-4b9b-9e9f-2879f5a27b1a', -- Étouffée
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-555555555555',
  'dddddddd-dddd-dddd-dddd-111111111111',
  'Beer-Battered Onion Rings',
  'appetizer',
  'Classic',
  6.50,
  'USD',
  'Thick-cut onion rings in a light beer batter, fried golden brown.',
  ARRAY['gluten'],
  0,
  true,
  now(),
  now(),
  '92809cd0-4577-46fd-8056-4018645dc22b', -- Onion Rings
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-666666666666',
  'dddddddd-dddd-dddd-dddd-111111111111',
  'House-Cut Fries',
  'side',
  'Classic',
  4.50,
  'USD',
  'Fresh-cut fries fried to perfection with Creole seasoning.',
  ARRAY['vegan'],
  0,
  true,
  now(),
  now(),
  'b1934f23-c424-4932-946d-071fdbfd4ab6', -- French Fries
  0.0,
  0
),

-- Ninja dishes
(
  'f0000000-0000-0000-0000-777777777777',
  'eeeeeeee-eeee-eeee-eeee-111111111111',
  'Spicy Tuna Roll',
  'entree',
  'Classic',
  14.00,
  'USD',
  'Fresh tuna mixed with spicy mayo, cucumber, and scallions, rolled in nori and rice.',
  ARRAY['seafood', 'shellfish', 'spicy'],
  2,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-888888888888',
  'eeeeeeee-eeee-eeee-eeee-111111111111',
  'Dragon Roll',
  'entree',
  'Specialty',
  18.00,
  'USD',
  'Shrimp tempura and cucumber topped with avocado, eel, and sweet eel sauce.',
  ARRAY['seafood', 'shellfish', 'gluten'],
  0,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-999999999999',
  'eeeeeeee-eeee-eeee-eeee-111111111111',
  'Salmon Nigiri (2 pieces)',
  'entree',
  'Classic',
  8.00,
  'USD',
  'Two pieces of fresh Atlantic salmon over hand-pressed sushi rice.',
  ARRAY['seafood', 'fish'],
  0,
  true,
  now(),
  now(),
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', -- Nigiri
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-aaaaaaaaaaaa',
  'eeeeeeee-eeee-eeee-eeee-111111111111',
  'Tuna Nigiri (2 pieces)',
  'entree',
  'Premium',
  9.00,
  'USD',
  'Two pieces of premium bluefin tuna over hand-pressed sushi rice.',
  ARRAY['seafood', 'fish'],
  0,
  true,
  now(),
  now(),
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', -- Nigiri
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-111111111111',
  'Sashimi Platter',
  'appetizer',
  'Premium',
  24.00,
  'USD',
  'Chef''s selection of nine pieces of fresh sashimi including tuna, salmon, and yellowtail.',
  ARRAY['seafood', 'fish'],
  0,
  true,
  now(),
  now(),
  'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', -- Sashimi
  0.0,
  0
),

-- Rock-n-Sake dishes
(
  'f0000000-0000-0000-0000-cccccccccccc',
  'ffffffff-ffff-ffff-ffff-111111111111',
  'California Roll',
  'entree',
  'Classic',
  12.00,
  'USD',
  'Crab stick, avocado, and cucumber rolled with sesame seeds on the outside.',
  ARRAY['seafood', 'shellfish'],
  0,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-dddddddddddd',
  'ffffffff-ffff-ffff-ffff-111111111111',
  'Rainbow Roll',
  'entree',
  'Specialty',
  16.00,
  'USD',
  'California roll topped with assorted fresh fish and avocado.',
  ARRAY['seafood', 'shellfish', 'fish'],
  0,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-eeeeeeeeeeee',
  'ffffffff-ffff-ffff-ffff-111111111111',
  'Volcano Roll',
  'entree',
  'Specialty',
  17.00,
  'USD',
  'Spicy tuna and cucumber topped with baked scallops, spicy mayo, and eel sauce.',
  ARRAY['seafood', 'shellfish', 'spicy'],
  2,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
),
(
  'f0000000-0000-0000-0000-ffffffffffff',
  'ffffffff-ffff-ffff-ffff-111111111111',
  'Eel Nigiri (2 pieces)',
  'entree',
  'Specialty',
  10.00,
  'USD',
  'Two pieces of grilled freshwater eel with sweet eel sauce over sushi rice.',
  ARRAY['seafood', 'fish'],
  0,
  true,
  now(),
  now(),
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', -- Nigiri
  0.0,
  0
),

-- Hana Japanese Restaurant dishes
(
  'f1000000-0000-0000-0000-111111111111',
  '10101010-1010-1010-1010-101010101010',
  'Philadelphia Roll',
  'entree',
  'Classic',
  13.00,
  'USD',
  'Smoked salmon, cream cheese, and cucumber rolled in nori and rice.',
  ARRAY['seafood', 'fish', 'dairy'],
  0,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
),
(
  'f1000000-0000-0000-0000-222222222222',
  '10101010-1010-1010-1010-101010101010',
  'Tonkotsu Ramen',
  'entree',
  'Classic',
  16.00,
  'USD',
  'Rich pork bone broth with ramen noodles, chashu pork, soft-boiled egg, and scallions.',
  ARRAY['gluten', 'pork', 'eggs'],
  1,
  true,
  now(),
  now(),
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', -- Ramen
  0.0,
  0
),
(
  'f1000000-0000-0000-0000-333333333333',
  '10101010-1010-1010-1010-101010101010',
  'Spicy Miso Ramen',
  'entree',
  'Specialty',
  17.00,
  'USD',
  'Spicy miso broth with ramen noodles, ground pork, corn, bean sprouts, and chili oil.',
  ARRAY['gluten', 'pork', 'spicy'],
  3,
  true,
  now(),
  now(),
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', -- Ramen
  0.0,
  0
),
(
  'f1000000-0000-0000-0000-444444444444',
  '10101010-1010-1010-1010-101010101010',
  'Yellowtail Nigiri (2 pieces)',
  'entree',
  'Premium',
  9.50,
  'USD',
  'Two pieces of fresh yellowtail (hamachi) over hand-pressed sushi rice.',
  ARRAY['seafood', 'fish'],
  0,
  true,
  now(),
  now(),
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', -- Nigiri
  0.0,
  0
),
(
  'f1000000-0000-0000-0000-555555555555',
  '10101010-1010-1010-1010-101010101010',
  'Shrimp Tempura Roll',
  'entree',
  'Classic',
  14.50,
  'USD',
  'Crispy shrimp tempura, avocado, and cucumber with eel sauce.',
  ARRAY['seafood', 'shellfish', 'gluten'],
  0,
  true,
  now(),
  now(),
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Sushi Roll
  0.0,
  0
);

-- Add comment for documentation
comment on table public.venues is 'Seed data includes 16 authentic New Orleans restaurants with diverse cuisines including Japanese sushi bars';
comment on table public.dishes is 'Seed data includes 36+ dishes across multiple dish types and cuisines, including sushi rolls, nigiri, sashimi, and ramen';
comment on table public.dish_types is 'Seed data includes Japanese dish types: Sushi Roll, Nigiri, Sashimi, and Ramen';
