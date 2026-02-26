drop trigger if exists "on_city_created_enrich_dish_types" on "public"."cities";

drop policy "Admins can insert admin actions" on "public"."admin_actions";

drop policy "Admins can read admin actions" on "public"."admin_actions";

drop policy "Admins can delete blog authors" on "public"."blog_authors";

drop policy "Admins can insert blog authors" on "public"."blog_authors";

drop policy "Admins can update blog authors" on "public"."blog_authors";

drop policy "Admins can delete blog categories" on "public"."blog_categories";

drop policy "Admins can insert blog categories" on "public"."blog_categories";

drop policy "Admins can update blog categories" on "public"."blog_categories";

drop policy "Admins can delete blog post tags" on "public"."blog_post_tags";

drop policy "Admins can insert blog post tags" on "public"."blog_post_tags";

drop policy "Admins can update blog post tags" on "public"."blog_post_tags";

drop policy "Admins can delete blog posts" on "public"."blog_posts";

drop policy "Admins can insert blog posts" on "public"."blog_posts";

drop policy "Admins can read all blog posts" on "public"."blog_posts";

drop policy "Admins can update blog posts" on "public"."blog_posts";

drop policy "Admins can delete blog tags" on "public"."blog_tags";

drop policy "Admins can insert blog tags" on "public"."blog_tags";

drop policy "Admins can update blog tags" on "public"."blog_tags";

drop policy "Admins can delete cities" on "public"."cities";

drop policy "Admins can insert cities" on "public"."cities";

drop policy "Admins can update cities" on "public"."cities";

drop policy "Admins can delete city_known_dishes" on "public"."city_known_dishes";

drop policy "Admins can insert city_known_dishes" on "public"."city_known_dishes";

drop policy "Admins can update city_known_dishes" on "public"."city_known_dishes";

drop policy "Users can read all comparisons" on "public"."comparisons";

drop policy "public_read_stats" on "public"."comparisons";

drop policy "Admins can read content flags" on "public"."content_flags";

drop policy "Admins can update content flags" on "public"."content_flags";

drop policy "Authenticated users can create flags" on "public"."content_flags";

drop policy "Admins can delete dish_type_variations" on "public"."dish_type_variations";

drop policy "Admins can insert dish_type_variations" on "public"."dish_type_variations";

drop policy "Admins can update dish_type_variations" on "public"."dish_type_variations";

drop policy "Admins can delete dish_types" on "public"."dish_types";

drop policy "Admins can insert dish_types" on "public"."dish_types";

drop policy "Admins can update dish_types" on "public"."dish_types";

drop policy "Users can update own non-role fields" on "public"."profiles";

drop policy "Admins can delete taste_tags" on "public"."taste_tags";

drop policy "Admins can insert taste_tags" on "public"."taste_tags";

drop policy "Admins can update taste_tags" on "public"."taste_tags";

drop policy "Allow admin reads" on "public"."user_waitlist";

revoke delete on table "public"."admin_actions" from "anon";

revoke insert on table "public"."admin_actions" from "anon";

revoke references on table "public"."admin_actions" from "anon";

revoke select on table "public"."admin_actions" from "anon";

revoke trigger on table "public"."admin_actions" from "anon";

revoke truncate on table "public"."admin_actions" from "anon";

revoke update on table "public"."admin_actions" from "anon";

revoke delete on table "public"."admin_actions" from "authenticated";

revoke insert on table "public"."admin_actions" from "authenticated";

revoke references on table "public"."admin_actions" from "authenticated";

revoke select on table "public"."admin_actions" from "authenticated";

revoke trigger on table "public"."admin_actions" from "authenticated";

revoke truncate on table "public"."admin_actions" from "authenticated";

revoke update on table "public"."admin_actions" from "authenticated";

revoke delete on table "public"."admin_actions" from "service_role";

revoke insert on table "public"."admin_actions" from "service_role";

revoke references on table "public"."admin_actions" from "service_role";

revoke select on table "public"."admin_actions" from "service_role";

revoke trigger on table "public"."admin_actions" from "service_role";

revoke truncate on table "public"."admin_actions" from "service_role";

revoke update on table "public"."admin_actions" from "service_role";

revoke delete on table "public"."content_flags" from "anon";

revoke insert on table "public"."content_flags" from "anon";

revoke references on table "public"."content_flags" from "anon";

revoke select on table "public"."content_flags" from "anon";

revoke trigger on table "public"."content_flags" from "anon";

revoke truncate on table "public"."content_flags" from "anon";

revoke update on table "public"."content_flags" from "anon";

revoke delete on table "public"."content_flags" from "authenticated";

revoke insert on table "public"."content_flags" from "authenticated";

revoke references on table "public"."content_flags" from "authenticated";

revoke select on table "public"."content_flags" from "authenticated";

revoke trigger on table "public"."content_flags" from "authenticated";

revoke truncate on table "public"."content_flags" from "authenticated";

revoke update on table "public"."content_flags" from "authenticated";

revoke delete on table "public"."content_flags" from "service_role";

revoke insert on table "public"."content_flags" from "service_role";

revoke references on table "public"."content_flags" from "service_role";

revoke select on table "public"."content_flags" from "service_role";

revoke trigger on table "public"."content_flags" from "service_role";

revoke truncate on table "public"."content_flags" from "service_role";

revoke update on table "public"."content_flags" from "service_role";

alter table "public"."admin_actions" drop constraint "admin_actions_admin_id_fkey";

alter table "public"."content_flags" drop constraint "content_flags_reporter_id_fkey";

