import { createClient } from "@/lib/supabase/server";

export type AdminUserListItem = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string;
  is_banned: boolean;
  total_ratings: number | null;
  total_comparisons: number | null;
  credibility_score: number | null;
  created_at: string | null;
};

export type UserListFilters = {
  filter?: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export async function getAdminUserList(filters: UserListFilters = {}) {
  const { filter = "all", search, page = 1, perPage = 25 } = filters;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, username, avatar_url, role, is_banned, total_ratings, total_comparisons, credibility_score, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filter === "banned") {
    query = query.eq("is_banned", true);
  } else if (filter === "admins") {
    query = query.eq("role", "admin");
  } else if (filter === "active") {
    query = query.eq("is_banned", false);
  }

  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,username.ilike.%${search}%`
    );
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { users: [] as AdminUserListItem[], total: 0 };
  }

  return {
    users: (data ?? []) as AdminUserListItem[],
    total: count ?? 0,
  };
}

export type AdminUserDetail = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  warned_at: string | null;
  warn_count: number;
  total_ratings: number | null;
  total_comparisons: number | null;
  credibility_score: number | null;
  created_at: string | null;
  home_city: { name: string } | null;
};

export async function getAdminUserById(
  id: string
): Promise<AdminUserDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, avatar_url, bio, role, is_banned, banned_at, ban_reason, warned_at, warn_count, total_ratings, total_comparisons, credibility_score, created_at, cities!profiles_home_city_id_fkey(name)"
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const cityData = data.cities as unknown as { name: string } | null;

  return {
    id: data.id,
    display_name: data.display_name,
    username: data.username,
    avatar_url: data.avatar_url,
    bio: data.bio,
    role: data.role,
    is_banned: data.is_banned,
    banned_at: data.banned_at,
    ban_reason: data.ban_reason,
    warned_at: data.warned_at,
    warn_count: data.warn_count,
    total_ratings: data.total_ratings,
    total_comparisons: data.total_comparisons,
    credibility_score: data.credibility_score,
    created_at: data.created_at,
    home_city: cityData,
  };
}

export type UserRating = {
  id: string;
  derived_score: number | null;
  created_at: string | null;
  restaurant_name: string;
  dish_type_name: string;
};

export async function getUserRatings(
  userId: string,
  limit = 20
): Promise<UserRating[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("personal_ratings")
    .select("id, derived_score, created_at, restaurants(name), dish_types(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((r) => {
    const restaurant = r.restaurants as unknown as { name: string } | null;
    const dishType = r.dish_types as unknown as { name: string } | null;
    return {
      id: r.id,
      derived_score: r.derived_score,
      created_at: r.created_at,
      restaurant_name: restaurant?.name ?? "Unknown",
      dish_type_name: dishType?.name ?? "Unknown",
    };
  });
}

export type WaitlistEntry = {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
};

export type WaitlistFilters = {
  search?: string;
  page?: number;
  perPage?: number;
};

export async function getWaitlist(filters: WaitlistFilters = {}) {
  const { search, page = 1, perPage = 25 } = filters;
  const supabase = await createClient();

  let query = supabase
    .from("user_waitlist")
    .select("id, email, source, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { entries: [] as WaitlistEntry[], total: 0 };
  }

  return {
    entries: (data ?? []) as WaitlistEntry[],
    total: count ?? 0,
  };
}

export type AdminAction = {
  id: string;
  action_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export async function getUserModHistory(
  userId: string,
  limit = 20
): Promise<AdminAction[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_actions")
    .select("id, action_type, details, created_at")
    .eq("target_id", userId)
    .eq("target_type", "user")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AdminAction[];
}
