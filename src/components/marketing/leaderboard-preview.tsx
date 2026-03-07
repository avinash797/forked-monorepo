import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { MapPin } from "lucide-react";

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

const MOCK_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    restaurant_name: "Parkway Bakery & Tavern",
    neighborhood_name: "Mid-City",
    global_elo: 1842,
    confidence_score: 0.94,
    avg_raw_score: 9.1,
    total_ratings: 312,
    featured_photo_url: "",
  },
  {
    rank: 2,
    restaurant_name: "Domilise's Po-Boy & Bar",
    neighborhood_name: "Uptown",
    global_elo: 1809,
    confidence_score: 0.91,
    avg_raw_score: 8.8,
    total_ratings: 274,
    featured_photo_url: "",
  },
  {
    rank: 3,
    restaurant_name: "Mahony's Po-Boy Shop",
    neighborhood_name: "Magazine Street",
    global_elo: 1776,
    confidence_score: 0.88,
    avg_raw_score: 8.6,
    total_ratings: 198,
    featured_photo_url: "",
  },
  {
    rank: 4,
    restaurant_name: "Guy's Po-Boys",
    neighborhood_name: "Uptown",
    global_elo: 1744,
    confidence_score: 0.85,
    avg_raw_score: 8.3,
    total_ratings: 167,
    featured_photo_url: "",
  },
  {
    rank: 5,
    restaurant_name: "R&O's Restaurant",
    neighborhood_name: "Bucktown",
    global_elo: 1718,
    confidence_score: 0.82,
    avg_raw_score: 8.1,
    total_ratings: 143,
    featured_photo_url: "",
  },
];

async function getLeaderboardPreview(): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();

    // Resolve city and dish type IDs in parallel
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

export async function LeaderboardPreview() {
  const entries = IS_WAITLIST_MODE
    ? MOCK_ENTRIES
    : await getLeaderboardPreview();

  return (
    <section id="leaderboard" className="py-24 md:py-32 px-6 bg-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="font-display italic font-black text-4xl md:text-6xl uppercase leading-none mb-4 tracking-tighter">
              The <span className="text-accent">Champions</span> Wall
            </h2>
            <p className="text-text-secondary text-sm max-w-md">
              View the live rankings for the best dishes in your city.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-accent border border-accent px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-accent-on shadow-[0_5px_15px_rgba(var(--color-accent),0.3)]">
              PO&apos;BOY
            </span>
            <span className="bg-surface-2 border border-border px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-text-secondary">
              GUMBO
            </span>
            <span className="bg-surface-2 border border-border px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-text-secondary">
              JAMBALAYA
            </span>
          </div>
        </div>

        {/* Leaderboard Rows */}
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={`${entry.restaurant_name}-${entry.rank}`}
                className="group flex items-center justify-between p-4 md:p-6 bg-surface-2 border border-border rounded-2xl hover:bg-surface hover:border-text-tertiary transition-all "
              >
                <div className="flex items-center gap-6">
                  <span
                    className={`text-2xl font-black italic ${
                      entry.rank === 1 ? "text-accent" : "text-text-tertiary"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div>
                    <h4 className="text-lg font-black tracking-tight uppercase group-hover:text-accent transition-colors">
                      {entry.restaurant_name}
                    </h4>
                    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-widest">
                      <MapPin size={10} />
                      {entry.neighborhood_name}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-8">
                  <div className="hidden sm:block">
                    <span className="text-xl font-mono font-bold">
                      {Math.round(entry.global_elo)}
                    </span>
                    <p className="text-[8px] text-text-tertiary uppercase font-black tracking-widest">
                      ELO
                    </p>
                  </div>
                  <div>
                    <span className="text-xl font-mono font-bold">
                      {entry.avg_raw_score?.toFixed(1) ?? "—"}
                    </span>
                    <p className="text-[8px] text-text-tertiary uppercase font-black tracking-widest">
                      SCORE
                    </p>
                  </div>
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
          <div className="mt-12 bg-gradient-to-r from-accent/10 to-transparent p-8 md:p-12 rounded-3xl border border-accent/20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h3 className="font-display font-black italic text-2xl md:text-3xl mb-2">
                Think You&apos;re a Connoisseur?
              </h3>
              <p className="text-text-secondary text-sm font-light">
                Explore the full leaderboards and see who dominates every dish
                type.
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
