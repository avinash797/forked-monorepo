import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, MapPin } from "lucide-react";

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

    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", "new-orleans-louisiana")
      .single();

    if (!city) return [];

    const { data: dishType } = await supabase
      .from("dish_types")
      .select("id")
      .eq("slug", "po-boy")
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

export async function LeaderboardPreview() {
  const entries = await getLeaderboardPreview();

  return (
    <section id="leaderboard" className="py-24 md:py-32 px-6 bg-[#050505]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="font-display italic font-black text-4xl md:text-6xl uppercase leading-none mb-4 tracking-tighter">
              The <span className="text-[#FF4D00]">Champions</span> Wall
            </h2>
            <p className="text-white/40 text-sm max-w-md">
              Live rankings from New Orleans. Best Po'boys, ranked by real dish
              battles.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-[#FF4D00] border border-[#FF4D00] px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-white shadow-[0_5px_15px_rgba(255,77,0,0.3)]">
              PO'BOY
            </span>
            <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-white/60">
              GUMBO
            </span>
            <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-white/60">
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
                className="group flex items-center justify-between p-4 md:p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all "
              >
                <div className="flex items-center gap-6">
                  <span
                    className={`text-2xl font-black italic ${
                      entry.rank === 1 ? "text-[#FF4D00]" : "text-white/20"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div>
                    <h4 className="text-lg font-black tracking-tight uppercase group-hover:text-[#FF4D00] transition-colors">
                      {entry.restaurant_name}
                    </h4>
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
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
                    <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">
                      ELO
                    </p>
                  </div>
                  <div>
                    <span className="text-xl font-mono font-bold">
                      {entry.avg_raw_score?.toFixed(1) ?? "—"}
                    </span>
                    <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">
                      SCORE
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-white/40">
              Leaderboard data coming soon. Be the first to rate!
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#FF4D00]/10 to-transparent p-8 md:p-12 rounded-3xl border border-[#FF4D00]/20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h3 className="font-display font-black italic text-2xl md:text-3xl mb-2">
              Think You&apos;re a Connoisseur?
            </h3>
            <p className="text-white/60 text-sm font-light">
              Explore the full leaderboards and see who dominates every dish
              type.
            </p>
          </div>
          <Link
            href="/leaderboard/new-orleans-louisiana/gumbo"
            className="bg-white text-black px-10 py-5 rounded-2xl font-black tracking-[0.2em] text-xs hover:bg-[#FF4D00] hover:text-white transition-all shrink-0"
          >
            FULL LEADERBOARD
          </Link>
        </div>
      </div>
    </section>
  );
}