alter table "public"."content_flags" drop constraint "content_flags_reviewed_by_fkey";

alter table "public"."content_flags" drop constraint "content_flags_status_check";

alter table "public"."profiles" drop constraint "profiles_role_check";

drop function if exists "public"."get_admin_city_breakdown"();

drop function if exists "public"."get_admin_daily_stats"(p_start_date date, p_end_date date);

drop function if exists "public"."get_admin_dish_type_breakdown"();

drop function if exists "public"."get_personal_dish_type_counts"(p_user_id uuid);

drop function if exists "public"."is_admin"();

alter table "public"."admin_actions" drop constraint "admin_actions_pkey";

alter table "public"."content_flags" drop constraint "content_flags_pkey";

drop index if exists "public"."admin_actions_pkey";

drop index if exists "public"."content_flags_pkey";

drop index if exists "public"."idx_content_flags_status";

drop index if exists "public"."idx_content_flags_target";

drop table "public"."admin_actions";

drop table "public"."content_flags";

alter table "public"."profiles" drop column "ban_reason";

alter table "public"."profiles" drop column "banned_at";

alter table "public"."profiles" drop column "is_banned";

alter table "public"."profiles" drop column "role";

alter table "public"."profiles" drop column "warn_count";

alter table "public"."profiles" drop column "warned_at";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_leaderboard_with_tiebreakers(p_city_id uuid, p_dish_type_id uuid, p_neighborhood_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(rank bigint, restaurant_id uuid, restaurant_name text, neighborhood_name text, bayesian_score numeric, confidence_tier text, raw_weighted_avg numeric, total_ratings integer, featured_photo_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT * FROM public.get_leaderboard(p_city_id, p_dish_type_id, p_neighborhood_id, p_limit);
$function$
;

CREATE OR REPLACE FUNCTION public.check_city_is_new(p_city_id uuid)
 RETURNS TABLE(is_new boolean, city_name text, city_state text, city_country text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT
        NOT c.is_active AS is_new,
        c.name AS city_name,
        c.state AS city_state,
        COALESCE(c.country, 'USA') AS city_country
    FROM public.cities c
    WHERE c.id = p_city_id;
$function$
;

CREATE OR REPLACE FUNCTION public.compute_community_score(p_restaurant_id uuid, p_dish_type_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    C                      CONSTANT NUMERIC := 5;  -- prior strength
    v_total_ratings        INTEGER;
    v_weighted_score_sum   NUMERIC;
    v_weighted_rating_cnt  NUMERIC;
    v_raw_weighted_avg     NUMERIC;
    v_global_mean          NUMERIC;
    v_bayesian_score       NUMERIC;
    v_confidence_tier      TEXT;
BEGIN
    -- Aggregate ratings for this restaurant/dish combination
    SELECT
        COUNT(*),
        SUM(derived_score),
        SUM(1.0)  -- w_i = 1.0 (all v0.1 ratings have mandatory photos)
    INTO v_total_ratings, v_weighted_score_sum, v_weighted_rating_cnt
    FROM public.personal_ratings
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id
      AND derived_score IS NOT NULL;

    IF COALESCE(v_total_ratings, 0) = 0 THEN RETURN; END IF;

    v_raw_weighted_avg := v_weighted_score_sum / NULLIF(v_weighted_rating_cnt, 0);

    -- Global mean for the same dish_type across other restaurants in same city
    SELECT COALESCE(AVG(gds2.raw_weighted_avg), 5.0)
    INTO v_global_mean
    FROM public.global_dish_scores gds1
    JOIN public.global_dish_scores gds2
      ON gds2.city_id      = gds1.city_id
     AND gds2.dish_type_id = p_dish_type_id
     AND gds2.restaurant_id != p_restaurant_id
    WHERE gds1.restaurant_id = p_restaurant_id
      AND gds1.dish_type_id  = p_dish_type_id;

    IF v_global_mean IS NULL THEN v_global_mean := 5.0; END IF;

    -- Bayesian-smoothed score
    v_bayesian_score := ROUND(
        (v_weighted_score_sum + C * v_global_mean)
        / (v_weighted_rating_cnt + C),
        2
    );

    -- Confidence tier  (C = 5)
    -- < C → low | C–2C → medium | 2C–5C → high | > 5C → very_high
    v_confidence_tier := CASE
        WHEN v_weighted_rating_cnt >= 25 THEN 'very_high'
        WHEN v_weighted_rating_cnt >= 10 THEN 'high'
        WHEN v_weighted_rating_cnt >= C  THEN 'medium'
        ELSE                                  'low'
    END;

    -- Upsert running totals + derived scores into global_dish_scores
    UPDATE public.global_dish_scores
    SET
        raw_weighted_avg      = v_raw_weighted_avg,
        weighted_score_sum    = v_weighted_score_sum,
        weighted_rating_count = v_weighted_rating_cnt,
        total_ratings         = v_total_ratings,
        bayesian_score        = v_bayesian_score,
        confidence_tier       = v_confidence_tier,
        updated_at            = now()
    WHERE restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_rating(p_restaurant_id uuid, p_dish_type_id uuid, p_sentiment text, p_photo_url text, p_photo_storage_path text DEFAULT NULL::text, p_variation_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text, p_location_verified boolean DEFAULT false, p_taste_tag_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id              UUID := auth.uid();
    v_new_rating_id        UUID;
    v_is_new_insert        BOOLEAN;
    v_city_id              UUID;
    v_neighborhood_id      UUID;
    v_zone_size            INTEGER;
    v_count_liked          INTEGER;
    v_count_okay           INTEGER;
    v_insert_position      INTEGER;
    v_floor                NUMERIC;
    v_ceiling              NUMERIC;
    v_zone_start           INTEGER;
    v_mid                  INTEGER;
    v_opponent_id          UUID;
    v_opponent_restaurant  TEXT;
    v_opponent_photo       TEXT;
    v_opponent_score       NUMERIC;
    v_battle_id            UUID;
    v_max_battles          INTEGER;
    v_max_skips            INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    IF p_sentiment NOT IN ('liked','okay','disliked') THEN
        RAISE EXCEPTION 'Invalid sentiment: %', p_sentiment;
    END IF;

    -- Resolve restaurant location
    SELECT city_id, neighborhood_id
    INTO v_city_id, v_neighborhood_id
    FROM public.restaurants WHERE id = p_restaurant_id;

    -- Check if this is a re-rating (existing row) to avoid double-counting total_ratings
    SELECT id INTO v_new_rating_id
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND restaurant_id = p_restaurant_id
      AND dish_type_id  = p_dish_type_id;

    v_is_new_insert := (v_new_rating_id IS NULL);

    -- INSERT or re-rate (reset rank/score so battles restart)
    INSERT INTO public.personal_ratings (
        user_id, restaurant_id, dish_type_id, variation_id,
        photo_url, photo_storage_path, sentiment, notes,
        location_verified, rank_position, derived_score
    )
    VALUES (
        v_user_id, p_restaurant_id, p_dish_type_id, p_variation_id,
        p_photo_url, p_photo_storage_path, p_sentiment, p_notes,
        COALESCE(p_location_verified, false), NULL, NULL
    )
    ON CONFLICT (user_id, restaurant_id, dish_type_id) DO UPDATE
    SET sentiment          = EXCLUDED.sentiment,
        photo_url          = EXCLUDED.photo_url,
        photo_storage_path = EXCLUDED.photo_storage_path,
        variation_id       = EXCLUDED.variation_id,
        notes              = EXCLUDED.notes,
        location_verified  = EXCLUDED.location_verified,
        rank_position      = NULL,
        derived_score      = NULL,
        updated_at         = now()
    RETURNING id INTO v_new_rating_id;

    -- Upsert taste tags (replace on re-rating)
    IF p_taste_tag_ids IS NOT NULL AND array_length(p_taste_tag_ids, 1) > 0 THEN
        DELETE FROM public.personal_rating_tags WHERE rating_id = v_new_rating_id;
        INSERT INTO public.personal_rating_tags (rating_id, tag_id)
        SELECT v_new_rating_id, unnest(p_taste_tag_ids)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Increment total_ratings only for first-time ratings
    IF v_is_new_insert THEN
        UPDATE public.profiles
        SET total_ratings = total_ratings + 1
        WHERE id = v_user_id;
    END IF;

    -- Ensure a global_dish_scores row exists (don't set scores yet)
    INSERT INTO public.global_dish_scores (
        restaurant_id, dish_type_id, city_id, neighborhood_id, total_ratings
    )
    VALUES (p_restaurant_id, p_dish_type_id, v_city_id, v_neighborhood_id, 0)
    ON CONFLICT (restaurant_id, dish_type_id) DO NOTHING;

    -- Count existing items in the same sentiment zone (excluding the new/re-rated item)
    SELECT COUNT(*) INTO v_zone_size
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND dish_type_id = p_dish_type_id
      AND sentiment    = p_sentiment
      AND rank_position IS NOT NULL
      AND id            != v_new_rating_id;

    IF v_zone_size = 0 THEN
        -- ── No existing zone items: place immediately ──────────────────────────

        -- Determine zone_start for this sentiment
        SELECT COUNT(*) INTO v_count_liked
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND sentiment    = 'liked'
          AND rank_position IS NOT NULL
          AND id            != v_new_rating_id;

        SELECT COUNT(*) INTO v_count_okay
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND sentiment    = 'okay'
          AND rank_position IS NOT NULL
          AND id            != v_new_rating_id;

        v_insert_position := CASE p_sentiment
            WHEN 'liked'    THEN 1
            WHEN 'okay'     THEN v_count_liked + 1
            ELSE                 v_count_liked + v_count_okay + 1
        END;

        -- Shift items with rank_position ≥ insert_position to open a slot
        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND rank_position >= v_insert_position
          AND id            != v_new_rating_id
          AND rank_position IS NOT NULL;

        -- Compute zone midpoint score
        CASE p_sentiment
            WHEN 'liked'    THEN v_floor := 7.0; v_ceiling := 10.0;
            WHEN 'okay'     THEN v_floor := 4.0; v_ceiling := 6.9;
            ELSE                 v_floor := 1.0; v_ceiling := 3.9;
        END CASE;

        UPDATE public.personal_ratings
        SET rank_position = v_insert_position,
            derived_score = ROUND((v_ceiling + v_floor) / 2.0, 2)
        WHERE id = v_new_rating_id;

        -- Recalculate all derived scores and update community score
        PERFORM public.recalculate_derived_scores(v_user_id, p_dish_type_id);
        PERFORM public.compute_community_score(p_restaurant_id, p_dish_type_id);

        RETURN jsonb_build_object(
            'rating_id',  v_new_rating_id,
            'has_battle', false
        );

    ELSE
        -- ── Zone has items: start binary insertion sort battle ─────────────────

        v_max_battles := floor(log(2, v_zone_size::NUMERIC))::INTEGER + 1;
        v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

        -- Zone start = lowest rank_position among existing same-sentiment items
        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = p_dish_type_id
          AND sentiment    = p_sentiment
          AND rank_position IS NOT NULL
          AND id            != v_new_rating_id;

        -- Initial midpoint opponent (0-indexed within zone)
        v_mid := floor((v_zone_size - 1)::NUMERIC / 2)::INTEGER;

        SELECT pr.id, r.name, pr.photo_url, pr.derived_score
        INTO v_opponent_id, v_opponent_restaurant, v_opponent_photo, v_opponent_score
        FROM public.personal_ratings pr
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id      = v_user_id
          AND pr.dish_type_id = p_dish_type_id
          AND pr.rank_position = v_zone_start + v_mid
          AND pr.id            != v_new_rating_id;

        -- Defensive fallback: if opponent lookup fails, place without battle
        IF v_opponent_id IS NULL THEN
            RAISE WARNING 'create_rating: opponent not found at rank %. Placing without battle.', v_zone_start + v_mid;

            SELECT MIN(rank_position) INTO v_insert_position
            FROM public.personal_ratings
            WHERE user_id = v_user_id AND dish_type_id = p_dish_type_id
              AND sentiment = p_sentiment AND rank_position IS NOT NULL AND id != v_new_rating_id;

            UPDATE public.personal_ratings
            SET rank_position = COALESCE(v_insert_position, 1),
                derived_score = CASE p_sentiment
                    WHEN 'liked' THEN 8.5 WHEN 'okay' THEN 5.5 ELSE 2.5
                END
            WHERE id = v_new_rating_id;
            PERFORM public.recalculate_derived_scores(v_user_id, p_dish_type_id);
            PERFORM public.compute_community_score(p_restaurant_id, p_dish_type_id);
            RETURN jsonb_build_object('rating_id', v_new_rating_id, 'has_battle', false);
        END IF;

        -- Create first comparison record
        INSERT INTO public.comparisons (
            user_id, dish_type_id,
            new_rating_id, opponent_rating_id,
            low_bound, high_bound, step_number
        )
        VALUES (
            v_user_id, p_dish_type_id,
            v_new_rating_id, v_opponent_id,
            0, v_zone_size - 1, 1
        )
        RETURNING id INTO v_battle_id;

        RETURN jsonb_build_object(
            'rating_id',       v_new_rating_id,
            'has_battle',      true,
            'battle_id',       v_battle_id,
            'step',            1,
            'max_steps',       v_max_battles,
            'skips_remaining', v_max_skips,
            'opponent', jsonb_build_object(
                'rating_id',       v_opponent_id,
                'restaurant_name', v_opponent_restaurant,
                'photo_url',       v_opponent_photo,
                'derived_score',   v_opponent_score
            )
        );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(p_lat double precision, p_long double precision, p_radius_meters double precision DEFAULT 100.0, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, address text, city_id uuid, neighborhood_id uuid, coordinates extensions.geography, google_place_id text, phone text, website text, is_verified boolean, is_closed boolean, closed_at timestamp with time zone, types text[], created_at timestamp with time zone, updated_at timestamp with time zone, distance_meters double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_user_point extensions.geography;
BEGIN
    -- Build a geography point from lat/long (PostGIS uses long, lat order)
    v_user_point := extensions.ST_SetSRID(
        extensions.ST_MakePoint(p_long, p_lat),
        4326
    )::extensions.geography;

    RETURN QUERY
    SELECT
        r.id,
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_discover_heroes(p_city_name text DEFAULT NULL::text, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(id uuid, restaurant_id uuid, restaurant_name text, dish_type_id uuid, city_id uuid, neighborhood_id uuid, neighborhood_name text, bayesian_score numeric, raw_weighted_avg numeric, total_ratings integer, confidence_tier text, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_user_id    UUID;
    v_user_point extensions.GEOGRAPHY;
BEGIN
    v_user_id := auth.uid();

    IF p_user_lat IS NOT NULL AND p_user_long IS NOT NULL THEN
        v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    SELECT
        gds.id,
        gds.restaurant_id,
        r.name  AS restaurant_name,
        gds.dish_type_id,
        gds.city_id,
        gds.neighborhood_id,
        n.name  AS neighborhood_name,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r  ON r.id  = gds.restaurant_id
    LEFT JOIN public.cities   c  ON c.id  = gds.city_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
      AND (p_city_name IS NULL OR c.name ILIKE p_city_name)
      AND (
          v_user_point IS NULL OR p_radius_meters IS NULL
          OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision)
      )
      AND (
          v_user_id IS NULL
          OR NOT EXISTS (
              SELECT 1 FROM public.personal_ratings pr
              WHERE pr.user_id = v_user_id AND pr.restaurant_id = gds.restaurant_id
          )
      )
    ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_discover_rising_stars(p_city_name text DEFAULT NULL::text, p_user_lat double precision DEFAULT NULL::double precision, p_user_long double precision DEFAULT NULL::double precision, p_radius_meters integer DEFAULT NULL::integer, p_min_score numeric DEFAULT 7.5, p_max_ratings integer DEFAULT 10, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(id uuid, restaurant_id uuid, restaurant_name text, dish_type_id uuid, dish_type_name text, dish_type_emoji text, city_id uuid, neighborhood_id uuid, neighborhood_name text, bayesian_score numeric, raw_weighted_avg numeric, total_ratings integer, confidence_tier text, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_user_id    UUID;
    v_user_point extensions.GEOGRAPHY;
BEGIN
    v_user_id := auth.uid();

    IF p_user_lat IS NOT NULL AND p_user_long IS NOT NULL THEN
        v_user_point := ST_SetSRID(ST_MakePoint(p_user_long, p_user_lat), 4326)::geography;
    END IF;

    RETURN QUERY
    SELECT
        gds.id,
        gds.restaurant_id,
        r.name  AS restaurant_name,
        gds.dish_type_id,
        dt.name AS dish_type_name,
        dt.emoji AS dish_type_emoji,
        gds.city_id,
        gds.neighborhood_id,
        n.name  AS neighborhood_name,
        gds.bayesian_score,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.confidence_tier,
        gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r  ON r.id  = gds.restaurant_id
    JOIN public.dish_types    dt ON dt.id = gds.dish_type_id
    LEFT JOIN public.cities   c  ON c.id  = gds.city_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.bayesian_score >= p_min_score
      AND gds.total_ratings < p_max_ratings
      AND gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
      AND (p_city_name IS NULL OR c.name ILIKE p_city_name)
      AND (
          v_user_point IS NULL OR p_radius_meters IS NULL
          OR ST_DWithin(r.coordinates, v_user_point, p_radius_meters::double precision)
      )
      AND (
          v_user_id IS NULL
          OR NOT EXISTS (
              SELECT 1 FROM public.personal_ratings pr
              WHERE pr.user_id = v_user_id AND pr.restaurant_id = gds.restaurant_id
          )
      )
    ORDER BY gds.bayesian_score DESC NULLS LAST;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_city_id uuid, p_dish_type_id uuid, p_neighborhood_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_min_ratings integer DEFAULT 2)
 RETURNS TABLE(rank bigint, restaurant_id uuid, restaurant_name text, neighborhood_name text, bayesian_score numeric, confidence_tier text, raw_weighted_avg numeric, total_ratings integer, featured_photo_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (
            ORDER BY gds.bayesian_score DESC,
                     gds.raw_weighted_avg DESC,
                     gds.total_ratings DESC,
                     gds.created_at ASC
        )::BIGINT       AS rank,
        gds.restaurant_id,
        r.name          AS restaurant_name,
        n.name          AS neighborhood_name,
        gds.bayesian_score,
        gds.confidence_tier,
        gds.raw_weighted_avg,
        gds.total_ratings,
        gds.featured_photo_url
    FROM public.global_dish_scores gds
    JOIN public.restaurants   r ON r.id = gds.restaurant_id
    LEFT JOIN public.neighborhoods n ON n.id = gds.neighborhood_id
    WHERE gds.city_id      = p_city_id
      AND gds.dish_type_id = p_dish_type_id
      AND (p_neighborhood_id IS NULL OR gds.neighborhood_id = p_neighborhood_id)
      AND gds.total_ratings >= p_min_ratings
      AND r.is_closed = false
    ORDER BY gds.bayesian_score DESC,
             gds.raw_weighted_avg DESC,
             gds.total_ratings DESC
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_best_ever(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(dish_type_id uuid, dish_type_name text, dish_type_emoji text, rating_id uuid, restaurant_id uuid, restaurant_name text, city_name text, sentiment text, derived_score numeric, photo_url text, rated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    RETURN QUERY
    SELECT DISTINCT ON (pr.dish_type_id)
        pr.dish_type_id,
        dt.name         AS dish_type_name,
        dt.emoji        AS dish_type_emoji,
        pr.id           AS rating_id,
        pr.restaurant_id,
        r.name          AS restaurant_name,
        c.name          AS city_name,
        pr.sentiment,
        pr.derived_score,
        pr.photo_url,
        pr.created_at   AS rated_at
    FROM public.personal_ratings pr
    JOIN public.dish_types  dt ON dt.id = pr.dish_type_id
    JOIN public.restaurants r  ON r.id  = pr.restaurant_id
    LEFT JOIN public.cities c  ON c.id  = r.city_id
    WHERE pr.user_id = v_user_id
      AND pr.derived_score IS NOT NULL
    ORDER BY pr.dish_type_id, pr.derived_score DESC NULLS LAST;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_dish_rankings(p_dish_type_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(rank bigint, rating_id uuid, restaurant_id uuid, restaurant_name text, city_name text, sentiment text, derived_score numeric, rank_position integer, photo_url text, rated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY pr.rank_position ASC NULLS LAST)::BIGINT AS rank,
        pr.id           AS rating_id,
        pr.restaurant_id,
        r.name          AS restaurant_name,
        c.name          AS city_name,
        pr.sentiment,
        pr.derived_score,
        pr.rank_position,
        pr.photo_url,
        pr.created_at   AS rated_at
    FROM public.personal_ratings pr
    JOIN public.restaurants r  ON r.id  = pr.restaurant_id
    LEFT JOIN public.cities c  ON c.id  = r.city_id
    WHERE pr.user_id      = v_user_id
      AND pr.dish_type_id = p_dish_type_id
    ORDER BY pr.rank_position ASC NULLS LAST;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_result  JSONB;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User ID required'; END IF;

    SELECT jsonb_build_object(
        'user_id',          p.id,
        'username',         p.username,
        'total_ratings',    p.total_ratings,
        'total_battles',    p.total_battles,
        'credibility_score', p.credibility_score,
        'dishes_by_type',   (
            SELECT jsonb_object_agg(dt.name, cnt)
            FROM (
                SELECT dish_type_id, COUNT(*) AS cnt
                FROM public.personal_ratings
                WHERE user_id = v_user_id
                GROUP BY dish_type_id
            ) r
            JOIN public.dish_types dt ON dt.id = r.dish_type_id
        ),
        'cities_rated_in',  (
            SELECT COUNT(DISTINCT r.city_id)
            FROM public.personal_ratings pr
            JOIN public.restaurants r ON r.id = pr.restaurant_id
            WHERE pr.user_id = v_user_id
        ),
        'member_since',     p.created_at,
        'skip_rate',        (
            SELECT ROUND(
                COUNT(*) FILTER (WHERE result = 'skipped')::DECIMAL
                / NULLIF(COUNT(*), 0),
                3
            )
            FROM public.comparisons
            WHERE user_id = v_user_id
        )
    )
    INTO v_result
    FROM public.profiles p
    WHERE p.id = v_user_id;

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_location(lat double precision, long double precision)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare _city_record cities %ROWTYPE;
_neighborhood_record neighborhoods %ROWTYPE;
_point extensions.geometry;
begin -- Create a point extensions.geometry from the input coordinates
-- Note: PostGIS uses (long, lat) order
_point := st_setsrid(st_point(long, lat), 4326);
-- 1. Find the active city strictly containing the point
select * into _city_record
from cities
where is_active = true -- Cast geography to extensions.geometry for ST_Contains if needed, or use ST_Covers for geography
    -- Assuming columns are geography, we cast to extensions.geometry for precise point-in-polygon
    and st_contains(coordinates::extensions.geometry, _point)
limit 1;
-- 2. If no city found strictly, find the closest active city within 50km
if _city_record is null then
select * into _city_record
from cities
where is_active = true
order by coordinates::extensions.geometry <->_point
limit 1;
-- If closest city is too far (> 50km = 50000m), ignore it
-- ST_Distance with geography returns meters
if _city_record is not null
and st_distance(_city_record.coordinates, _point::geography) > 50000 then _city_record := null;
end if;
end if;
-- 3. If city found, look for neighborhood
if _city_record is not null then
select * into _neighborhood_record
from neighborhoods
where city_id = _city_record.id
    and st_contains(boundary::extensions.geometry, _point)
limit 1;
end if;
return json_build_object(
    'city',
    case
        when _city_record is null then null
        else json_build_object(
            'id',
            _city_record.id,
            'name',
            _city_record.name,
            'state',
            _city_record.state,
            'slug',
            _city_record.slug
        )
    end,
    'neighborhood',
    case
        when _neighborhood_record is null then null
        else json_build_object(
            'id',
            _neighborhood_record.id,
            'name',
            _neighborhood_record.name,
            'slug',
            _neighborhood_record.slug
        )
    end
);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.process_battle(p_battle_id uuid, p_winner_rating_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id          UUID := auth.uid();
    v_battle           record;
    v_new_rating       record;
    v_mid              INTEGER;
    v_new_low          INTEGER;
    v_new_high         INTEGER;
    v_zone_start       INTEGER;
    v_insert_rank      INTEGER;
    v_zone_size        INTEGER;
    v_max_battles      INTEGER;
    v_max_skips        INTEGER;
    v_existing_skips   INTEGER;
    v_skips_remaining  INTEGER;
    v_next_rank        INTEGER;
    v_next_id          UUID;
    v_next_restaurant  TEXT;
    v_next_photo       TEXT;
    v_next_score       NUMERIC;
    v_next_battle_id   UUID;
    v_final_score      NUMERIC;
BEGIN
    SELECT * INTO v_battle FROM public.comparisons WHERE id = p_battle_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Battle not found: %', p_battle_id; END IF;
    IF v_battle.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_battle.result  IS NOT NULL  THEN RAISE EXCEPTION 'Battle already resolved'; END IF;
    IF p_winner_rating_id != v_battle.new_rating_id
   AND p_winner_rating_id != v_battle.opponent_rating_id THEN
        RAISE EXCEPTION 'Invalid winner_rating_id';
    END IF;

    SELECT * INTO v_new_rating
    FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

    -- Narrow the search window
    v_mid := floor((v_battle.low_bound + v_battle.high_bound)::NUMERIC / 2)::INTEGER;

    IF p_winner_rating_id = v_battle.new_rating_id THEN
        -- New item wins → insert in lower (better) half
        v_new_low  := v_battle.low_bound;
        v_new_high := v_mid;
        UPDATE public.comparisons SET result = 'new_wins'      WHERE id = p_battle_id;
    ELSE
        -- Opponent wins → insert in upper (worse) half
        v_new_low  := v_mid + 1;
        v_new_high := v_battle.high_bound;
        UPDATE public.comparisons SET result = 'opponent_wins' WHERE id = p_battle_id;
    END IF;

    -- Increment battle count
    UPDATE public.profiles SET total_battles = total_battles + 1 WHERE id = v_user_id;

    IF v_new_low >= v_new_high THEN
        -- ── Converged: insert at final position ───────────────────────────────

        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND sentiment    = v_new_rating.sentiment
          AND rank_position IS NOT NULL
          AND id            != v_battle.new_rating_id;

        v_insert_rank := v_zone_start + v_new_low;

        -- Shift items to make room
        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND rank_position >= v_insert_rank
          AND id            != v_battle.new_rating_id
          AND rank_position IS NOT NULL;

        -- Place new item
        UPDATE public.personal_ratings
        SET rank_position = v_insert_rank
        WHERE id = v_battle.new_rating_id;

        -- Recalculate scores and community leaderboard
        PERFORM public.recalculate_derived_scores(v_user_id, v_battle.dish_type_id);
        PERFORM public.compute_community_score(v_new_rating.restaurant_id, v_battle.dish_type_id);

        SELECT derived_score INTO v_final_score
        FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

        RETURN jsonb_build_object(
            'done',         true,
            'rank_position', v_insert_rank,
            'derived_score', v_final_score
        );

    ELSE
        -- ── Continue: find next opponent ──────────────────────────────────────

        SELECT MIN(rank_position) INTO v_zone_start
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND sentiment    = v_new_rating.sentiment
          AND rank_position IS NOT NULL
          AND id            != v_battle.new_rating_id;

        v_next_rank := v_zone_start + floor((v_new_low + v_new_high)::NUMERIC / 2)::INTEGER;

        SELECT pr.id, r.name, pr.photo_url, pr.derived_score
        INTO v_next_id, v_next_restaurant, v_next_photo, v_next_score
        FROM public.personal_ratings pr
        JOIN public.restaurants r ON r.id = pr.restaurant_id
        WHERE pr.user_id      = v_user_id
          AND pr.dish_type_id = v_battle.dish_type_id
          AND pr.rank_position = v_next_rank
          AND pr.id            != v_battle.new_rating_id;

        -- Compute max_battles / skips_remaining
        SELECT COUNT(*) INTO v_zone_size
        FROM public.personal_ratings
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND sentiment    = v_new_rating.sentiment
          AND rank_position IS NOT NULL
          AND id            != v_battle.new_rating_id;

        v_max_battles := floor(log(2, GREATEST(v_zone_size, 2)::NUMERIC))::INTEGER + 1;
        v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

        SELECT COUNT(*) INTO v_existing_skips
        FROM public.comparisons
        WHERE new_rating_id = v_battle.new_rating_id AND result = 'skipped';

        v_skips_remaining := v_max_skips - v_existing_skips;

        -- Create next battle record
        INSERT INTO public.comparisons (
            user_id, dish_type_id,
            new_rating_id, opponent_rating_id,
            low_bound, high_bound, step_number
        )
        VALUES (
            v_user_id, v_battle.dish_type_id,
            v_battle.new_rating_id, v_next_id,
            v_new_low, v_new_high,
            v_battle.step_number + 1
        )
        RETURNING id INTO v_next_battle_id;

        RETURN jsonb_build_object(
            'done',            false,
            'next_battle_id',  v_next_battle_id,
            'step',            v_battle.step_number + 1,
            'max_steps',       v_max_battles,
            'skips_remaining', v_skips_remaining,
            'opponent', jsonb_build_object(
                'rating_id',       v_next_id,
                'restaurant_name', v_next_restaurant,
                'photo_url',       v_next_photo,
                'derived_score',   v_next_score
            )
        );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_derived_scores(p_user_id uuid, p_dish_type_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sentiments TEXT[]    := ARRAY['liked', 'okay', 'disliked'];
    v_floors     NUMERIC[] := ARRAY[7.0,     4.0,    1.0];
    v_ceilings   NUMERIC[] := ARRAY[10.0,    6.9,    3.9];
    i INT;
BEGIN
    FOR i IN 1..3 LOOP
        -- For each item in this sentiment zone, assign a score derived from
        -- its zone-relative rank.  rank 1 = best (highest score), rank n = worst.
        -- Formula: score = ceiling − ((rank−1)/(n−1)) × (ceiling−floor)
        -- Edge case (n=1): score = midpoint
        UPDATE public.personal_ratings pr
        SET derived_score = ROUND(
            CASE
                WHEN zone.n = 1
                    THEN (v_ceilings[i] + v_floors[i]) / 2.0
                ELSE
                    v_ceilings[i]
                    - ((zone.zone_rank - 1)::NUMERIC / (zone.n - 1)::NUMERIC)
                    * (v_ceilings[i] - v_floors[i])
            END, 2)
        FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (ORDER BY rank_position ASC) AS zone_rank,
                COUNT(*)     OVER ()                           AS n
            FROM public.personal_ratings
            WHERE user_id      = p_user_id
              AND dish_type_id = p_dish_type_id
              AND sentiment    = v_sentiments[i]
              AND rank_position IS NOT NULL
        ) zone
        WHERE pr.id = zone.id;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.skip_battle(p_battle_id uuid, p_skip_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id          UUID := auth.uid();
    v_battle           record;
    v_new_rating       record;
    v_zone_size        INTEGER;
    v_max_battles      INTEGER;
    v_max_skips        INTEGER;
    v_existing_skips   INTEGER;
    v_zone_start       INTEGER;
    v_insert_rank      INTEGER;
    v_final_score      NUMERIC;
    v_mid              INTEGER;
    v_alt_mid          INTEGER;
    v_next_rank        INTEGER;
    v_next_id          UUID;
    v_next_restaurant  TEXT;
    v_next_photo       TEXT;
    v_next_score       NUMERIC;
    v_next_battle_id   UUID;
BEGIN
    SELECT * INTO v_battle FROM public.comparisons WHERE id = p_battle_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Battle not found: %', p_battle_id; END IF;
    IF v_battle.user_id != v_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_battle.result  IS NOT NULL  THEN RAISE EXCEPTION 'Battle already resolved'; END IF;

    SELECT * INTO v_new_rating
    FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

    -- Compute skip limits
    SELECT COUNT(*) INTO v_zone_size
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND dish_type_id = v_battle.dish_type_id
      AND sentiment    = v_new_rating.sentiment
      AND rank_position IS NOT NULL
      AND id            != v_battle.new_rating_id;

    v_max_battles := floor(log(2, GREATEST(v_zone_size, 2)::NUMERIC))::INTEGER + 1;
    v_max_skips   := GREATEST(1, floor(v_max_battles::NUMERIC / 3))::INTEGER;

    SELECT COUNT(*) INTO v_existing_skips
    FROM public.comparisons
    WHERE new_rating_id = v_battle.new_rating_id AND result = 'skipped';

    IF v_existing_skips >= v_max_skips THEN
        RAISE EXCEPTION 'No skips remaining for this battle sequence';
    END IF;

    -- Record the skip
    UPDATE public.comparisons
    SET result      = 'skipped',
        skip_reason = p_skip_reason
    WHERE id = p_battle_id;

    SELECT MIN(rank_position) INTO v_zone_start
    FROM public.personal_ratings
    WHERE user_id      = v_user_id
      AND dish_type_id = v_battle.dish_type_id
      AND sentiment    = v_new_rating.sentiment
      AND rank_position IS NOT NULL
      AND id            != v_battle.new_rating_id;

    -- Single-item range: force completion at current position
    IF v_battle.low_bound >= v_battle.high_bound THEN
        v_insert_rank := v_zone_start + v_battle.low_bound;

        UPDATE public.personal_ratings
        SET rank_position = rank_position + 1
        WHERE user_id      = v_user_id
          AND dish_type_id = v_battle.dish_type_id
          AND rank_position >= v_insert_rank
          AND id            != v_battle.new_rating_id
          AND rank_position IS NOT NULL;

        UPDATE public.personal_ratings
        SET rank_position = v_insert_rank
        WHERE id = v_battle.new_rating_id;

        PERFORM public.recalculate_derived_scores(v_user_id, v_battle.dish_type_id);
        PERFORM public.compute_community_score(v_new_rating.restaurant_id, v_battle.dish_type_id);

        SELECT derived_score INTO v_final_score
        FROM public.personal_ratings WHERE id = v_battle.new_rating_id;

        RETURN jsonb_build_object(
            'done',         true,
            'rank_position', v_insert_rank,
            'derived_score', v_final_score
        );
    END IF;

    -- Multi-item range: advance to a different opponent (mid ± 1)
    v_mid := floor((v_battle.low_bound + v_battle.high_bound)::NUMERIC / 2)::INTEGER;
    v_alt_mid := CASE
        WHEN v_mid + 1 <= v_battle.high_bound THEN v_mid + 1
        ELSE v_mid - 1
    END;

    v_next_rank := v_zone_start + v_alt_mid;

    SELECT pr.id, r.name, pr.photo_url, pr.derived_score
    INTO v_next_id, v_next_restaurant, v_next_photo, v_next_score
    FROM public.personal_ratings pr
    JOIN public.restaurants r ON r.id = pr.restaurant_id
    WHERE pr.user_id      = v_user_id
      AND pr.dish_type_id = v_battle.dish_type_id
      AND pr.rank_position = v_next_rank
      AND pr.id            != v_battle.new_rating_id;

    INSERT INTO public.comparisons (
        user_id, dish_type_id,
        new_rating_id, opponent_rating_id,
        low_bound, high_bound, step_number
    )
    VALUES (
        v_user_id, v_battle.dish_type_id,
        v_battle.new_rating_id, v_next_id,
        v_battle.low_bound, v_battle.high_bound,
        v_battle.step_number + 1
    )
    RETURNING id INTO v_next_battle_id;

    RETURN jsonb_build_object(
        'done',            false,
        'next_battle_id',  v_next_battle_id,
        'step',            v_battle.step_number + 1,
        'max_steps',       v_max_battles,
        'skips_remaining', v_max_skips - v_existing_skips - 1,
        'opponent', jsonb_build_object(
            'rating_id',       v_next_id,
            'restaurant_name', v_next_restaurant,
            'photo_url',       v_next_photo,
            'derived_score',   v_next_score
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_enrich_city_dish_types()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN -- Use net.http_post from pg_net extension
    PERFORM net.http_post(
        url := 'https://bqxhinoabxmpsvzntrlq.supabase.co/functions/v1/enrich-city-dish-types',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
            'city_id',
            NEW.id::text,
            'city_name',
            NEW.name,
            'state',
            NEW.state,
            'country',
            COALESCE(NEW.country, 'USA')
        )
    );
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to trigger enrich for city %: %',
NEW.name,
SQLERRM;
RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_featured_photo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.global_dish_scores gds
    SET featured_photo_url = (
            SELECT pr.photo_url
            FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id
              AND pr.dish_type_id = NEW.dish_type_id
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC
            LIMIT 1
        ),
        featured_rating_id = (
            SELECT pr.id
            FROM public.personal_ratings pr
            WHERE pr.restaurant_id = NEW.restaurant_id
              AND pr.dish_type_id = NEW.dish_type_id
            ORDER BY pr.derived_score DESC NULLS LAST, pr.created_at DESC
            LIMIT 1
        )
    WHERE gds.restaurant_id = NEW.restaurant_id
      AND gds.dish_type_id  = NEW.dish_type_id;
    RETURN NEW;
END;
$function$
;


  create policy "Users can read their own comparisons"
  on "public"."comparisons"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER on_city_created_enrich_dish_types AFTER INSERT ON public.cities FOR EACH ROW EXECUTE FUNCTION public.trigger_enrich_city_dish_types();

drop policy "Admins can delete blog images" on "storage"."objects";

drop policy "Admins can update blog images" on "storage"."objects";

drop policy "Admins can upload blog images" on "storage"."objects";

drop policy "Public read access for blog images" on "storage"."objects";


