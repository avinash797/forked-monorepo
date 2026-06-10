import { createClient } from "@/lib/supabase/server";

export type DishTypeRow = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  aliases: string[] | null;
  launch_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  variation_count: number;
  tag_count: number;
};

export type DishTypeDetail = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  icon: string | null;
  placeholder_photo_url: string | null;
  aliases: string[] | null;
  launch_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type DishTypeVariationRow = {
  id: string;
  dish_type_id: string;
  name: string;
  slug: string;
  emoji: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type TasteTagRow = {
  id: string;
  dish_type_id: string | null;
  name: string;
  slug: string;
  created_at: string | null;
};

export type CityRow = {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  country: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  known_dish_count: number;
};

export type CityDetail = {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  country: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CityKnownDishRow = {
  city_id: string;
  dish_type_id: string;
  display_order: number | null;
  created_at: string | null;
  dish_type_name: string;
  dish_type_slug: string;
  dish_type_emoji: string | null;
};

export type DishTypePickerItem = {
  id: string;
  name: string;
  emoji: string | null;
};

export async function getDishTypes(): Promise<DishTypeRow[]> {
  const supabase = await createClient();

  const { data: dishTypes } = await supabase
    .from("dish_types")
    .select("id, name, slug, emoji, aliases, launch_order, is_active, created_at")
    .order("launch_order", { ascending: true, nullsFirst: false });

  if (!dishTypes) return [];

  const { data: variations } = await supabase
    .from("dish_type_variations")
    .select("dish_type_id");

  const { data: tags } = await supabase
    .from("taste_tags")
    .select("dish_type_id");

  const variationCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const v of variations ?? []) {
    variationCounts[v.dish_type_id] = (variationCounts[v.dish_type_id] ?? 0) + 1;
  }
  for (const t of tags ?? []) {
    if (t.dish_type_id) {
      tagCounts[t.dish_type_id] = (tagCounts[t.dish_type_id] ?? 0) + 1;
    }
  }

  return dishTypes.map((dt) => ({
    ...dt,
    variation_count: variationCounts[dt.id] ?? 0,
    tag_count: tagCounts[dt.id] ?? 0,
  }));
}

export async function getDishTypeById(id: string): Promise<DishTypeDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dish_types")
    .select("id, name, slug, emoji, icon, placeholder_photo_url, aliases, launch_order, is_active, created_at")
    .eq("id", id)
    .single();

  return data ?? null;
}

export async function getDishTypeVariations(
  dishTypeId: string
): Promise<DishTypeVariationRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dish_type_variations")
    .select("id, dish_type_id, name, slug, emoji, is_active, created_at")
    .eq("dish_type_id", dishTypeId)
    .order("name", { ascending: true });

  return (data ?? []) as DishTypeVariationRow[];
}

export async function getTasteTagsForDishType(
  dishTypeId: string
): Promise<TasteTagRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("taste_tags")
    .select("id, dish_type_id, name, slug, created_at")
    .eq("dish_type_id", dishTypeId)
    .order("name", { ascending: true });

  return (data ?? []) as TasteTagRow[];
}

export async function getCities(): Promise<CityRow[]> {
  const supabase = await createClient();

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug, state, country, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (!cities) return [];

  const { data: knownDishes } = await supabase
    .from("city_known_dishes")
    .select("city_id");

  const counts: Record<string, number> = {};
  for (const kd of knownDishes ?? []) {
    counts[kd.city_id] = (counts[kd.city_id] ?? 0) + 1;
  }

  return cities.map((c) => ({
    ...c,
    known_dish_count: counts[c.id] ?? 0,
  }));
}

export async function getCityById(id: string): Promise<CityDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, state, country, is_active, created_at, updated_at")
    .eq("id", id)
    .single();

  return data ?? null;
}

export async function getCityKnownDishes(
  cityId: string
): Promise<CityKnownDishRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("city_known_dishes")
    .select("city_id, dish_type_id, display_order, created_at, dish_types(name, slug, emoji)")
    .eq("city_id", cityId)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (!data) return [];

  return data.map((row) => {
    const dt = row.dish_types as unknown as {
      name: string;
      slug: string;
      emoji: string | null;
    } | null;
    return {
      city_id: row.city_id,
      dish_type_id: row.dish_type_id,
      display_order: row.display_order,
      created_at: row.created_at,
      dish_type_name: dt?.name ?? "",
      dish_type_slug: dt?.slug ?? "",
      dish_type_emoji: dt?.emoji ?? null,
    };
  });
}

export async function getAllDishTypesForPicker(): Promise<DishTypePickerItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dish_types")
    .select("id, name, emoji")
    .order("name", { ascending: true });

  return (data ?? []) as DishTypePickerItem[];
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeCategory = "milestone" | "battle" | "explorer" | "dish_type";
export type BadgeRuleType =
  | "total_ratings"
  | "total_comparisons"
  | "cities_count"
  | "dish_types_count"
  | "dish_type_count";

export type BadgeRow = {
  id: string;
  slug: string;
  name: string;
  category: BadgeCategory;
  rule_type: BadgeRuleType;
  threshold: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  earned_count: number;
  created_at: string | null;
};

export type BadgeDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  category: BadgeCategory;
  dish_type_id: string | null;
  threshold: number | null;
  rule_type: BadgeRuleType;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export async function getBadges(): Promise<BadgeRow[]> {
  const supabase = await createClient();

  const { data: badges } = await supabase
    .from("badge_definitions")
    .select(
      "id, slug, name, category, rule_type, threshold, is_active, is_featured, sort_order, created_at"
    )
    .order("sort_order", { ascending: true });

  if (!badges) return [];

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id");

  const earnedCounts: Record<string, number> = {};
  for (const ub of userBadges ?? []) {
    earnedCounts[ub.badge_id] = (earnedCounts[ub.badge_id] ?? 0) + 1;
  }

  return badges.map((b) => ({
    ...b,
    earned_count: earnedCounts[b.id] ?? 0,
  })) as BadgeRow[];
}

export async function getBadgeById(id: string): Promise<BadgeDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("badge_definitions")
    .select(
      "id, slug, name, description, image_url, category, dish_type_id, threshold, rule_type, is_active, is_featured, sort_order, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  return data as BadgeDetail | null;
}
