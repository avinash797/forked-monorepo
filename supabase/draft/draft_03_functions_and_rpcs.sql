-- =============================================================================
-- DRAFT 3 of 4: Functions & RPCs
--
-- Every callable public function, consolidated from the live database's final
-- state. Trigger functions and the is_admin() helper live in drafts 4 and 2
-- respectively. pg_trgm operator functions are provided by the extension and
-- are not redefined here.
--
-- Discrepancies fixed vs. the live database (see draft/README.md):
--   * get_admin_daily_stats / get_admin_city_breakdown /
--     get_admin_dish_type_breakdown now enforce is_admin(). In prod they were
--     SECURITY DEFINER with NO guard, so any authenticated user could read
--     admin analytics directly via rpc(). Rewritten as plpgsql with a guard.
--   * close_restaurant() now enforces is_admin(). In prod it was SECURITY
--     DEFINER with no guard, letting any authenticated user close any
--     restaurant (a moderation action) straight through the RPC, bypassing RLS.
--   * search_path pinned on every SECURITY DEFINER / SQL function that was
--     missing it (advisor: function_search_path_mutable) — see the ALTERs at
--     the end of this file.
--   * EXECUTE on internal-only functions (score/stat helpers, badge
--     evaluation, the cron snapshot) is revoked from anon/authenticated — see
--     the REVOKEs at the end. Their internal callers are other SECURITY
--     DEFINER functions / pg_cron, which run as the owner and are unaffected.
-- =============================================================================

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

-- ---------- delete_user_account ----------
CREATE OR REPLACE FUNCTION public.delete_user_account(p_confirm boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_ratings_count INTEGER;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
IF NOT p_confirm THEN RAISE EXCEPTION 'Must confirm deletion by passing p_confirm = true';
END IF;
SELECT COUNT(*) INTO v_ratings_count
FROM public.personal_ratings
WHERE user_id = v_user_id;
DELETE FROM public.personal_ratings
WHERE user_id = v_user_id;
DELETE FROM public.comparisons
WHERE user_id = v_user_id;
DELETE FROM public.profiles
WHERE id = v_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'user_id',
    v_user_id,
    'ratings_deleted',
    v_ratings_count,
    'note',
    'Profile and ratings deleted. Auth account must be deleted separately.'
);
END;
$function$;

