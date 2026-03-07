import { createClient } from "@/lib/supabase/server";

export type ContentFlag = {
  id: string;
  flag_type: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  status: string;
  reporter_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type FlagFilters = {
  status?: string;
  page?: number;
  perPage?: number;
};

export async function getContentFlags(filters: FlagFilters = {}) {
  const { status = "pending", page = 1, perPage = 25 } = filters;
  const supabase = await createClient();

  let query = supabase
    .from("content_flags")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { flags: [] as ContentFlag[], total: 0 };
  }

  return {
    flags: (data ?? []) as ContentFlag[],
    total: count ?? 0,
  };
}

export async function getFlagCounts() {
  const supabase = await createClient();

  const { count: pending } = await supabase
    .from("content_flags")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: reviewed } = await supabase
    .from("content_flags")
    .select("id", { count: "exact", head: true })
    .eq("status", "reviewed");

  const { count: dismissed } = await supabase
    .from("content_flags")
    .select("id", { count: "exact", head: true })
    .eq("status", "dismissed");

  return {
    pending: pending ?? 0,
    reviewed: reviewed ?? 0,
    dismissed: dismissed ?? 0,
  };
}

export type PhotoForReview = {
  id: string;
  photo_url: string;
  derived_score: number | null;
  restaurant_name: string;
  dish_type_name: string;
  user_display_name: string;
  created_at: string | null;
};

export async function getPhotosForReview(limit = 30): Promise<PhotoForReview[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("personal_ratings")
    .select(
      "id, photo_url, derived_score, created_at, restaurants(name), dish_types(name), profiles(display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((r) => {
    const restaurant = r.restaurants as unknown as { name: string } | null;
    const dishType = r.dish_types as unknown as { name: string } | null;
    const profile = r.profiles as unknown as {
      display_name: string | null;
    } | null;

    return {
      id: r.id,
      photo_url: r.photo_url,
      derived_score: r.derived_score,
      restaurant_name: restaurant?.name ?? "Unknown",
      dish_type_name: dishType?.name ?? "Unknown",
      user_display_name: profile?.display_name ?? "Anonymous",
      created_at: r.created_at,
    };
  });
}

export type RestaurantForModeration = {
  id: string;
  name: string;
  address: string | null;
  is_verified: boolean | null;
  is_closed: boolean | null;
  city_name: string | null;
  created_at: string | null;
};

export async function getRestaurantsForModeration(
  filters: { search?: string; page?: number; perPage?: number } = {}
) {
  const { search, page = 1, perPage = 25 } = filters;
  const supabase = await createClient();

  let query = supabase
    .from("restaurants")
    .select("id, name, address, is_verified, is_closed, created_at, cities(name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { restaurants: [] as RestaurantForModeration[], total: 0 };
  }

  const restaurants = (data ?? []).map((r) => {
    const city = r.cities as unknown as { name: string } | null;
    return {
      id: r.id,
      name: r.name,
      address: r.address,
      is_verified: r.is_verified,
      is_closed: r.is_closed,
      city_name: city?.name ?? null,
      created_at: r.created_at,
    };
  });

  return { restaurants, total: count ?? 0 };
}
