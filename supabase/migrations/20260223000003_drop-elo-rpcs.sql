-- =============================================================================
-- Migration: Three-Tier Rating System — Drop Legacy Elo Functions
--
-- Apply LAST after app is deployed and tested with the new system.
-- Safe to run once 20260223000001 and 20260223000002 are applied.
-- =============================================================================

-- Legacy entry-point (replaced by create_rating)
DROP FUNCTION IF EXISTS public.post_rating_and_get_duel(UUID, UUID, TEXT, NUMERIC, UUID, TEXT);
DROP FUNCTION IF EXISTS public.post_rating_and_get_duel(UUID, UUID, TEXT, NUMERIC, UUID, TEXT, UUID[]);
-- Legacy battle processing (replaced by process_battle / skip_battle)
DROP FUNCTION IF EXISTS public.submit_comparison(UUID, UUID);
DROP FUNCTION IF EXISTS public.process_comparison(UUID, UUID, UUID, UUID, BOOLEAN, TEXT);
-- Legacy opponent matching
DROP FUNCTION IF EXISTS public.find_comparison_candidate(UUID, UUID, UUID, NUMERIC);
-- Legacy Elo math helpers
DROP FUNCTION IF EXISTS public.calculate_new_elo(NUMERIC, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS public.calculate_expected_score(NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS public.get_k_factor(INTEGER, NUMERIC);
-- Legacy global score update (replaced by compute_community_score)
DROP FUNCTION IF EXISTS public.update_global_dish_score(UUID, NUMERIC, NUMERIC, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_global_dish_score(UUID);
-- Legacy pending comparisons (standalone flow removed)
DROP FUNCTION IF EXISTS public.get_pending_comparisons(INTEGER);
-- Legacy confidence + credibility calculations
DROP FUNCTION IF EXISTS public.calculate_confidence_score(INTEGER, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS public.calculate_user_credibility(UUID);
DROP FUNCTION IF EXISTS public.check_user_skip_rate();
DROP FUNCTION IF EXISTS public.check_rate_limit();
-- Legacy update_existing_rating (can be re-implemented using create_rating on top of the new schema)
DROP FUNCTION IF EXISTS public.update_existing_rating(UUID, NUMERIC, TEXT, TEXT, UUID[]);
DROP FUNCTION IF EXISTS public.update_existing_rating(UUID, INTEGER, TEXT, TEXT, UUID[]);
