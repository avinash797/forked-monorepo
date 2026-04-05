-- Add neighborhood_name to get_leaderboard results
-- Add variation_name to get_personal_rankings results

-- ============================================================
-- LEADERBOARD: get_leaderboard (add neighborhood_name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
        p_dish_type_id UUID,
        p_city_id UUID,
        p_neighborhood_id UUID DEFAULT NULL,
        p_limit INTEGER DEFAULT 25,
        p_offset INTEGER DEFAULT 0
    ) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
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
$$;

-- ============================================================
-- PERSONAL: get_personal_rankings (add variation_name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_personal_rankings(
        p_dish_type_id UUID,
        p_limit INTEGER DEFAULT 50,
        p_offset INTEGER DEFAULT 0
    ) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID := auth.uid();
v_results JSONB;
BEGIN
SELECT jsonb_agg(
        row_data
        ORDER BY rank_num
    ) INTO v_results
FROM (
        SELECT jsonb_build_object(
                'rank',
                ROW_NUMBER() OVER (
                    ORDER BY pr.elo_score DESC
                ),
                'rating_id',
                pr.id,
                'restaurant_id',
                r.id,
                'restaurant_name',
                r.name,
                'elo_score',
                pr.elo_score,
                'derived_score',
                pr.derived_score,
                'sentiment',
                pr.sentiment,
                'photo_url',
                pr.photo_url,
                'comparison_count',
                pr.comparison_count,
                'notes',
                pr.notes,
                'rated_at',
                pr.updated_at,
                'variation_name',
                dtv.name,
                'neighborhood_name',
                n.name,
                'city_name',
                c.name
            ) AS row_data,
            ROW_NUMBER() OVER (
                ORDER BY pr.elo_score DESC
            ) AS rank_num
        FROM personal_ratings pr
            JOIN restaurants r ON r.id = pr.restaurant_id
            LEFT JOIN public.dish_type_variations dtv ON dtv.id = pr.variation_id
            LEFT JOIN public.neighborhoods n ON n.id = r.neighborhood_id
            LEFT JOIN public.cities c ON c.id = r.city_id
        WHERE pr.user_id = v_user_id
            AND pr.dish_type_id = p_dish_type_id
            AND pr.battle_status = 'completed'
        ORDER BY pr.elo_score DESC
        LIMIT p_limit OFFSET p_offset
    ) ranked;
RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;
