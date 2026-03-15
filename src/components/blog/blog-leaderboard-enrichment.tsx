import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { LeaderboardEntry } from "@/types/rpc.types";

interface Props {
  cityId: string;
  dishTypeId: string;
  citySlug: string;
  dishTypeSlug: string;
  cityName: string;
  dishTypeName: string;
  dishTypeEmoji: string | null;
}

export async function BlogLeaderboardEnrichment({
  cityId,
  dishTypeId,
  citySlug,
  dishTypeSlug,
  cityName,
  dishTypeName,
  dishTypeEmoji,
}: Props) {
  let entries: LeaderboardEntry[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_leaderboard", {
      p_city_id: cityId,
      p_dish_type_id: dishTypeId,
      p_limit: 5,
    });
    entries = (data as unknown as LeaderboardEntry[]) ?? [];
  } catch {
    return null;
  }

  if (entries.length === 0) return null;

  return (
    <Card variant="surface2" className="my-8">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        {dishTypeEmoji && <span className="mr-1">{dishTypeEmoji}</span>}
        Top {dishTypeName} in {cityName}
      </h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-bold text-text-tertiary w-5 text-right shrink-0">
                {entry.rank}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {entry.restaurant_name}
                </p>
                {entry.address && (
                  <p className="text-xs text-text-tertiary truncate">
                    {entry.address}
                  </p>
                )}
              </div>
            </div>
            <ScoreBadge score={entry.bayesian_score} />
          </div>
        ))}
      </div>
      <Link
        href={`/leaderboard/${citySlug}/${dishTypeSlug}`}
        className="inline-block mt-4 text-sm font-semibold text-accent hover:underline"
      >
        View full leaderboard →
      </Link>
    </Card>
  );
}
