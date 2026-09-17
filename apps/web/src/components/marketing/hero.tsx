import { ArrowRight, Trophy, MapPin, ChevronDown, Search, Swords, PlusCircle, User } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

interface HeroProps {
  onOpenEarlyAccess: () => void;
}

const MOCKED_POBOY_LEADERBOARD = [
  {
    rank: 1,
    name: "Roast Beef Debris Po'boy",
    variant: 'Roast Beef Debris',
    restaurant: 'Parkway Bakery & Tavern',
    neighborhood: 'Mid-City',
    winRate: 88,
    totalBattles: 1420,
    badge: '👑 #1 City King',
    img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  },
  {
    rank: 2,
    name: 'Garlic Gravy Roast Beef',
    variant: 'Roast Beef',
    restaurant: "Parasol's Bar",
    neighborhood: 'Irish Channel',
    winRate: 83,
    totalBattles: 1195,
    badge: '▲ #2 in NOLA',
    img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
  },
  {
    rank: 3,
    name: "Fried Shrimp Po'boy",
    variant: 'Fried Shrimp',
    restaurant: "Domilise's Po-Boy",
    neighborhood: 'Uptown',
    winRate: 79,
    totalBattles: 980,
    badge: 'Top 3',
    img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
  },
  {
    rank: 4,
    name: 'Frenchuletta & BBQ Shrimp',
    variant: 'Specialty Po-Boy',
    restaurant: "Liuzza's by the Track",
    neighborhood: 'Fairgrounds',
    winRate: 76,
    totalBattles: 840,
    badge: null,
    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
  },
];

