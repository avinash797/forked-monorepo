import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { MapPin } from "lucide-react";
import type { LeaderboardEntry } from "@forked/supabase";

const MOCK_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    restaurant_id: "mock-1",
    restaurant_name: "Parkway Bakery & Tavern",
    address: "Mid-City",
    bayesian_score: 9.1,
    confidence_tier: "high",
    total_ratings: 312,
    featured_photo_url: null,
    neighborhood_name: null,
  },
  {
    rank: 2,
    restaurant_id: "mock-2",
    restaurant_name: "Domilise's Po-Boy & Bar",
    address: "Uptown",
    bayesian_score: 8.8,
    confidence_tier: "high",
    total_ratings: 274,
    featured_photo_url: null,
    neighborhood_name: null,
  },
  {
    rank: 3,
    restaurant_id: "mock-3",
    restaurant_name: "Mahony's Po-Boy Shop",
    address: "Magazine Street",
    bayesian_score: 8.6,
    confidence_tier: "high",
    total_ratings: 198,
    featured_photo_url: null,
    neighborhood_name: null,
  },
  {
    rank: 4,
    restaurant_id: "mock-4",
    restaurant_name: "Guy's Po-Boys",
    address: "Uptown",
    bayesian_score: 8.3,
    confidence_tier: "medium",
    total_ratings: 167,
    featured_photo_url: null,
    neighborhood_name: null,
  },
  {
    rank: 5,
    restaurant_id: "mock-5",
    restaurant_name: "R&O's Restaurant",
    address: "Bucktown",
    bayesian_score: 8.1,
    confidence_tier: "medium",
    total_ratings: 143,
    featured_photo_url: null,
    neighborhood_name: null,
  },
];

async function getLeaderboardPreview(): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();

    const [{ data: city }, { data: dishType }] = await Promise.all([
      supabase
        .from("cities")
        .select("id")
        .eq("slug", "new-orleans-louisiana")
        .single(),
      supabase.from("dish_types").select("id").eq("slug", "po-boy").single(),
    ]);

    if (!city || !dishType) return [];

    const { data } = await supabase.rpc("get_leaderboard", {
      p_city_id: city.id,
      p_dish_type_id: dishType.id,
      p_limit: 5,
    });

    return (data as unknown as LeaderboardEntry[]) ?? [];
  } catch {
    return [];
  }
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "text-gold";
  if (rank === 2) return "text-silver";
  if (rank === 3) return "text-bronze";
  return "text-text-tertiary";
}

function getRankRowStyle(rank: number): string {
  if (rank === 1)
    return "bg-gradient-to-r from-gold/5 to-transparent border-gold/20 hover:border-gold/40";
  return "bg-surface-2 border-border hover:bg-surface hover:border-text-tertiary";
}

export async function LeaderboardPreview() {
  const entries = IS_WAITLIST_MODE
    ? MOCK_ENTRIES
    : await getLeaderboardPreview();

  return (
    <section id="leaderboard" className="py-24 md:py-32 px-6 bg-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-3">
              LIVE RANKINGS
            </p>
            <h2 className="font-display italic font-black text-4xl md:text-6xl uppercase leading-none tracking-tighter">
              The <span className="text-accent">Real</span> List.
            </h2>
            <p className="text-text-secondary text-sm max-w-md mt-3">
              Not sponsored. Not paid. The only way to climb is to serve better
              food.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-accent border border-accent px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-accent-on shadow-[0_5px_15px_rgba(238,108,43,0.25)]">
              PO&apos;BOY
            </span>
            <span className="bg-surface-2 border border-border px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-text-secondary hover:text-text-primary transition-colors">
              GUMBO
            </span>
            <span className="bg-surface-2 border border-border px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-text-secondary hover:text-text-primary transition-colors">
              JAMBALAYA
            </span>
          </div>
        </div>

        {/* Leaderboard Rows */}
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={`${entry.restaurant_name}-${entry.rank}`}
                className={`group flex items-center justify-between p-4 md:p-5 border rounded-2xl transition-all ${getRankRowStyle(entry.rank)}`}
              >
                <div className="flex items-center gap-5">
                  {/* Rank number with medal colors */}
                  <span
                    className={`text-2xl font-black italic w-8 shrink-0 text-center tabular-nums ${getRankStyle(entry.rank)}`}
                  >
                    {entry.rank}
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-base md:text-lg font-black tracking-tight uppercase truncate group-hover:text-accent transition-colors">
                      {entry.restaurant_name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-text-secondary text-xs font-bold uppercase tracking-widest mt-0.5">
                      <MapPin size={9} className="shrink-0" />
                      <span className="truncate">{entry.address}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest">
                    {entry.total_ratings} ratings
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface-2 border border-border rounded-2xl">
            <p className="text-text-secondary">
              Leaderboard data coming soon. Be the first to rate!
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        {!IS_WAITLIST_MODE && (
          <div className="mt-10 bg-gradient-to-r from-accent/10 to-transparent p-8 md:p-12 rounded-3xl border border-accent/20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h3 className="font-display font-black italic text-2xl md:text-3xl mb-2">
                Disagree with this list?
              </h3>
              <p className="text-text-secondary text-sm font-light">
                Download Forked and vote. Your battles change the ranking.
              </p>
            </div>
            <Link
              href="/leaderboard/new-orleans-louisiana/gumbo"
              className="bg-text-primary text-bg px-10 py-5 rounded-2xl font-black tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-on transition-all shrink-0"
            >
              FULL LEADERBOARD
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
