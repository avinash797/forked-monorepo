import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  restaurant_name: string;
  neighborhood_name: string;
  global_elo: number;
  confidence_score: number;
  avg_raw_score: number;
  total_ratings: number;
  featured_photo_url: string;
}

async function getLeaderboardPreview(): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();

    // Get New Orleans city
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", "new-orleans-louisiana")
      .single();

    if (!city) return [];

    // Get Gumbo dish type
    const { data: dishType } = await supabase
      .from("dish_types")
      .select("id")
      .eq("slug", "gumbo")
      .single();

    if (!dishType) return [];

    const { data } = await supabase.rpc("get_leaderboard", {
      p_city_id: city.id,
      p_dish_type_id: dishType.id,
      p_limit: 5,
      p_min_battles: 0,
      p_min_ratings: 0,
    });

    return (data as LeaderboardEntry[]) ?? [];
  } catch {
    return [];
  }
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export async function LeaderboardPreview() {
  const entries = await getLeaderboardPreview();

  return (
    <section className="py-20 sm:py-28 bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          Best Gumbo in New Orleans
        </h2>
        <p className="text-text-secondary text-center mb-12">
          Live rankings powered by real dish battles
        </p>

        {entries.length > 0 ? (
          <div className="space-y-3 mb-10">
            {entries.map((entry) => (
              <div
                key={`${entry.restaurant_name}-${entry.rank}`}
                className="flex items-center gap-4 bg-surface rounded-lg border border-border p-4 hover:border-accent/30 transition-colors"
              >
                <span className="text-xl w-10 text-center flex-shrink-0">
                  {getRankDisplay(entry.rank)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">
                    {entry.restaurant_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {entry.neighborhood_name}
                    {entry.total_ratings > 0 && (
                      <span className="ml-2 text-text-tertiary">
                        {entry.total_ratings} rating
                        {entry.total_ratings !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <ScoreBadge score={entry.avg_raw_score ?? 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface rounded-lg border border-border mb-10">
            <p className="text-text-secondary">
              Leaderboard data coming soon. Be the first to rate!
            </p>
          </div>
        )}

        <div className="text-center">
          <Link href="/leaderboard/new-orleans-louisiana/gumbo">
            <Button variant="secondary" size="lg">
              See Full Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
