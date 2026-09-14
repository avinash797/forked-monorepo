CREATE OR REPLACE FUNCTION public.get_dish_type_entry_counts(
    p_city_id UUID
)
RETURNS TABLE(dish_type_id UUID, entry_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT dish_type_id, COUNT(*)::BIGINT AS entry_count
    FROM public.global_dish_scores
    WHERE city_id = p_city_id
      AND total_ratings >= 2
    GROUP BY dish_type_id;
$$;
