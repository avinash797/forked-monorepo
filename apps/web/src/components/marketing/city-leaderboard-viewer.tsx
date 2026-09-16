import { Trophy, ArrowUpRight, Smartphone, ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { DISHES_BY_CITY } from "@/data/marketing-mock";
import type { LeaderboardEntry } from "@forked/supabase";

interface CityLeaderboardViewerProps {
  onOpenEarlyAccess: () => void;
}

interface FlagshipBoard {
  citySlug: string;
  cityName: string;
  dishTypeSlug: string;
  dishTypeName: string;
}

async function getFlagshipPreview(): Promise<{ flagship: FlagshipBoard; entries: LeaderboardEntry[] } | null> {
  try {
    const supabase = await createClient();
    const { data: flagshipRows } = await supabase.rpc("get_flagship_board");
    const flagship = flagshipRows?.[0];
    if (!flagship) return null;

    const { data: entries } = await supabase.rpc("get_leaderboard", {
      p_city_id: flagship.city_id,
      p_dish_type_id: flagship.dish_type_id,
      p_limit: 6,
    });

    return {
      flagship: {
        citySlug: flagship.city_slug,
        cityName: flagship.city_name,
        dishTypeSlug: flagship.dish_type_slug,
        dishTypeName: flagship.dish_type_name,
      },
      entries: (entries as unknown as LeaderboardEntry[]) ?? [],
    };
  } catch {
    return null;
  }
}

export async function CityLeaderboardViewer({ onOpenEarlyAccess }: CityLeaderboardViewerProps) {
  const preview = IS_WAITLIST_MODE ? null : await getFlagshipPreview();
  const useLiveData = !!preview?.entries?.length;
  const nolaDishes = DISHES_BY_CITY["nola"] ?? [];

  return (
    <section id="leaderboards" className="py-16 sm:py-24 bg-bg border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-text-primary text-bg text-xs font-mono font-medium uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            Official Scoreboard
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-text-primary tracking-tight leading-tight">
            The Leaderboard.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-2">
            Dishes ranked purely on pairwise battles by people who paid for their food. No star averages, no tourist inflation.
          </p>
        </div>

        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-7 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
              Dish Championship Scoreboard
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-text-primary mt-0.5">
              {useLiveData ? preview!.flagship.dishTypeName : "Po'boy"}
            </h3>
            <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">
              {useLiveData
                ? `Live rankings in ${preview!.flagship.cityName}`
                : "Variant comparisons across New Orleans • 1,420+ pairwise battles logged"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEarlyAccess}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-display font-bold text-bg bg-text-primary hover:brightness-110 transition-colors"
            >
              {IS_WAITLIST_MODE ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Request Beta</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Rank in App</span>
                </>
              )}
            </button>
          </div>
        </div>

        {useLiveData ? (
          <div className="space-y-3">
            {preview!.entries.map((entry) => (
              <div
                key={`${entry.restaurant_name}-${entry.rank}`}
                className={`rounded-2xl border transition-all p-4 sm:p-5 flex items-center justify-between gap-4 ${
                  entry.rank === 1
                    ? "bg-surface border-accent shadow-sm ring-1 ring-accent/20"
                    : "bg-surface border-border hover:border-text-tertiary"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-display font-black leading-none ${
                      entry.rank === 1 ? "bg-accent text-accent-on" : "bg-surface-2 text-text-primary border border-border"
                    }`}
                  >
                    <span className="text-lg">#{entry.rank}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-lg text-text-primary truncate">
                      {entry.restaurant_name}
                    </h4>
                    <div className="text-xs sm:text-sm text-text-secondary truncate">{entry.address}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-text-tertiary">{entry.total_ratings} ratings</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {nolaDishes.map((dish) => {
              const isFirst = dish.rank === 1;
              return (
                <div
                  key={dish.id}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isFirst
                      ? "bg-surface border-text-primary shadow-sm ring-1 ring-text-primary/20"
                      : "bg-surface border-border hover:border-text-tertiary"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-display font-black leading-none ${
                        isFirst ? "bg-accent text-accent-on shadow-xs" : "bg-surface-2 text-text-primary border border-border"
                      }`}
                    >
                      <span className="text-lg">#{dish.rank}</span>
                    </div>
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display font-black text-lg sm:text-xl text-text-primary leading-snug">
                        Po&apos;boy
                      </h4>
                      <div className="text-xs font-mono font-bold text-accent uppercase tracking-wider mt-0.5">
                        Variant: {dish.variant}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-text-secondary flex items-center gap-1.5 mt-1">
                        <span className="text-text-primary font-bold">{dish.restaurant}</span>
                        <span className="text-text-tertiary">&bull;</span>
                        <span className="text-text-tertiary">{dish.neighborhood}</span>
                        {dish.priceNote && (
                          <>
                            <span className="text-text-tertiary">&bull;</span>
                            <span className="text-text-tertiary font-mono">{dish.priceNote}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary mt-1.5 italic max-w-xl line-clamp-1 sm:line-clamp-2">
                        &quot;{dish.localTake}&quot;
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between pt-3 sm:pt-0 border-t sm:border-t-0 border-border shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                      <div className="font-display font-black text-lg sm:text-xl text-text-primary">
                        {dish.winRate}% <span className="text-xs font-mono font-normal text-text-tertiary">Win Rate</span>
                      </div>
                      <div className="text-[11px] font-mono text-text-tertiary">
                        {dish.totalBattles.toLocaleString()} head-to-head battles
                      </div>
                    </div>
                    <button
                      onClick={onOpenEarlyAccess}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-display font-bold bg-surface-2 hover:bg-text-primary hover:text-bg text-text-primary transition-colors flex items-center gap-1"
                    >
                      <span>{IS_WAITLIST_MODE ? "Join Waitlist" : "Vote in App"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-3xl bg-[#121212] border border-[#2E2E34] p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#E13B22] uppercase tracking-wider mb-2">
              {IS_WAITLIST_MODE ? (
                <>
                  <Clock className="w-4 h-4" />
                  Finalized Features &bull; In Testing
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  Thousands More Dishes In The App
                </>
              )}
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white mb-2">
              Want to see pizza, burgers, ramen, tacos, or wings?
            </h3>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              {IS_WAITLIST_MODE
                ? "Full leaderboards for pizza, smash burgers, hot chicken, and tacos are finalized and in private beta. Join the waitlist to test the app."
                : "Full leaderboards for pizza, smash burgers, hot chicken, and tacos are live in the app. Download now to settle your local debates."}
            </p>
          </div>
          <button
            onClick={onOpenEarlyAccess}
            className="px-6 py-3.5 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-black text-sm flex items-center gap-2 transition-all shrink-0 active:scale-95"
          >
            <span>{IS_WAITLIST_MODE ? "Join Beta Waitlist" : "Open in App"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
