-- draft_05 re-creates match_location() and get_dish_type_entry_counts() without
-- a SET clause. CREATE OR REPLACE resets proconfig, so both lost the
-- search_path draft_03 pinned on them (advisor: function_search_path_mutable).
-- match_location's body calls st_setsrid/st_point/st_contains unqualified, so
-- it needs `extensions` on the path to resolve them at runtime.
ALTER FUNCTION public.match_location(double precision, double precision) SET search_path = public, extensions;
ALTER FUNCTION public.get_dish_type_entry_counts(uuid)                   SET search_path = public, extensions;
