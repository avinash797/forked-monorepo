-- =============================================================================
-- HARDENED admin / moderation functions (guards added)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.close_restaurant(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $function$
DECLARE v_restaurant_name TEXT;
BEGIN
    -- FIX: moderation action — admins only.
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE public.restaurants
    SET is_closed = TRUE, closed_at = now(), updated_at = now()
    WHERE id = p_restaurant_id
    RETURNING name INTO v_restaurant_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Restaurant not found';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'restaurant_id', p_restaurant_id,
        'restaurant_name', v_restaurant_name,
        'closed_at', now()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_daily_stats(
    p_start_date date DEFAULT ((CURRENT_DATE - '30 days'::interval))::date,
    p_end_date   date DEFAULT CURRENT_DATE
)
RETURNS TABLE(day date, new_users bigint, new_ratings bigint, new_battles bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $function$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    WITH dates AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::INTERVAL)::DATE AS day
    )
    SELECT d.day,
        COALESCE((SELECT COUNT(*) FROM public.profiles         WHERE created_at::DATE = d.day), 0) AS new_users,
        COALESCE((SELECT COUNT(*) FROM public.personal_ratings WHERE created_at::DATE = d.day), 0) AS new_ratings,
        COALESCE((SELECT COUNT(*) FROM public.comparisons      WHERE created_at::DATE = d.day), 0) AS new_battles
    FROM dates d
    ORDER BY d.day;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_city_breakdown()
