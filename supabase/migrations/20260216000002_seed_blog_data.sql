-- ============================================================
-- Seed Blog Data
-- Inserts initial authors, categories, tags, and sample posts.
-- ============================================================

-- =====================
-- 1. Author
-- =====================
INSERT INTO public.blog_authors (id, name, slug, bio)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Forked Team',
  'forked-team',
  'The team behind Forked — on a mission to find the best dish in every city.'
);

-- =====================
-- 2. Categories
-- =====================
INSERT INTO public.blog_categories (id, name, slug, description, display_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'City Guides', 'city-guides', 'Deep dives into the best dishes across cities on Forked.', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Dish Deep Dives', 'dish-deep-dives', 'Exploring the history, craft, and rankings of iconic dishes.', 2),
  ('c1000000-0000-0000-0000-000000000003', 'News & Updates', 'news-updates', 'Product updates, new cities, and community news from Forked.', 3);

-- =====================
-- 3. Tags
-- =====================
INSERT INTO public.blog_tags (id, name, slug)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'New Orleans', 'new-orleans'),
  ('d1000000-0000-0000-0000-000000000002', 'Gumbo', 'gumbo'),
  ('d1000000-0000-0000-0000-000000000003', 'Rankings', 'rankings');

-- =====================
-- 4. Blog Posts
-- =====================

-- Post 1: City-specific post WITH city_id and dish_type_id (for leaderboard enrichment)
INSERT INTO public.blog_posts (
  id, title, slug, excerpt, content, status,
  author_id, category_id, city_id, dish_type_id,
  seo_title, seo_description, published_at
)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'The Ultimate Guide to Gumbo in New Orleans',
  'ultimate-guide-gumbo-new-orleans',
  'From dark roux to okra-thickened bowls, we break down what makes New Orleans gumbo legendary — and who serves the best bowl in the city right now.',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "What Makes Great Gumbo?" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Gumbo is more than a soup — it is the soul of New Orleans in a bowl. Every cook has their own recipe, passed down through generations, and every pot tells a story. But what separates a good gumbo from a " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "great" },
          { "type": "text", "text": " one?" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "At Forked, we believe the answer lies in the data. Our Elo-ranked battle system pits gumbo against gumbo, letting real diners decide which bowl reigns supreme. No critics. No paid reviews. Just honest, head-to-head comparisons." }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "The Key Elements" }]
      },
      {
        "type": "bulletList",
        "content": [
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "The Roux:" },
                  { "type": "text", "text": " A dark roux, cooked low and slow until it reaches the color of chocolate, provides the flavor foundation. Shortcutting the roux means shortcutting the gumbo." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "The Holy Trinity:" },
                  { "type": "text", "text": " Onion, celery, and bell pepper — the Cajun mirepoix. The ratio matters, and so does the cook time." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "The Protein:" },
                  { "type": "text", "text": " Andouille sausage, chicken, shrimp, crab, or oysters. The best gumbo kitchens know that quality protein is non-negotiable." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "The Rice:" },
                  { "type": "text", "text": " Served over a mound of long-grain white rice. The rice-to-gumbo ratio is a personal preference, but it should never be an afterthought." }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "See the Live Rankings" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Want to know who serves the best gumbo in New Orleans right now? Check out the " },
          {
            "type": "text",
            "marks": [{ "type": "link", "attrs": { "href": "/leaderboard/new-orleans-louisiana/gumbo" } }],
            "text": "live gumbo leaderboard"
          },
          { "type": "text", "text": " — updated in real-time as Forked users rate and battle their bowls." }
        ]
      }
    ]
  }',
  'published',
  'a1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  '2a8188fa-e530-4cc1-b775-e97bf07dd3fa',
  '2d45d5d3-03be-4ddd-8cc6-ed533d5f9ce7',
  'Best Gumbo in New Orleans — The Ultimate Guide | Forked',
  'Discover what makes great gumbo and see the live Elo-ranked leaderboard of the best gumbo in New Orleans.',
  now() - interval '2 days'
);

-- Post 2: General post WITHOUT city/dish references
INSERT INTO public.blog_posts (
  id, title, slug, excerpt, content, status,
  author_id, category_id,
  seo_title, seo_description, published_at
)
VALUES (
  'b1000000-0000-0000-0000-000000000002',
  'How Elo Rankings Create Better Food Discovery',
  'how-elo-rankings-create-better-food-discovery',
  'Why we chose an Elo rating system over traditional reviews, and how head-to-head battles lead to more honest dish rankings.',
  '{
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "The Problem with Traditional Reviews" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Traditional restaurant review platforms ask users to rate an entire experience on a simple scale. But this approach is fundamentally flawed — it conflates the food quality with service, ambiance, pricing, and personal biases." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "At Forked, we take a radically different approach. We do not rate restaurants. We rate " },
          { "type": "text", "marks": [{ "type": "italic" }], "text": "dishes" },
          { "type": "text", "text": ". And instead of aggregating numerical scores, we use a battle-tested ranking system borrowed from competitive chess: " },
          { "type": "text", "marks": [{ "type": "bold" }], "text": "Elo ratings" },
          { "type": "text", "text": "." }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "How Elo Works for Food" }]
      },
      {
        "type": "orderedList",
        "content": [
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Rate a dish." },
                  { "type": "text", "text": " Take a photo and give it a score from 1 to 10." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Battle it out." },
                  { "type": "text", "text": " The system pairs your dish against a similar one you have rated. Which was better? You decide." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Elo adjusts." },
                  { "type": "text", "text": " The winner gains points, the loser drops. An upset (a lower-rated dish beating a higher-rated one) causes a bigger shift." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Rankings emerge." },
                  { "type": "text", "text": " Over time, the best dishes rise to the top through thousands of community battles — not a single critic''s opinion." }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Why This Matters" }]
      },
      {
        "type": "blockquote",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "The best gumbo does not always come from the most famous restaurant. Elo helps surface the hidden gems that diners genuinely prefer." }
            ]
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "By focusing on individual dishes and using pairwise comparisons, Forked eliminates the noise of traditional reviews. The result is a leaderboard you can actually trust — built by the community, one battle at a time." }
        ]
      }
    ]
  }',
  'published',
  'a1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000003',
  'How Elo Rankings Create Better Food Discovery | Forked',
  'Learn why Forked uses Elo ratings from competitive chess to rank dishes, and how head-to-head battles produce more honest food rankings.',
  now() - interval '5 days'
);

-- =====================
-- 5. Post-Tag associations
-- =====================
INSERT INTO public.blog_post_tags (blog_post_id, blog_tag_id)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003');