-- ---------- evaluate_badges ----------
CREATE OR REPLACE FUNCTION public.evaluate_badges(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_badge RECORD;
v_count INTEGER;
v_earned BOOLEAN;
v_inserted UUID;
v_new_badges JSONB := '[]'::JSONB;
BEGIN FOR v_badge IN
SELECT bd.*
FROM badge_definitions bd
WHERE bd.is_active = true
    AND bd.rule_type != 'manual'
    AND NOT EXISTS (
        SELECT 1
        FROM user_badges ub
        WHERE ub.user_id = p_user_id
            AND ub.badge_id = bd.id
    )
ORDER BY bd.sort_order LOOP v_earned := false;
v_count := 0;
CASE
    v_badge.rule_type
    WHEN 'total_ratings' THEN
    SELECT COUNT(*) INTO v_count
    FROM personal_ratings
    WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'dish_type_count' THEN
SELECT COUNT(*) INTO v_count
FROM personal_ratings
WHERE user_id = p_user_id
    AND dish_type_id = v_badge.dish_type_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'total_comparisons' THEN
SELECT COUNT(*) INTO v_count
FROM comparisons
WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'cities_count' THEN
SELECT COUNT(DISTINCT r.city_id) INTO v_count
FROM personal_ratings pr
    JOIN restaurants r ON r.id = pr.restaurant_id
WHERE pr.user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
WHEN 'dish_types_count' THEN
SELECT COUNT(DISTINCT dish_type_id) INTO v_count
FROM personal_ratings
WHERE user_id = p_user_id;
v_earned := v_count >= v_badge.threshold;
ELSE v_earned := false;
END CASE
;
IF v_earned THEN v_inserted := NULL;
INSERT INTO user_badges (user_id, badge_id)
VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING
RETURNING id INTO v_inserted;
IF v_inserted IS NOT NULL THEN v_new_badges := v_new_badges || jsonb_build_array(
    jsonb_build_object(
        'id',
        v_badge.id,
        'slug',
        v_badge.slug,
        'name',
        v_badge.name,
        'description',
        v_badge.description,
        'image_url',
        v_badge.image_url
    )
);
END IF;
END IF;
END LOOP;
RETURN v_new_badges;
END;
$function$;

-- ---------- find_nearby_restaurants ----------
CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(p_lat double precision, p_long double precision, p_radius_meters double precision DEFAULT 100.0, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, address text, city_id uuid, neighborhood_id uuid, coordinates geography, google_place_id text, phone text, website text, is_verified boolean, is_closed boolean, closed_at timestamp with time zone, types text[], created_at timestamp with time zone, updated_at timestamp with time zone, distance_meters double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_point extensions.geography;
BEGIN v_user_point := extensions.ST_SetSRID(extensions.ST_MakePoint(p_long, p_lat), 4326)::extensions.geography;
RETURN QUERY
SELECT r.id,
    r.name,
    r.address,
    r.city_id,
    r.neighborhood_id,
    r.coordinates,
    r.google_place_id,
    r.phone,
    r.website,
    r.is_verified,
    r.is_closed,
    r.closed_at,
    r.types,
    r.created_at,
    r.updated_at,
    extensions.ST_Distance(r.coordinates, v_user_point) AS distance_meters
FROM public.restaurants r
WHERE r.coordinates IS NOT NULL
    AND extensions.ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
ORDER BY distance_meters ASC
LIMIT p_limit;
END;
$function$;

-- ---------- get_discover_heroes ----------
CREATE OR REPLACE FUNCTION public.get_discover_heroes(p_city_id uuid DEFAULT NULL::uuid, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(id uuid, restaurant_id uuid, restaurant_name text, dish_type_id uuid, city_id uuid, neighborhood_id uuid, neighborhood_name text, bayesian_score numeric, raw_weighted_avg numeric, total_ratings integer, confidence_tier text, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_id UUID;
v_user_point extensions.GEOGRAPHY;
BEGIN v_user_id := auth.uid();
IF p_user_lat IS NOT NULL
AND p_user_long IS NOT NULL THEN v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
END IF;
RETURN QUERY
SELECT gds.id,
    gds.restaurant_id,
    r.name AS restaurant_name,
    gds.dish_type_id,
    gds.city_id,
    gds.neighborhood_id,
    n.name AS neighborhood_name,
    gds.bayesian_score,
    gds.raw_weighted_avg,
    gds.total_ratings,
    gds.confidence_tier,
    gds.featured_photo_url
FROM public.global_dish_scores gds
    JOIN public.restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
    AND (
        p_city_id IS NULL
        OR gds.city_id = p_city_id
    )
    AND (
        v_user_point IS NULL
        OR p_radius_meters IS NULL
        OR ST_DWithin(
            r.coordinates,
            v_user_point,
            p_radius_meters::double precision
        )
    )
    AND (
        v_user_id IS NULL
        OR NOT EXISTS (
            SELECT 1
            FROM public.personal_ratings pr
            WHERE pr.user_id = v_user_id
                AND pr.restaurant_id = gds.restaurant_id
        )
    )
ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$function$;

-- ---------- get_discover_rising_stars ----------
CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(p_city_id uuid DEFAULT NULL::uuid, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_score numeric DEFAULT 7.5, p_max_ratings integer DEFAULT 10, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(id uuid, restaurant_id uuid, restaurant_name text, dish_type_id uuid, dish_type_name text, dish_type_emoji text, dish_type_icon text, city_id uuid, neighborhood_id uuid, neighborhood_name text, bayesian_score numeric, raw_weighted_avg numeric, total_ratings integer, confidence_tier text, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_id UUID;
v_user_point extensions.GEOGRAPHY;
BEGIN v_user_id := auth.uid();
IF p_user_lat IS NOT NULL
AND p_user_long IS NOT NULL THEN v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
END IF;
RETURN QUERY
SELECT gds.id,
    gds.restaurant_id,
    r.name AS restaurant_name,
    gds.dish_type_id,
    dt.name AS dish_type_name,
    dt.emoji AS dish_type_emoji,
    dt.icon AS dish_type_icon,
    gds.city_id,
    gds.neighborhood_id,
    n.name AS neighborhood_name,
    gds.bayesian_score,
    gds.raw_weighted_avg,
    gds.total_ratings,
    gds.confidence_tier,
    gds.featured_photo_url
FROM public.global_dish_scores gds
    JOIN public.restaurants r ON r.id = gds.restaurant_id
    JOIN public.dish_types dt ON dt.id = gds.dish_type_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.bayesian_score >= p_min_score
    AND gds.total_ratings < p_max_ratings
    AND gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
    AND (
        p_city_id IS NULL
        OR gds.city_id = p_city_id
    )
    AND (
        v_user_point IS NULL
        OR p_radius_meters IS NULL
        OR ST_DWithin(
            r.coordinates,
            v_user_point,
            p_radius_meters::double precision
        )
    )
    AND (
        v_user_id IS NULL
        OR NOT EXISTS (
            SELECT 1
            FROM public.personal_ratings pr
            WHERE pr.user_id = v_user_id
                AND pr.restaurant_id = gds.restaurant_id
        )
    )
ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$function$;

-- ---------- get_dish_type_entry_counts ----------
CREATE OR REPLACE FUNCTION public.get_dish_type_entry_counts(p_city_id uuid)
 RETURNS TABLE(dish_type_id uuid, entry_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT dish_type_id, COUNT(*)::BIGINT AS entry_count
    FROM public.global_dish_scores
    WHERE city_id = p_city_id
      AND total_ratings >= 2
    GROUP BY dish_type_id;
$function$;

-- ---------- get_leaderboard ----------
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_dish_type_id uuid, p_city_id uuid, p_neighborhood_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_results JSONB;
BEGIN
SELECT jsonb_agg(
        row_data
        ORDER BY rank_num
    ) INTO v_results
FROM (
        SELECT jsonb_build_object(
                'rank',
                ROW_NUMBER() OVER (
                    ORDER BY gds.bayesian_score DESC
                ),
                'restaurant_id',
                r.id,
                'restaurant_name',
                r.name,
                'address',
                r.address,
                'neighborhood_name',
                n.name,
                'bayesian_score',
                FLOOR(gds.bayesian_score * 10) / 10,
                'total_ratings',
                gds.total_ratings,
                'confidence_tier',
                gds.confidence_tier,
                'featured_photo_url',
                gds.featured_photo_url
            ) AS row_data,
            ROW_NUMBER() OVER (
                ORDER BY gds.bayesian_score DESC
            ) AS rank_num
        FROM global_dish_scores gds
            JOIN restaurants r ON r.id = gds.restaurant_id
            LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
        WHERE gds.dish_type_id = p_dish_type_id
            AND gds.city_id = p_city_id
            AND (
                p_neighborhood_id IS NULL
                OR gds.neighborhood_id = p_neighborhood_id
            )
            AND gds.total_ratings >= 2
        ORDER BY gds.bayesian_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- ---------- get_my_best_ever ----------
CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(dish_type_id uuid, dish_type_name text, dish_type_emoji text, dish_type_icon text, rating_id uuid, restaurant_id uuid, restaurant_name text, city_name text, neighborhood_name text, variation_name text, sentiment text, derived_score numeric, photo_url text, rated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;
    RETURN QUERY
    SELECT DISTINCT ON (pr.dish_type_id)
        pr.dish_type_id,
        dt.name AS dish_type_name,
        dt.emoji AS dish_type_emoji,
        dt.icon AS dish_type_icon,
        pr.id AS rating_id,
        pr.restaurant_id,
        r.name AS restaurant_name,
        c.name AS city_name,
        n.name AS neighborhood_name,
        dtv.name AS variation_name,
        pr.sentiment,
        pr.derived_score,
        COALESCE(pr.photo_url, dt.placeholder_photo_url) AS photo_url,
        pr.created_at AS rated_at
    FROM public.personal_ratings pr
        JOIN public.dish_types dt ON dt.id = pr.dish_type_id
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        LEFT JOIN public.cities c ON c.id = r.city_id
        LEFT JOIN public.neighborhoods n ON n.id = r.neighborhood_id
        LEFT JOIN public.dish_type_variations dtv ON dtv.id = pr.variation_id
    WHERE pr.user_id = v_user_id
        AND pr.derived_score IS NOT NULL
    ORDER BY pr.dish_type_id, pr.derived_score DESC NULLS LAST;
END;
$function$;

-- ---------- get_nearby_leaderboard ----------
CREATE OR REPLACE FUNCTION public.get_nearby_leaderboard(p_latitude double precision, p_longitude double precision, p_radius_meters integer, p_dish_type_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, restaurant_id uuid, restaurant_name text, neighborhood_name text, distance_meters double precision, bayesian_score numeric, confidence_tier text, raw_weighted_avg numeric, total_ratings integer, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_user_point extensions.GEOGRAPHY;
BEGIN v_user_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY gds.bayesian_score DESC
    )::BIGINT AS rank,
    gds.restaurant_id,
    r.name AS restaurant_name,
    n.name AS neighborhood_name,
    ST_Distance(r.coordinates, v_user_point) AS distance_meters,
    gds.bayesian_score,
    gds.confidence_tier,
    gds.raw_weighted_avg,
    gds.total_ratings,
    gds.featured_photo_url
FROM public.global_dish_scores gds
    JOIN public.restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.dish_type_id = p_dish_type_id
    AND ST_DWithin(r.coordinates, v_user_point, p_radius_meters)
    AND gds.total_ratings >= 2
    AND r.is_closed = false
ORDER BY gds.bayesian_score DESC
LIMIT p_limit;
END;
$function$;

-- ---------- get_personal_dish_type_counts ----------
CREATE OR REPLACE FUNCTION public.get_personal_dish_type_counts(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_result JSONB;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT jsonb_object_agg(dt.name, cnt) INTO v_result
FROM (
        SELECT dish_type_id,
            COUNT(*) AS cnt
        FROM public.personal_ratings
        WHERE user_id = v_user_id
        GROUP BY dish_type_id
    ) r
    JOIN public.dish_types dt ON dt.id = r.dish_type_id;
RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

-- ---------- get_personal_rankings ----------
CREATE OR REPLACE FUNCTION public.get_personal_rankings(p_dish_type_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_results JSONB;
BEGIN
SELECT jsonb_agg(row_data ORDER BY rank_num) INTO v_results
FROM (
        SELECT jsonb_build_object(
                'rank',             ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC),
                'rating_id',        pr.id,
                'restaurant_id',    r.id,
                'restaurant_name',  r.name,
                'elo_score',        pr.elo_score,
                'derived_score',    pr.derived_score,
                'sentiment',        pr.sentiment,
                'photo_url',        COALESCE(pr.photo_url, dt.placeholder_photo_url),
                'comparison_count', pr.comparison_count,
                'notes',            pr.notes,
                'rated_at',         pr.updated_at,
                'variation_name',   dtv.name,
                'neighborhood_name', n.name,
                'city_name',        c.name
            ) AS row_data,
            ROW_NUMBER() OVER (ORDER BY pr.elo_score DESC) AS rank_num
        FROM personal_ratings pr
            JOIN restaurants r ON r.id = pr.restaurant_id
            JOIN dish_types dt ON dt.id = pr.dish_type_id
            LEFT JOIN dish_type_variations dtv ON dtv.id = pr.variation_id
            LEFT JOIN neighborhoods n ON n.id = r.neighborhood_id
            LEFT JOIN cities c ON c.id = r.city_id
        WHERE pr.user_id = v_user_id
            AND pr.dish_type_id = p_dish_type_id
            AND pr.battle_status = 'completed'
        ORDER BY pr.elo_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- ---------- get_rank_delta ----------
CREATE OR REPLACE FUNCTION public.get_rank_delta(p_restaurant_id uuid, p_dish_type_id uuid, p_city_id uuid, p_period text DEFAULT 'week'::text, p_scope text DEFAULT 'city'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_days          INTEGER;
    v_current_rank  INTEGER;
    v_past_rank     INTEGER;
    v_current_score NUMERIC;
    v_past_score    NUMERIC;
BEGIN
    v_days := CASE p_period
        WHEN 'day'   THEN 1
        WHEN 'week'  THEN 7
        WHEN 'month' THEN 30
        WHEN 'year'  THEN 365
        ELSE 7
    END;

    -- Most recent snapshot
    SELECT rank_position, bayesian_score
    INTO v_current_rank, v_current_score
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
    ORDER BY snapshot_date DESC
    LIMIT 1;

    -- Closest snapshot at or before the period boundary
    SELECT rank_position, bayesian_score
    INTO v_past_rank, v_past_score
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
      AND snapshot_date <= CURRENT_DATE - v_days
    ORDER BY snapshot_date DESC
    LIMIT 1;

    IF v_current_rank IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'current_rank',  v_current_rank,
        'past_rank',     v_past_rank,
        'rank_delta',    CASE WHEN v_past_rank IS NOT NULL
                              THEN v_past_rank - v_current_rank
                              ELSE NULL END,
        'current_score', ROUND(v_current_score, 1),
        'past_score',    CASE WHEN v_past_score IS NOT NULL
                              THEN ROUND(v_past_score, 1)
                              ELSE NULL END,
        'period',        p_period,
        'trend',         CASE
                           WHEN v_past_rank IS NULL              THEN 'new'
                           WHEN v_past_rank > v_current_rank     THEN 'up'
                           WHEN v_past_rank < v_current_rank     THEN 'down'
                           ELSE 'stable'
                         END
    );
END;
$function$;

-- ---------- get_rank_history ----------
CREATE OR REPLACE FUNCTION public.get_rank_history(p_restaurant_id uuid, p_dish_type_id uuid, p_city_id uuid, p_days integer DEFAULT 30, p_scope text DEFAULT 'city'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_results JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'snapshot_date',  snapshot_date,
            'rank_position',  rank_position,
            'bayesian_score', FLOOR(bayesian_score * 10) / 10,
            'total_ratings',  total_ratings,
            'confidence_tier', confidence_tier
        )
        ORDER BY snapshot_date ASC
    )
    INTO v_results
    FROM public.leaderboard_snapshots
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND city_id       = p_city_id
      AND scope         = p_scope
      AND snapshot_date >= CURRENT_DATE - p_days;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$function$;

-- ---------- get_user_badges ----------
CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
RETURN COALESCE(
    (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    bd.id,
                    'slug',
                    bd.slug,
                    'name',
                    bd.name,
                    'description',
                    bd.description,
                    'image_url',
                    bd.image_url,
                    'category',
                    bd.category,
                    'dish_type_id',
                    bd.dish_type_id,
                    'threshold',
                    bd.threshold,
                    'is_active',
                    bd.is_active,
                    'is_featured',
                    bd.is_featured,
                    'sort_order',
                    bd.sort_order,
                    'earned_at',
                    ub.earned_at,
                    'notified',
                    ub.notified
                )
                ORDER BY bd.is_featured DESC,
                    bd.sort_order,
                    bd.created_at
            )
        FROM badge_definitions bd
            LEFT JOIN user_badges ub ON ub.badge_id = bd.id
            AND ub.user_id = v_user_id
        WHERE bd.is_active = true
            OR ub.id IS NOT NULL
    ),
    '[]'::JSONB
);
END;
$function$;

-- ---------- get_user_stats ----------
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user_id UUID;
v_result JSONB;
BEGIN v_user_id := COALESCE(p_user_id, auth.uid());
IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required';
END IF;
SELECT jsonb_build_object(
        'user_id',
        p.id,
        'username',
        p.username,
        'total_ratings',
        p.total_ratings,
        'total_comparisons',
        p.total_comparisons,
        'credibility_score',
        p.credibility_score,
        'dishes_by_type',
        (
            SELECT jsonb_object_agg(dt.name, cnt)
            FROM (
                    SELECT dish_type_id,
                        COUNT(*) AS cnt
                    FROM public.personal_ratings
                    WHERE user_id = v_user_id
                    GROUP BY dish_type_id
                ) r
                JOIN public.dish_types dt ON dt.id = r.dish_type_id
        ),
        'cities_rated_in',
        (
            SELECT COUNT(DISTINCT r.city_id)
            FROM public.personal_ratings pr
                JOIN public.restaurants r ON r.id = pr.restaurant_id
            WHERE pr.user_id = v_user_id
        ),
        'member_since',
        p.created_at,
        'skip_rate',
        (
            SELECT ROUND(
                    COUNT(*) FILTER (
                        WHERE result = 'skipped'
                    )::DECIMAL / NULLIF(COUNT(*), 0),
                    3
                )
            FROM public.comparisons
            WHERE user_id = v_user_id
        )
    ) INTO v_result
FROM public.profiles p
WHERE p.id = v_user_id;
RETURN v_result;
END;
$function$;

-- ---------- match_location ----------
CREATE OR REPLACE FUNCTION public.match_location(lat double precision, long double precision)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE _city_record public.cities %ROWTYPE;
_neighborhood_record public.neighborhoods %ROWTYPE;
_point extensions.geometry;
BEGIN _point := st_setsrid(st_point(long, lat), 4326);
SELECT * INTO _city_record
FROM public.cities
WHERE is_active = true
    AND st_contains(coordinates::extensions.geometry, _point)
LIMIT 1;
IF _city_record IS NULL THEN
SELECT * INTO _city_record
FROM public.cities
WHERE is_active = true
ORDER BY coordinates::extensions.geometry <->_point
LIMIT 1;
END IF;
IF _city_record IS NOT NULL THEN
SELECT * INTO _neighborhood_record
FROM public.neighborhoods
WHERE city_id = _city_record.id
    AND st_contains(boundary::extensions.geometry, _point)
LIMIT 1;
END IF;
RETURN json_build_object(
    'city',
    CASE
        WHEN _city_record IS NULL THEN NULL
        ELSE json_build_object(
            'id',
            _city_record.id,
            'name',
            _city_record.name,
            'state',
            _city_record.state,
            'slug',
            _city_record.slug
        )
    END,
    'neighborhood',
    CASE
        WHEN _neighborhood_record IS NULL THEN NULL
        ELSE json_build_object(
            'id',
            _neighborhood_record.id,
            'name',
            _neighborhood_record.name,
            'slug',
            _neighborhood_record.slug
        )
    END
);
END;
$function$;

-- ---------- report_content ----------
CREATE OR REPLACE FUNCTION public.report_content(p_reported_rating_id uuid, p_reason text, p_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_reporter_id UUID := auth.uid();
    v_report_id UUID;
    v_existing UUID;
BEGIN
    -- Check auth
    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check the rating exists
    IF NOT EXISTS (SELECT 1 FROM personal_ratings WHERE id = p_reported_rating_id) THEN
        RAISE EXCEPTION 'Rating not found';
    END IF;

    -- Prevent self-reporting
    IF EXISTS (
        SELECT 1 FROM personal_ratings
        WHERE id = p_reported_rating_id AND user_id = v_reporter_id
    ) THEN
        RAISE EXCEPTION 'Cannot report your own content';
    END IF;

    -- Check for duplicate
    SELECT id INTO v_existing
    FROM content_reports
    WHERE reporter_id = v_reporter_id
      AND reported_rating_id = p_reported_rating_id;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object('success', true, 'already_reported', true);
    END IF;

    -- Insert report
    INSERT INTO content_reports (reporter_id, reported_rating_id, reason, description)
    VALUES (v_reporter_id, p_reported_rating_id, p_reason::report_reason, p_description)
    RETURNING id INTO v_report_id;

    RETURN json_build_object('success', true, 'report_id', v_report_id);
END;
$function$;

-- ---------- search_dish_types ----------
CREATE OR REPLACE FUNCTION public.search_dish_types(search_term text)
 RETURNS SETOF dish_types
 LANGUAGE sql
 STABLE
AS $function$
SELECT *
FROM public.dish_types
WHERE is_active = true
    AND (
        similarity(name, search_term) > 0.15
        OR similarity(replace(name, ' ', ''), search_term) > 0.15
        OR name ILIKE '%' || search_term || '%'
        OR EXISTS (
            SELECT 1
            FROM unnest(aliases) alias
            WHERE alias ILIKE '%' || search_term || '%'
                OR similarity(alias, search_term) > 0.15
        )
    )
ORDER BY greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) DESC
LIMIT 20;
$function$;

-- ---------- search_restaurant_dishes ----------
CREATE OR REPLACE FUNCTION public.search_restaurant_dishes(search_term text)
 RETURNS TABLE(restaurant_dish_id uuid, dish_type_id uuid, dish_type_name text, dish_type_emoji text, dish_type_icon text, restaurant_id uuid, restaurant_name text, photos text[], total_ratings integer)
 LANGUAGE sql
 STABLE
AS $function$
SELECT rd.id,
    dt.id,
    dt.name,
    dt.emoji,
    dt.icon,
    r.id,
    r.name,
    rd.photos,
    rd.total_ratings
FROM public.restaurant_dishes rd
    JOIN public.dish_types dt ON dt.id = rd.dish_type_id
    JOIN public.restaurants r ON r.id = rd.restaurant_id
WHERE similarity(dt.name, search_term) > 0.15
    OR similarity(replace(dt.name, ' ', ''), search_term) > 0.15
    OR dt.name ILIKE '%' || search_term || '%'
ORDER BY greatest(
        similarity(dt.name, search_term),
        similarity(replace(dt.name, ' ', ''), search_term)
    ) DESC
LIMIT 20;
$function$;

-- ---------- search_restaurants ----------
CREATE OR REPLACE FUNCTION public.search_restaurants(search_term text)
 RETURNS SETOF restaurants
 LANGUAGE sql
 STABLE
AS $function$
SELECT *
FROM public.restaurants
WHERE similarity(name, search_term) > 0.15
    OR similarity(replace(name, ' ', ''), search_term) > 0.15
    OR name ILIKE '%' || search_term || '%'
ORDER BY greatest(
        similarity(name, search_term),
        similarity(replace(name, ' ', ''), search_term)
    ) DESC
LIMIT 20;
$function$;

-- ---------- slugify ----------
CREATE OR REPLACE FUNCTION public.slugify(v_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$ BEGIN RETURN lower(
        regexp_replace(
            regexp_replace(v_text, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+',
            '-',
            'g'
        )
    );
END;
$function$;

-- ---------- submit_comparison ----------
CREATE OR REPLACE FUNCTION public.submit_comparison(p_battle_id uuid, p_result text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_session RECORD;
    v_new_rating RECORD;
    v_opponent_id UUID;
    v_opponent_rating RECORD;
    v_k_max NUMERIC;
    v_k_decay NUMERIC;
    v_elo_min NUMERIC;
    v_elo_max NUMERIC;
    v_k_new NUMERIC;
    v_k_opp NUMERIC;
    v_expected_new NUMERIC;
    v_expected_opp NUMERIC;
    v_new_elo_before NUMERIC;
    v_opp_elo_before NUMERIC;
    v_new_elo_after NUMERIC;
    v_opp_elo_after NUMERIC;
    v_score_new NUMERIC;
    v_score_opp NUMERIC;
    v_mid_idx INTEGER;
    v_next_opponent JSONB := NULL;
    v_battle_complete BOOLEAN := false;
    v_next_opp_record RECORD;
    v_new_clamp_min NUMERIC;
    v_new_clamp_max NUMERIC;
    v_opp_clamp_min NUMERIC;
    v_opp_clamp_max NUMERIC;
    v_opp_rest_id UUID;
    v_new_badges JSONB := '[]'::JSONB;
BEGIN
-- 1. Load battle session
SELECT * INTO v_session
FROM battle_sessions
WHERE id = p_battle_id AND user_id = v_user_id AND status = 'active';
IF v_session IS NULL THEN RAISE EXCEPTION 'No active battle session found'; END IF;
-- 2. Load new rating and current opponent
SELECT id, elo_score, comparison_count, sentiment INTO v_new_rating
FROM personal_ratings WHERE id = v_session.rating_id;

v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
v_opponent_id := v_session.candidate_ids[v_mid_idx + 1];

SELECT id, elo_score, comparison_count, sentiment INTO v_opponent_rating
FROM personal_ratings WHERE id = v_opponent_id;
-- 3. Load constants
SELECT value INTO v_k_max   FROM app_constants WHERE key = 'K_MAX';
SELECT value INTO v_k_decay FROM app_constants WHERE key = 'K_DECAY';
SELECT value INTO v_elo_min FROM app_constants WHERE key = 'ELO_MIN';
SELECT value INTO v_elo_max FROM app_constants WHERE key = 'ELO_MAX';

v_new_elo_before := v_new_rating.elo_score;
v_opp_elo_before := v_opponent_rating.elo_score;
-- 4. Apply Elo update
IF p_result IN ('new_wins', 'opponent_wins') THEN
    v_k_new := v_k_max / (1 + v_k_decay * v_new_rating.comparison_count);
    v_k_opp := v_k_max / (1 + v_k_decay * v_opponent_rating.comparison_count);
    v_expected_new := 1.0 / (1.0 + power(10.0, (v_opp_elo_before - v_new_elo_before) / 400.0));
    v_expected_opp := 1.0 - v_expected_new;
    IF p_result = 'new_wins' THEN v_score_new := 1.0; v_score_opp := 0.0;
    ELSE v_score_new := 0.0; v_score_opp := 1.0; END IF;
    SELECT value INTO v_new_clamp_min FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_new_rating.sentiment) || '_MIN';
    SELECT value INTO v_new_clamp_max FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_new_rating.sentiment) || '_MAX';
    SELECT value INTO v_opp_clamp_min FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_opponent_rating.sentiment) || '_MIN';
    SELECT value INTO v_opp_clamp_max FROM app_constants WHERE key = 'ELO_CLAMP_' || UPPER(v_opponent_rating.sentiment) || '_MAX';
    v_new_elo_after := LEAST(GREATEST(v_new_elo_before + v_k_new * (v_score_new - v_expected_new), v_new_clamp_min), v_new_clamp_max);
    v_opp_elo_after := LEAST(GREATEST(v_opp_elo_before + v_k_opp * (v_score_opp - v_expected_opp), v_opp_clamp_min), v_opp_clamp_max);
    UPDATE personal_ratings SET elo_score = v_new_elo_after, comparison_count = comparison_count + 1 WHERE id = v_new_rating.id;
    UPDATE personal_ratings SET elo_score = v_opp_elo_after, comparison_count = comparison_count + 1 WHERE id = v_opponent_rating.id;
ELSE
    v_new_elo_after := v_new_elo_before;
    v_opp_elo_after := v_opp_elo_before;
    v_k_new := 0; v_k_opp := 0;
END IF;
-- 5. Record comparison
INSERT INTO comparisons (
        user_id, dish_type_id, new_rating_id, opponent_rating_id,
        result, step_number,
        new_elo_before, new_elo_after,
        opponent_elo_before, opponent_elo_after,
        k_factor_new, k_factor_opponent
    )
VALUES (
        v_user_id, v_session.dish_type_id, v_new_rating.id, v_opponent_id,
        p_result, v_session.current_step,
        v_new_elo_before, v_new_elo_after,
        v_opp_elo_before, v_opp_elo_after,
        v_k_new, v_k_opp
    );
-- 6. Advance binary search or complete
IF p_result = 'skipped' THEN
    v_battle_complete := true;
ELSIF p_result = 'new_wins' THEN
    UPDATE battle_sessions SET high_idx = v_mid_idx - 1, current_step = current_step + 1, updated_at = now() WHERE id = p_battle_id;
    SELECT * INTO v_session FROM battle_sessions WHERE id = p_battle_id;
ELSE
    UPDATE battle_sessions SET low_idx = v_mid_idx + 1, current_step = current_step + 1, updated_at = now() WHERE id = p_battle_id;
    SELECT * INTO v_session FROM battle_sessions WHERE id = p_battle_id;
END IF;
IF v_session.low_idx > v_session.high_idx THEN v_battle_complete := true; END IF;
-- 7. Finalize or return next opponent
IF v_battle_complete THEN
    UPDATE battle_sessions SET status = 'completed', updated_at = now() WHERE id = p_battle_id;
    UPDATE personal_ratings SET battle_status = 'completed' WHERE id = v_new_rating.id;
    PERFORM _update_profile_stats(v_user_id);
    PERFORM _update_global_dish_score(
        (SELECT restaurant_id FROM personal_ratings WHERE id = v_new_rating.id),
        v_session.dish_type_id
    );
    FOR v_opp_rest_id IN
        SELECT DISTINCT pr.restaurant_id
        FROM comparisons c
            JOIN personal_ratings pr ON pr.id = c.opponent_rating_id
        WHERE c.new_rating_id = v_new_rating.id
            AND c.result != 'skipped'
            AND pr.restaurant_id != (SELECT restaurant_id FROM personal_ratings WHERE id = v_new_rating.id)
    LOOP
        PERFORM _update_global_dish_score(v_opp_rest_id, v_session.dish_type_id);
    END LOOP;
    v_new_badges := public.evaluate_badges(v_user_id);
    RETURN jsonb_build_object(
        'battle_complete', true,
        'rating_id', v_new_rating.id,
        'final_elo', v_new_elo_after,
        'final_derived_score', ROUND(((LEAST(GREATEST(v_new_elo_after, v_elo_min), v_elo_max) - 1000) / 1000.0) * 10.0, 1),
        'comparisons_made', v_session.current_step,
        'new_badges', v_new_badges
    );
ELSE
    -- Resolve placeholder at read time
    v_mid_idx := (v_session.low_idx + v_session.high_idx) / 2;
    v_opponent_id := v_session.candidate_ids[v_mid_idx + 1];
    SELECT pr.id,
        pr.restaurant_id,
        pr.elo_score,
        COALESCE(pr.photo_url, dt.placeholder_photo_url) AS photo_url,
        ROUND(((LEAST(GREATEST(pr.elo_score, 1000), 2000) - 1000) / 1000.0) * 10.0, 1) AS display_score,
        r.name AS restaurant_name
        INTO v_next_opp_record
    FROM personal_ratings pr
        JOIN restaurants r ON r.id = pr.restaurant_id
        JOIN dish_types dt ON dt.id = pr.dish_type_id
    WHERE pr.id = v_opponent_id;
    RETURN jsonb_build_object(
        'battle_complete', false,
        'rating_id', v_new_rating.id,
        'current_elo', v_new_elo_after,
        'opponent', jsonb_build_object(
            'rating_id', v_next_opp_record.id,
            'restaurant_id', v_next_opp_record.restaurant_id,
            'restaurant_name', v_next_opp_record.restaurant_name,
            'elo_score', v_next_opp_record.elo_score,
            'derived_score', v_next_opp_record.display_score,
            'photo_url', v_next_opp_record.photo_url
        ),
        'opponent_index', v_mid_idx,
        'step', v_session.current_step,
        'remaining_range', v_session.high_idx - v_session.low_idx + 1
    );
END IF;
END;
$function$;

-- ---------- take_leaderboard_snapshot ----------
CREATE OR REPLACE FUNCTION public.take_leaderboard_snapshot(p_snapshot_date date DEFAULT CURRENT_DATE)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_inserted INTEGER := 0;
    v_batch    INTEGER;
BEGIN
    -- City-level: rank within (city_id, dish_type_id)
    INSERT INTO public.leaderboard_snapshots (
        snapshot_date, global_dish_score_id, restaurant_id, dish_type_id,
        city_id, neighborhood_id, rank_position, bayesian_score,
        raw_weighted_avg, total_ratings, confidence_tier, scope
    )
    SELECT
        p_snapshot_date,
        gds.id,
        gds.restaurant_id,
        gds.dish_type_id,
        gds.city_id,
        NULL,
        RANK() OVER (
            PARTITION BY gds.city_id, gds.dish_type_id
            ORDER BY gds.bayesian_score DESC
        )::INTEGER,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        'city'
    FROM public.global_dish_scores gds
    WHERE gds.total_ratings >= 2
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    -- Neighborhood-level: rank within (neighborhood_id, dish_type_id)
    INSERT INTO public.leaderboard_snapshots (
        snapshot_date, global_dish_score_id, restaurant_id, dish_type_id,
        city_id, neighborhood_id, rank_position, bayesian_score,
        raw_weighted_avg, total_ratings, confidence_tier, scope
    )
    SELECT
        p_snapshot_date,
        gds.id,
        gds.restaurant_id,
        gds.dish_type_id,
        gds.city_id,
        gds.neighborhood_id,
        RANK() OVER (
            PARTITION BY gds.neighborhood_id, gds.dish_type_id
            ORDER BY gds.bayesian_score DESC
        )::INTEGER,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        'neighborhood'
    FROM public.global_dish_scores gds
    WHERE gds.total_ratings >= 2
      AND gds.neighborhood_id IS NOT NULL
    ON CONFLICT (snapshot_date, global_dish_score_id, scope) DO NOTHING;

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_inserted := v_inserted + v_batch;

    RETURN v_inserted;
END;
$function$;

-- ---------- upsert_restaurant_from_google ----------
CREATE OR REPLACE FUNCTION public.upsert_restaurant_from_google(p_google_place_id text, p_name text, p_address text, p_city_name text, p_state text, p_country text, p_neighborhood_name text DEFAULT NULL::text, p_lat double precision DEFAULT NULL::double precision, p_lng double precision DEFAULT NULL::double precision, p_phone text DEFAULT NULL::text, p_website text DEFAULT NULL::text, p_types text[] DEFAULT NULL::text[], p_location_properties jsonb DEFAULT NULL::jsonb)
 RETURNS SETOF restaurants
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_city_id UUID;
    v_neighborhood_id UUID;
    v_city_slug TEXT;
    v_coordinates extensions.geography(Point, 4326);
    v_city_record public.cities%ROWTYPE;
    v_point extensions.geometry;
BEGIN
    -- Early return: if restaurant already exists, skip all resolution work
    IF p_google_place_id IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM public.restaurants
        WHERE google_place_id = p_google_place_id;

        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    -- Resolve city
    SELECT * INTO v_city_record
    FROM public.cities
    WHERE lower(name) = lower(p_city_name)
        AND (
            p_state IS NULL
            OR lower(state) = lower(p_state)
        )
    LIMIT 1;

    IF v_city_record.id IS NOT NULL THEN
        v_city_id := v_city_record.id;
    ELSE
        v_city_slug := public.slugify(p_city_name || '-' || COALESCE(p_state, ''));
        INSERT INTO public.cities (
                name,
                state,
                country,
                slug,
                is_active,
                coordinates
            )
        VALUES (
                p_city_name,
                p_state,
                p_country,
                v_city_slug,
                false,
                CASE
                    WHEN p_lat IS NOT NULL
                    AND p_lng IS NOT NULL THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
                    ELSE NULL
                END
            ) ON CONFLICT (slug) DO NOTHING
        RETURNING id INTO v_city_id;

        IF v_city_id IS NULL THEN
            SELECT id INTO v_city_id
            FROM public.cities
            WHERE lower(name) = lower(p_city_name)
                AND (
                    p_state IS NULL
                    OR lower(state) = lower(p_state)
                );
        END IF;
    END IF;

    -- Resolve neighborhood
    IF v_city_id IS NOT NULL THEN
        IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
            v_point := st_setsrid(st_point(p_lng, p_lat), 4326);
            SELECT id INTO v_neighborhood_id
            FROM public.neighborhoods
            WHERE city_id = v_city_id
                AND boundary IS NOT NULL
                AND st_contains(boundary::extensions.geometry, v_point)
            LIMIT 1;
        END IF;

        -- Name match if spatial failed or lat/lng not available
        IF v_neighborhood_id IS NULL AND p_neighborhood_name IS NOT NULL THEN
            SELECT id INTO v_neighborhood_id
            FROM public.neighborhoods
            WHERE lower(name) = lower(p_neighborhood_name)
                AND city_id = v_city_id;
        END IF;

        -- Auto-create if name provided but no match found
        IF v_neighborhood_id IS NULL AND p_neighborhood_name IS NOT NULL THEN
            INSERT INTO public.neighborhoods (city_id, name, slug)
            VALUES (v_city_id, p_neighborhood_name, public.slugify(p_neighborhood_name))
            ON CONFLICT (city_id, slug) DO NOTHING
            RETURNING id INTO v_neighborhood_id;

            IF v_neighborhood_id IS NULL THEN
                SELECT id INTO v_neighborhood_id
                FROM public.neighborhoods
                WHERE lower(name) = lower(p_neighborhood_name)
                    AND city_id = v_city_id;
            END IF;
        END IF;
    END IF;

    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_coordinates := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    INSERT INTO public.restaurants (
            google_place_id,
            name,
            address,
            city_id,
            neighborhood_id,
            coordinates,
            phone,
            website,
            types,
            location_properties,
            updated_at
        )
    VALUES (
            p_google_place_id,
            p_name,
            p_address,
            v_city_id,
            v_neighborhood_id,
            v_coordinates,
            p_phone,
            p_website,
            p_types,
            p_location_properties,
            now()
        ) ON CONFLICT (google_place_id) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        city_id = COALESCE(public.restaurants.city_id, EXCLUDED.city_id),
        neighborhood_id = COALESCE(EXCLUDED.neighborhood_id, public.restaurants.neighborhood_id),
        coordinates = EXCLUDED.coordinates,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        types = EXCLUDED.types,
        location_properties = COALESCE(EXCLUDED.location_properties, public.restaurants.location_properties),
        updated_at = now()
    RETURNING *;
END;
$function$;


-- =============================================================================
-- FIX (function_search_path_mutable): pin search_path on functions that
-- shipped without it. Prevents search_path-hijack against SECURITY DEFINER
-- code and silences the advisor.
--
-- MUST include `extensions`: pg_trgm and PostGIS live in the extensions schema
-- (see draft 1), and these bodies call similarity() / st_setsrid() / st_point()
-- / st_contains() / ST_MakePoint() unqualified. Pinning to `public` alone strips
-- extensions from name resolution and the calls fail at runtime (SQL/plpgsql
-- bind these names at call time, so CREATE still succeeds). Matches the
-- `SET search_path TO 'public','extensions'` used by find_nearby_restaurants.
-- =============================================================================
ALTER FUNCTION public.check_city_is_new(uuid)                 SET search_path = public, extensions;
ALTER FUNCTION public.get_dish_type_entry_counts(uuid)       SET search_path = public, extensions;
ALTER FUNCTION public.match_location(double precision, double precision) SET search_path = public, extensions;
ALTER FUNCTION public.slugify(text)                          SET search_path = public, extensions;
ALTER FUNCTION public.search_restaurants(text)              SET search_path = public, extensions;
ALTER FUNCTION public.search_dish_types(text)               SET search_path = public, extensions;
ALTER FUNCTION public.search_restaurant_dishes(text)        SET search_path = public, extensions;
ALTER FUNCTION public.upsert_restaurant_from_google(
    text, text, text, text, text, text, text,
    double precision, double precision, text, text, text[], jsonb
) SET search_path = public, extensions;

-- =============================================================================
-- FIX (security_definer_function_executable): internal-only functions must not
-- be directly callable by clients. Their callers are other SECURITY DEFINER
-- functions or pg_cron, which run as the function owner and ignore these grants.
--
-- NOTE: revoke FROM PUBLIC *and* anon/authenticated. The default privileges
-- from the original remote_schema migration (ALTER DEFAULT PRIVILEGES ... GRANT
-- ALL ON FUNCTIONS TO anon, authenticated) write EXPLICIT per-role EXECUTE grants
-- onto every new function, which a FROM PUBLIC revoke alone does not remove. On
-- a fresh project without those defaults the extra revokes are harmless no-ops.
-- =============================================================================
REVOKE EXECUTE ON FUNCTION public._update_global_dish_score(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._update_profile_stats(uuid)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.evaluate_badges(uuid)                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.take_leaderboard_snapshot(date)       FROM PUBLIC, anon, authenticated;
-- award_badge_manual keeps its grant: it is a legitimate admin RPC already
-- gated by an internal is_admin() check, so a non-admin call raises anyway.