RETURNS TABLE(city_id uuid, city_name text, total_ratings bigint, total_battles bigint, total_restaurants bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $function$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    SELECT c.id AS city_id, c.name AS city_name,
        (SELECT COUNT(*) FROM public.personal_ratings pr
            JOIN public.restaurants res ON res.id = pr.restaurant_id
            WHERE res.city_id = c.id) AS total_ratings,
        (SELECT COUNT(*) FROM public.comparisons comp
            WHERE comp.user_id IN (
                SELECT pr.user_id FROM public.personal_ratings pr
                    JOIN public.restaurants res ON res.id = pr.restaurant_id
                    WHERE res.city_id = c.id)) AS total_battles,
        (SELECT COUNT(*) FROM public.restaurants WHERE city_id = c.id) AS total_restaurants
    FROM public.cities c
    WHERE c.is_active = true
    ORDER BY total_ratings DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_dish_type_breakdown()
RETURNS TABLE(dish_type_id uuid, dish_type_name text, total_ratings bigint, total_battles bigint, avg_score numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $function$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    SELECT dt.id AS dish_type_id, dt.name AS dish_type_name,
        (SELECT COUNT(*) FROM public.personal_ratings WHERE dish_type_id = dt.id) AS total_ratings,
        (SELECT COUNT(*) FROM public.comparisons      WHERE dish_type_id = dt.id) AS total_battles,
        (SELECT ROUND(AVG(derived_score)::NUMERIC, 1) FROM public.personal_ratings WHERE dish_type_id = dt.id) AS avg_score
    FROM public.dish_types dt
    WHERE dt.is_active = true
    ORDER BY total_ratings DESC;
END;
$function$;

-- =============================================================================
-- Remaining callable functions (verbatim from the live schema's final state)
-- =============================================================================

-- ---------- _update_global_dish_score ----------
CREATE OR REPLACE FUNCTION public._update_global_dish_score(p_restaurant_id uuid, p_dish_type_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_city_id UUID;
v_neighborhood_id UUID;
v_bayesian_c NUMERIC;
v_global_mean NUMERIC;
v_weighted_sum NUMERIC;
v_weighted_count NUMERIC;
v_total_ratings INTEGER;
v_bayesian_score NUMERIC;
v_raw_avg NUMERIC;
v_confidence TEXT;
v_featured_photo_url TEXT;
v_featured_rating_id UUID;
BEGIN -- Get restaurant geography
SELECT city_id,
    neighborhood_id INTO v_city_id,
    v_neighborhood_id
FROM restaurants
WHERE id = p_restaurant_id;
-- Load Bayesian constant
SELECT value INTO v_bayesian_c
FROM app_constants
WHERE key = 'BAYESIAN_C';
-- Calculate city-level global mean for this dish type
SELECT COALESCE(AVG(pr.derived_score), 5.0) INTO v_global_mean
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
WHERE pr.dish_type_id = p_dish_type_id
    AND pr.battle_status = 'completed'
    AND r.city_id = v_city_id;
-- Calculate weighted scores for this restaurant+dish
-- Ratings with a photo carry 1.25x weight vs. ratings without a photo
SELECT COALESCE(SUM(pr.derived_score * p.credibility_score * CASE WHEN pr.photo_url IS NOT NULL THEN 1.25 ELSE 1.0 END), 0),
    COALESCE(SUM(p.credibility_score * CASE WHEN pr.photo_url IS NOT NULL THEN 1.25 ELSE 1.0 END), 0),
    COUNT(*),
    COALESCE(AVG(pr.derived_score), 0) INTO v_weighted_sum,
    v_weighted_count,
    v_total_ratings,
    v_raw_avg
FROM personal_ratings pr
    JOIN profiles p ON p.id = pr.user_id
WHERE pr.restaurant_id = p_restaurant_id
    AND pr.dish_type_id = p_dish_type_id
    AND pr.battle_status = 'completed';
-- Bayesian average
v_bayesian_score := (v_bayesian_c * v_global_mean + v_weighted_sum) / (v_bayesian_c + v_weighted_count);
-- Confidence tier (based on raw rating count)
v_confidence := CASE
    WHEN v_total_ratings < 5 THEN 'low'
    WHEN v_total_ratings < 10 THEN 'medium'
    WHEN v_total_ratings < 25 THEN 'high'
    ELSE 'very_high'
END;
-- Featured photo: pick highest-rated user's photo
SELECT pr.photo_url,
    pr.id INTO v_featured_photo_url,
    v_featured_rating_id
FROM personal_ratings pr
WHERE pr.restaurant_id = p_restaurant_id
    AND pr.dish_type_id = p_dish_type_id
    AND pr.battle_status = 'completed'
    AND pr.photo_url IS NOT NULL
ORDER BY pr.elo_score DESC
LIMIT 1;
-- Upsert global score
INSERT INTO global_dish_scores (
        restaurant_id,
        dish_type_id,
        city_id,
        neighborhood_id,
        raw_weighted_avg,
        weighted_score_sum,
        weighted_rating_count,
        total_ratings,
        bayesian_score,
        confidence_tier,
        featured_photo_url,
        featured_rating_id,
        updated_at
    )
VALUES (
        p_restaurant_id,
        p_dish_type_id,
        v_city_id,
        v_neighborhood_id,
        v_raw_avg,
        v_weighted_sum,
        v_weighted_count,
        v_total_ratings,
        ROUND(v_bayesian_score, 2),
        v_confidence,
        v_featured_photo_url,
        v_featured_rating_id,
        now()
    ) ON CONFLICT (restaurant_id, dish_type_id) DO
UPDATE
SET raw_weighted_avg = EXCLUDED.raw_weighted_avg,
    weighted_score_sum = EXCLUDED.weighted_score_sum,
    weighted_rating_count = EXCLUDED.weighted_rating_count,
    total_ratings = EXCLUDED.total_ratings,
    bayesian_score = EXCLUDED.bayesian_score,
    confidence_tier = EXCLUDED.confidence_tier,
    featured_photo_url = EXCLUDED.featured_photo_url,
    featured_rating_id = EXCLUDED.featured_rating_id,
    updated_at = now();
END;
$function$;

-- ---------- _update_profile_stats ----------
CREATE OR REPLACE FUNCTION public._update_profile_stats(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_total_ratings INTEGER;
v_total_comparisons INTEGER;
v_cred_scale NUMERIC;
v_credibility NUMERIC;
BEGIN
SELECT value INTO v_cred_scale
FROM app_constants
WHERE key = 'CREDIBILITY_SCALE';
SELECT COUNT(*) FILTER (
        WHERE battle_status = 'completed'
    ),
    COALESCE(SUM(comparison_count), 0) INTO v_total_ratings,
    v_total_comparisons
FROM personal_ratings
WHERE user_id = p_user_id;
-- Credibility: log(1 + total_ratings) / log(1 + SCALE), capped at 1.0
v_credibility := LEAST(
    LOG(1 + v_total_ratings) / LOG(1 + v_cred_scale),
    1.0
);
UPDATE profiles
SET total_ratings = v_total_ratings,
    total_comparisons = v_total_comparisons,
    credibility_score = ROUND(v_credibility, 2),
    updated_at = now()
WHERE id = p_user_id;
END;
$function$;

-- ---------- anonymize_user_data ----------
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_ratings_count INTEGER;
    v_comparisons_count INTEGER;
    v_photo_paths TEXT[];
    v_avatar_path TEXT;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID required';
    END IF;

    -- FIX: `v_user_id != auth.uid()` was NULL for an anon caller (uuid != NULL
    -- → NULL, not TRUE), letting anyone with the anon key anonymize any account;
    -- it also rejected the legitimate admin ban path. Allow self OR admin only,
    -- and reject unauthenticated callers explicitly.
    IF auth.uid() IS NULL
       OR (v_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
        RAISE EXCEPTION 'Not authorized to anonymize this account';
    END IF;

    -- Count for response
    SELECT COUNT(*) INTO v_ratings_count
    FROM public.personal_ratings
    WHERE user_id = v_user_id;

    SELECT COUNT(*) INTO v_comparisons_count
    FROM public.comparisons
    WHERE user_id = v_user_id;

    -- Collect storage paths before clearing them
    SELECT ARRAY_AGG(photo_storage_path)
    INTO v_photo_paths
    FROM public.personal_ratings
    WHERE user_id = v_user_id
      AND photo_storage_path IS NOT NULL;

    SELECT avatar_url INTO v_avatar_path
    FROM public.profiles
    WHERE id = v_user_id;

    -- Anonymize profile (keep the row as a tombstone)
    UPDATE public.profiles
    SET username = 'anon_' || SUBSTRING(id::TEXT, 1, 8),
        display_name = 'Anonymous',
        avatar_url = NULL,
        bio = NULL,
        expo_push_token = NULL,
        push_enabled = FALSE,
        updated_at = now()
    WHERE id = v_user_id;

    -- Clear personal data from ratings (keep scores for leaderboard)
    UPDATE public.personal_ratings
    SET notes = NULL,
        photo_url = NULL,
        photo_storage_path = NULL,
        exif_location = NULL,
        exif_timestamp = NULL,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Clean up transient battle sessions
    DELETE FROM public.battle_sessions
    WHERE user_id = v_user_id;

    -- Return photo paths so the edge function can delete storage objects
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'ratings_anonymized', v_ratings_count,
        'comparisons_preserved', v_comparisons_count,
        'photo_storage_paths', COALESCE(to_jsonb(v_photo_paths), '[]'::jsonb),
        'avatar_path', v_avatar_path,
        'note', 'Ratings preserved for leaderboard integrity. Personal data removed.'
    );
END;
$function$;

-- ---------- award_badge_manual ----------
CREATE OR REPLACE FUNCTION public.award_badge_manual(p_user_id uuid, p_badge_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_badge_id UUID;
BEGIN IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can award badges manually';
END IF;
SELECT id INTO v_badge_id
FROM badge_definitions
WHERE slug = p_badge_slug;
IF v_badge_id IS NULL THEN RAISE EXCEPTION 'Badge not found: %',
p_badge_slug;
END IF;
INSERT INTO user_badges (user_id, badge_id)
VALUES (p_user_id, v_badge_id) ON CONFLICT (user_id, badge_id) DO NOTHING;
RETURN jsonb_build_object(
    'success',
    true,
    'badge_slug',
    p_badge_slug,
    'user_id',
    p_user_id
);
END;
$function$;

-- ---------- block_user ----------
CREATE OR REPLACE FUNCTION public.block_user(p_rating_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_blocker_id      UUID := auth.uid();
    v_blocked_user_id UUID;
    v_already_blocked BOOLEAN;
BEGIN
    IF v_blocker_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Resolve the author of the rating
    SELECT user_id INTO v_blocked_user_id
    FROM personal_ratings
    WHERE id = p_rating_id;

    IF v_blocked_user_id IS NULL THEN
        RAISE EXCEPTION 'Rating not found';
    END IF;

    IF v_blocked_user_id = v_blocker_id THEN
        RAISE EXCEPTION 'Cannot block yourself';
    END IF;

    -- Idempotent: return success without erroring if already blocked
    SELECT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE blocker_id      = v_blocker_id
          AND blocked_user_id = v_blocked_user_id
    ) INTO v_already_blocked;

    IF v_already_blocked THEN
        RETURN json_build_object('success', true, 'already_blocked', true);
    END IF;

    INSERT INTO blocked_users (blocker_id, blocked_user_id)
    VALUES (v_blocker_id, v_blocked_user_id);

    RETURN json_build_object('success', true, 'already_blocked', false);
END;
$function$;

-- ---------- check_city_is_new ----------
CREATE OR REPLACE FUNCTION public.check_city_is_new(p_city_id uuid)
 RETURNS TABLE(is_new boolean, city_name text, city_state text, city_country text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
SELECT NOT c.is_active AS is_new,
    c.name AS city_name,
    c.state AS city_state,
    COALESCE(c.country, 'USA') AS city_country
FROM public.cities c
WHERE c.id = p_city_id;
$function$;

-- ---------- check_rate_limit ----------
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(is_rate_limited boolean, ratings_last_hour integer, max_allowed integer, can_rate boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_count INTEGER;
v_max INTEGER := 20;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT COUNT(*)::INTEGER INTO v_count
FROM public.personal_ratings
WHERE user_id = v_user_id
    AND created_at > now() - INTERVAL '1 hour';
RETURN QUERY
SELECT (v_count >= v_max),
    v_count,
    v_max,
    (v_count < v_max);
END;
$function$;

-- ---------- check_user_skip_rate ----------
CREATE OR REPLACE FUNCTION public.check_user_skip_rate(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_comparisons bigint, skipped_count bigint, skip_rate numeric, should_warn boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_total BIGINT;
v_skipped BIGINT;
v_rate DECIMAL;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT COUNT(*),
    COUNT(*) FILTER (
        WHERE result = 'skipped'
    ) INTO v_total,
    v_skipped
FROM public.comparisons
WHERE user_id = v_user_id
    AND created_at > now() - INTERVAL '30 days';
v_rate := CASE
    WHEN v_total > 0 THEN v_skipped::DECIMAL / v_total
    ELSE 0
END;
RETURN QUERY
SELECT v_total,
    v_skipped,
    ROUND(v_rate, 3),
    (
        v_rate > 0.5
        AND v_total >= 10
    );
END;
$function$;

-- ---------- create_rating ----------
CREATE OR REPLACE FUNCTION public.create_rating(p_restaurant_id uuid, p_dish_type_id uuid, p_sentiment text, p_photo_url text DEFAULT NULL::text, p_photo_storage_path text DEFAULT NULL::text, p_variation_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text, p_taste_tag_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_rating_id UUID;
    v_initial_elo NUMERIC;
    v_zone_min NUMERIC;
    v_zone_max NUMERIC;
    v_is_re_rating BOOLEAN := false;
    v_candidates UUID [];
    v_candidate_count INTEGER;
    v_battle_id UUID;
    v_first_opponent JSONB := NULL;
    v_mid_idx INTEGER;
    v_opponent_rating RECORD;
    v_new_badges JSONB := '[]'::JSONB;
BEGIN
-- -------------------------------------------------------
-- 1. Resolve initial Elo from sentiment
-- -------------------------------------------------------
SELECT value INTO v_initial_elo
FROM app_constants
WHERE key = 'ELO_INITIAL_' || UPPER(
        CASE p_sentiment
            WHEN 'liked' THEN 'LIKED'
            WHEN 'okay' THEN 'OKAY'
            WHEN 'disliked' THEN 'DISLIKED'
        END
    );
IF v_initial_elo IS NULL THEN
    RAISE EXCEPTION 'Invalid sentiment: %', p_sentiment;
END IF;
-- -------------------------------------------------------
-- 2. Resolve search zone boundaries
-- -------------------------------------------------------
CASE p_sentiment
    WHEN 'liked' THEN
        SELECT value INTO v_zone_min FROM app_constants WHERE key = 'ZONE_LIKED_MIN';
        SELECT value INTO v_zone_max FROM app_constants WHERE key = 'ELO_MAX';
    WHEN 'okay' THEN
        SELECT value INTO v_zone_min FROM app_constants WHERE key = 'ZONE_OKAY_MIN';
        SELECT value INTO v_zone_max FROM app_constants WHERE key = 'ZONE_OKAY_MAX';
    WHEN 'disliked' THEN
        SELECT value INTO v_zone_min FROM app_constants WHERE key = 'ELO_MIN';
        SELECT value INTO v_zone_max FROM app_constants WHERE key = 'ZONE_DISLIKED_MAX';
END CASE;
-- -------------------------------------------------------
-- 3. Upsert the personal rating (photo_url stored as-is; NULL when no photo)
-- -------------------------------------------------------
SELECT id INTO v_rating_id
FROM personal_ratings
WHERE user_id = v_user_id
    AND restaurant_id = p_restaurant_id
    AND dish_type_id = p_dish_type_id;

IF v_rating_id IS NOT NULL THEN
    v_is_re_rating := true;
    UPDATE battle_sessions
    SET status = 'abandoned', updated_at = now()
    WHERE rating_id = v_rating_id AND status = 'active';

    UPDATE personal_ratings
    SET sentiment = p_sentiment,
        elo_score = v_initial_elo,
        comparison_count = 0,
        battle_status = 'pending',
        photo_url = p_photo_url,
        photo_storage_path = COALESCE(p_photo_storage_path, photo_storage_path),
        variation_id = p_variation_id,
        notes = p_notes,
        updated_at = now()
    WHERE id = v_rating_id;

    DELETE FROM personal_rating_tags WHERE rating_id = v_rating_id;
ELSE
    INSERT INTO personal_ratings (
            user_id, restaurant_id, dish_type_id,
            sentiment, elo_score, comparison_count, battle_status,
            photo_url, photo_storage_path, variation_id, notes
        )
    VALUES (
            v_user_id, p_restaurant_id, p_dish_type_id,
            p_sentiment, v_initial_elo, 0, 'pending',
            p_photo_url, p_photo_storage_path, p_variation_id, p_notes
        )
    RETURNING id INTO v_rating_id;
END IF;
-- -------------------------------------------------------
-- 4. Insert taste tags
-- -------------------------------------------------------
IF p_taste_tag_ids IS NOT NULL AND array_length(p_taste_tag_ids, 1) > 0 THEN
    INSERT INTO personal_rating_tags (rating_id, tag_id)
    SELECT v_rating_id, unnest(p_taste_tag_ids)
    ON CONFLICT DO NOTHING;
END IF;
-- -------------------------------------------------------
-- 5. Build candidate list for binary search
-- -------------------------------------------------------
SELECT ARRAY_AGG(id ORDER BY elo_score DESC) INTO v_candidates
FROM personal_ratings
WHERE user_id = v_user_id
    AND dish_type_id = p_dish_type_id
    AND id != v_rating_id
    AND battle_status = 'completed'
    AND elo_score >= v_zone_min
    AND elo_score <= v_zone_max;

v_candidates := COALESCE(v_candidates, '{}');
v_candidate_count := COALESCE(array_length(v_candidates, 1), 0);
-- -------------------------------------------------------
-- 6. If no candidates, battle is instantly complete
-- -------------------------------------------------------
IF v_candidate_count = 0 THEN
    UPDATE personal_ratings SET battle_status = 'completed' WHERE id = v_rating_id;
    PERFORM _update_profile_stats(v_user_id);
    PERFORM _update_global_dish_score(p_restaurant_id, p_dish_type_id);
    v_new_badges := public.evaluate_badges(v_user_id);
    RETURN jsonb_build_object(
        'rating_id', v_rating_id,
        'battle_id', NULL,
        'opponent', NULL,
        'battle_complete', true,
        'is_re_rating', v_is_re_rating,
        'elo_score', v_initial_elo,
        'derived_score', ROUND(((v_initial_elo - 1000) / 1000.0) * 10.0, 1),
        'new_badges', v_new_badges
    );
END IF;
-- -------------------------------------------------------
-- 7. Create battle session
-- -------------------------------------------------------
UPDATE personal_ratings SET battle_status = 'in_progress' WHERE id = v_rating_id;

INSERT INTO battle_sessions (
        user_id, rating_id, dish_type_id,
        candidate_ids, low_idx, high_idx, current_step
    )
VALUES (
        v_user_id, v_rating_id, p_dish_type_id,
        v_candidates, 0, v_candidate_count - 1, 1
    )
RETURNING id INTO v_battle_id;
-- -------------------------------------------------------
-- 8. Return first opponent (midpoint)
--    Resolve placeholder at read time so photo_url is never null in the UI.
-- -------------------------------------------------------
v_mid_idx := (0 + (v_candidate_count - 1)) / 2;

SELECT id, restaurant_id, elo_score,
    ROUND(((LEAST(GREATEST(elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1) AS display_score
    INTO v_opponent_rating
FROM personal_ratings
WHERE id = v_candidates[v_mid_idx + 1];

SELECT jsonb_build_object(
        'rating_id', v_opponent_rating.id,
        'restaurant_id', v_opponent_rating.restaurant_id,
        'restaurant_name', r.name,
        'elo_score', v_opponent_rating.elo_score,
        'derived_score', v_opponent_rating.display_score,
        'photo_url', COALESCE(pr.photo_url, dt.placeholder_photo_url)
    ) INTO v_first_opponent
FROM restaurants r
    JOIN personal_ratings pr ON pr.id = v_opponent_rating.id
    JOIN dish_types dt ON dt.id = pr.dish_type_id
WHERE r.id = v_opponent_rating.restaurant_id;

RETURN jsonb_build_object(
    'rating_id', v_rating_id,
    'battle_id', v_battle_id,
    'opponent', v_first_opponent,
    'opponent_index', v_mid_idx,
    'battle_complete', false,
    'is_re_rating', v_is_re_rating,
    'total_candidates', v_candidate_count,
    'elo_score', v_initial_elo
);
END;
$function$;
