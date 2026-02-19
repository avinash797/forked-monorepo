-- Migration: Consolidate leaderboard RPC functions
-- Description: Merges the tie-breaker logic into the main get_leaderboard function
--              and removes the redundant get_leaderboard_with_tiebreakers function.
-- 1. Drop the redundant function
DROP FUNCTION IF EXISTS public.get_leaderboard_with_tiebreakers(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_leaderboard_with_tiebreakers(UUID, UUID, UUID, INTEGER);
-- 2. Redefine get_leaderboard as the single source of truth
CREATE OR REPLACE FUNCTION public.get_leaderboard(
        p_city_id UUID,
        p_dish_type_id UUID,
        p_neighborhood_id UUID DEFAULT NULL,
        p_limit INTEGER DEFAULT 10,
        p_min_battles INTEGER DEFAULT 5,
        p_min_ratings INTEGER DEFAULT 3
    ) RETURNS TABLE (
        rank BIGINT,
        restaurant_id UUID,
        restaurant_name TEXT,
        neighborhood_name TEXT,
        global_elo DECIMAL,
        total_battles INTEGER,
        win_rate DECIMAL,
        confidence_score DECIMAL,
        avg_raw_score DECIMAL,
        total_ratings INTEGER,
        featured_photo_url TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY gds.global_elo DESC,
            gds.win_rate DESC,
            gds.total_battles DESC,
            gds.avg_raw_score DESC,
            gds.created_at ASC
    )::BIGINT AS rank,
    gds.restaurant_id,
    r.name AS restaurant_name,
    n.name AS neighborhood_name,
    gds.global_elo,
    gds.total_battles,
    gds.win_rate,
    gds.confidence_score,
    gds.avg_raw_score,
    gds.total_ratings,
    gds.featured_photo_url
FROM global_dish_scores gds
    JOIN restaurants r ON r.id = gds.restaurant_id
    LEFT JOIN neighborhoods n ON n.id = gds.neighborhood_id
WHERE gds.city_id = p_city_id
    AND gds.dish_type_id = p_dish_type_id
    AND (
        p_neighborhood_id IS NULL
        OR gds.neighborhood_id = p_neighborhood_id
    )
    AND gds.total_battles >= p_min_battles
    AND gds.total_ratings >= p_min_ratings
    AND r.is_closed = false
ORDER BY gds.global_elo DESC,
    gds.win_rate DESC,
    gds.total_battles DESC
LIMIT p_limit;
END;
$$;