export function Hero({ onOpenEarlyAccess }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-border">
      <div className="absolute top-0 right-0 w-96 h-96 bg-surface-2 rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left Column: Copy & Messaging */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-text-primary text-bg text-xs font-mono font-medium mb-5 shadow-xs">
              {IS_WAITLIST_MODE ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>FEATURES FINALIZED &bull; PRIVATE BETA TESTING</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span>NOW LIVE ON iOS & ANDROID</span>
                </>
              )}
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-[68px] tracking-tight leading-[1.03] text-text-primary mb-5">
              Rank the dish, <br />
              <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/40">
                not the place.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary font-medium max-w-xl mb-8">
              Star ratings flattened every city into a 4.2 blur. Forked isolates the dish: quick verdicts, head-to-head battles, and one undisputed city leaderboard.
            </p>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
              <button
                onClick={onOpenEarlyAccess}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-display font-bold text-base text-accent-on bg-accent hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                <span>{IS_WAITLIST_MODE ? "Request Beta Access" : "Download Forked App"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#leaderboards"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-display font-bold text-base text-text-primary bg-surface-2 hover:brightness-95 border border-border transition-all active:scale-95"
              >
                <Trophy className="w-4 h-4 text-accent" />
                <span>View Dish Leaderboards</span>
              </a>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-border">
              <div>
                <div className="font-display font-black text-2xl sm:text-3xl text-text-primary">0.0</div>
                <div className="text-xs sm:text-sm font-semibold text-text-tertiary mt-0.5">No stars. Battles only.</div>
              </div>
              <div>
                <div className="font-display font-black text-2xl sm:text-3xl text-accent">&lt;10s</div>
                <div className="text-xs sm:text-sm font-semibold text-text-tertiary mt-0.5">Log a plate & vote.</div>
              </div>
              <div>
                <div className="font-display font-black text-2xl sm:text-3xl text-text-primary">#1</div>
                <div className="text-xs sm:text-sm font-semibold text-text-tertiary mt-0.5">Public city leaderboard.</div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Mobile App Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[360px] sm:max-w-[390px] relative">

              {/* Phone Device Frame */}
              <div className="relative rounded-[40px] bg-[#121212] p-3.5 shadow-2xl ring-1 ring-black/10 border-4 border-[#262626]">

                {/* Dynamic Island / Speaker */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1C1C1E] rounded-full z-30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#121212] mr-3" />
                  <div className="w-2 h-2 rounded-full bg-[#2A2A2A]" />
                </div>

                {/* Inner Screen: Mocked Static In-App Leaderboard */}
                <div className="relative bg-[#FBF9F5] rounded-[32px] overflow-hidden text-[#121212] pt-6 pb-2 min-h-[580px] flex flex-col justify-between select-none shadow-inner">

                  {/* Phone In-App Status & Header */}
                  <div className="px-4 pt-1 pb-2">
                    {/* iOS Status Bar Time & Battery */}
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#121212] px-1 mb-3">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <span className="text-[10px]">5G</span>
                        <div className="w-5 h-2.5 rounded-sm border border-[#121212] p-0.5 flex items-center">
                          <div className="h-full w-3 bg-[#121212] rounded-2xs" />
                        </div>
                      </div>
                    </div>

                    {/* Location & Search Header */}
                    <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E13B22]" />
                        <span className="font-display font-black text-xs text-[#121212]">
                          New Orleans, LA
                        </span>
                        <ChevronDown className="w-3 h-3 text-[#737373]" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#F3EFEA] border border-[#E0D9CF] flex items-center justify-center text-[#737373]">
                        <Search className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Dish Title Strip */}
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-[#E13B22] font-bold">
                          Dish Leaderboard
                        </div>
                        <h3 className="font-display font-black text-xl tracking-tight text-[#121212] leading-tight">
                          Po&apos;boy
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-[#737373]">
                        1,420 Battles
                      </span>
                    </div>

                    {/* Variant Chips */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-hidden">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#121212] text-white shadow-2xs">
                        All
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F3EFEA] text-[#525252] border border-[#E0D9CF]">
                        Roast Beef
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F3EFEA] text-[#525252] border border-[#E0D9CF]">
                        Shrimp
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F3EFEA] text-[#525252] border border-[#E0D9CF]">
                        Oyster
                      </span>
                    </div>
                  </div>

                  {/* Mocked Static Po'boy Leaderboard Rows */}
                  <div className="px-3.5 space-y-2 my-auto">
                    {MOCKED_POBOY_LEADERBOARD.map((item) => (
                      <div
                        key={item.rank}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                          item.rank === 1
                            ? 'bg-white border-[#E13B22]/40 shadow-xs ring-1 ring-[#E13B22]/20'
                            : 'bg-white/90 border-[#E6E1D8]'
                        }`}
                      >
                        {/* Rank number badge */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-display font-black text-xs shrink-0 ${
                            item.rank === 1
                              ? 'bg-[#E13B22] text-white'
                              : item.rank === 2
                              ? 'bg-[#121212] text-white'
                              : item.rank === 3
                              ? 'bg-[#D4CEBF] text-[#121212]'
                              : 'bg-[#F3EFEA] text-[#737373]'
                          }`}
                        >
                          {item.rank}
                        </div>

                        {/* Thumbnail */}
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E6E1D8]"
                        />

                        {/* Dish Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="font-display font-extrabold text-xs text-[#121212] truncate leading-tight">
                              {item.name}
                            </h4>
                            <span className="font-mono text-[10px] font-bold text-[#E13B22] shrink-0">
                              {item.winRate}% Win
                            </span>
                          </div>

                          <div className="text-[10px] text-[#737373] truncate">
                            {item.restaurant} • {item.neighborhood}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.badge && (
                              <span
                                className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  item.rank === 1
                                    ? 'bg-[#E13B22]/10 text-[#E13B22]'
                                    : 'bg-[#F3EFEA] text-[#525252]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-[#A3A3A3]">
                              {item.totalBattles.toLocaleString()} battles
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* In-App Mobile Bottom Tab Bar */}
                  <div className="mt-2 pt-2.5 pb-2 border-t border-[#E6E1D8] bg-white/70 px-6 flex items-center justify-between text-[9px] font-bold">
                    <div className="flex flex-col items-center gap-0.5 text-[#E13B22]">
                      <Trophy className="w-4 h-4" />
                      <span>Rankings</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-[#A3A3A3]">
                      <Swords className="w-4 h-4" />
                      <span>Battles</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-[#A3A3A3]">
                      <PlusCircle className="w-4 h-4" />
                      <span>Log Plate</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-[#A3A3A3]">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Decorative floating badge */}
              <div className="absolute -bottom-4 -left-4 sm:-left-8 bg-white border border-[#E6E1D8] shadow-lg rounded-2xl p-3 max-w-[210px] hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#E13B22] text-white flex items-center justify-center font-bold text-xs">
                    #1
                  </div>
                  <span className="font-display font-extrabold text-xs text-[#121212]">
                    The City Says
                  </span>
                </div>
                <p className="text-[11px] text-[#525252] leading-tight">
                  Parkway Bakery • 88% win rate across 1,420 pairwise battles.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
