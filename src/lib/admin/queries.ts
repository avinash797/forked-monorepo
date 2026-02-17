import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  totalUsers: number;
  totalRatings: number;
  totalBattles: number;
  totalRestaurants: number;
  totalBlogPosts: number;
  activeCities: number;
  activeDishTypes: number;
};

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [users, ratings, battles, restaurants, blogPosts, cities, dishTypes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("personal_ratings")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("comparisons")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("cities")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("dish_types")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

  return {
    totalUsers: users.count ?? 0,
    totalRatings: ratings.count ?? 0,
    totalBattles: battles.count ?? 0,
    totalRestaurants: restaurants.count ?? 0,
    totalBlogPosts: blogPosts.count ?? 0,
    activeCities: cities.count ?? 0,
    activeDishTypes: dishTypes.count ?? 0,
  };
}

export type RecentRating = {
  id: string;
  raw_score: number;
  created_at: string | null;
  restaurant_name: string;
  dish_type_name: string;
  user_display_name: string;
};

export async function getRecentRatings(
  limit = 5
): Promise<RecentRating[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("personal_ratings")
    .select(
      "id, raw_score, created_at, restaurants(name), dish_types(name), profiles(display_name)"
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
      raw_score: r.raw_score,
      created_at: r.created_at,
      restaurant_name: restaurant?.name ?? "Unknown",
      dish_type_name: dishType?.name ?? "Unknown",
      user_display_name: profile?.display_name ?? "Anonymous",
    };
  });
}

export type RecentBlogPost = {
  id: string;
  title: string;
  status: string;
  created_at: string | null;
  author_name: string;
};

export async function getRecentBlogPosts(
  limit = 5
): Promise<RecentBlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, status, created_at, blog_authors(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((p) => {
    const author = p.blog_authors as unknown as { name: string } | null;
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      created_at: p.created_at,
      author_name: author?.name ?? "Unknown",
    };
  });
}
