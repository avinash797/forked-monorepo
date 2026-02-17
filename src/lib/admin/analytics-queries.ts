import { createClient } from "@/lib/supabase/server";

export type DailyStat = {
  day: string;
  new_users: number;
  new_ratings: number;
  new_battles: number;
};

export async function getDailyStats(
  startDate: string,
  endDate: string
): Promise<DailyStat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_admin_daily_stats", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error || !data) return [];
  return data as DailyStat[];
}

export type CityBreakdown = {
  city_id: string;
  city_name: string;
  total_ratings: number;
  total_battles: number;
  total_restaurants: number;
};

export async function getCityBreakdown(): Promise<CityBreakdown[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_admin_city_breakdown");

  if (error || !data) return [];
  return data as CityBreakdown[];
}

export type DishTypeBreakdown = {
  dish_type_id: string;
  dish_type_name: string;
  total_ratings: number;
  total_battles: number;
  avg_score: number | null;
};

export async function getDishTypeBreakdown(): Promise<DishTypeBreakdown[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_admin_dish_type_breakdown");

  if (error || !data) return [];
  return data as DishTypeBreakdown[];
}

export type LeaderboardHealth = {
  total_entries: number;
  high_confidence: number;
  medium_confidence: number;
  low_confidence: number;
};

export async function getLeaderboardHealth(): Promise<LeaderboardHealth> {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from("global_dish_scores")
    .select("id", { count: "exact", head: true });

  const { count: high } = await supabase
    .from("global_dish_scores")
    .select("id", { count: "exact", head: true })
    .gte("confidence_score", 70);

  const { count: medium } = await supabase
    .from("global_dish_scores")
    .select("id", { count: "exact", head: true })
    .gte("confidence_score", 40)
    .lt("confidence_score", 70);

  const { count: low } = await supabase
    .from("global_dish_scores")
    .select("id", { count: "exact", head: true })
    .lt("confidence_score", 40);

  return {
    total_entries: total ?? 0,
    high_confidence: high ?? 0,
    medium_confidence: medium ?? 0,
    low_confidence: low ?? 0,
  };
}
