-- ============================================
-- SEED LAUNCH DATA
-- ============================================
-- New Orleans
INSERT INTO public.cities (
        name,
        state,
        country,
        slug,
        is_active,
        coordinates
    )
VALUES (
        'New Orleans',
        'Louisiana',
        'USA',
        'new-orleans',
        true,
        extensions.ST_SetSRID(extensions.ST_MakePoint(-90.0715, 29.9511), 4326)::extensions.geography
    );
-- Neighborhoods (NOLA)
INSERT INTO public.neighborhoods (city_id, name, slug)
SELECT c.id,
    n.name,
    n.slug
FROM public.cities c
    CROSS JOIN (
        VALUES ('French Quarter', 'french-quarter'),
            ('Tremé', 'treme'),
            ('Marigny', 'marigny'),
            ('Bywater', 'bywater'),
            ('7th Ward', '7th-ward'),
            ('Garden District', 'garden-district'),
            ('Uptown', 'uptown'),
            ('Mid-City', 'mid-city'),
            ('Warehouse District', 'warehouse-district'),
            ('CBD', 'cbd')
    ) AS n(name, slug)
WHERE c.slug = 'new-orleans';
-- Launch Dish Types (5 only)
INSERT INTO public.dish_types (
        name,
        slug,
        emoji,
        is_active,
        launch_order,
        aliases
    )
VALUES (
        'Gumbo',
        'gumbo',
        '🍲',
        true,
        1,
        ARRAY ['seafood gumbo', 'chicken gumbo', 'gumbo z''herbes', 'ya-ya']
    ),
    (
        'Po''boy',
        'po-boy',
        '🥪',
        true,
        2,
        ARRAY ['po boy', 'poor boy', 'poboy', 'shrimp po boy', 'roast beef po boy']
    ),
    (
        'Fried Chicken',
        'fried-chicken',
        '🍗',
        true,
        3,
        ARRAY ['southern fried chicken', 'crispy chicken']
    ),
    (
        'Muffuletta',
        'muffuletta',
        '🥙',
        true,
        4,
        ARRAY ['muffaletta', 'muffulata']
    ),
    (
        'Crawfish Étouffée',
        'crawfish-etouffee',
        '🦞',
        true,
        5,
        ARRAY ['etouffee', 'crawfish etouffee', 'crayfish etouffee']
    );
-- Taste Tags
INSERT INTO public.taste_tags (name, slug)
VALUES ('Dark roux', 'dark-roux'),
    ('Light roux', 'light-roux'),
    ('Seafood-heavy', 'seafood-heavy'),
    ('Spicy', 'spicy'),
    ('Rich', 'rich'),
    ('Smoky', 'smoky'),
    ('Crispy', 'crispy'),
    ('Hearty', 'hearty'),
    ('Traditional', 'traditional'),
    ('Modern twist', 'modern-twist'),
    ('Generous portion', 'generous-portion'),
    ('Perfectly seasoned', 'perfectly-seasoned'),
    ('Tender', 'tender'),
    ('Juicy', 'juicy'),
    ('Flavorful', 'flavorful');
