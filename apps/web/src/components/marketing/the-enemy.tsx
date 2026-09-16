import { XCircle, CheckCircle2, ArrowRight, Flame } from 'lucide-react';

export function TheEnemy() {
  return (
    <section id="the-enemy" className="py-16 sm:py-24 bg-[#121212] text-[#FBF9F5] relative overflow-hidden">
      {/* Decorative subtle texture */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#E13B22]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] text-[#E13B22] text-xs font-mono font-bold tracking-widest uppercase mb-4">
            <Flame className="w-3.5 h-3.5" />
            The Enemy
          </div>

          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.08] mb-4">
            A 4.2 tells you nothing. <br />
            <span className="text-[#A3A3A3]">
              The five-star average is broken.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#D4D4D4] leading-relaxed max-w-2xl">
            1,000 spots in your city trapped between 4.1 and 4.5. Bad parking and boring salads drag down transcendent food. Forked ranks the plate, not the parking lot.
          </p>
        </div>

        {/* Side-by-side Visual Contrast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-14">

          {/* Box 1: The Broken 5-Star Blur */}
          <div className="rounded-3xl bg-[#1C1C1E] border border-[#2E2E32] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2E2E32] mb-6">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="font-display font-bold text-sm tracking-wide text-red-400 uppercase">
                    The Current Alternative
                  </span>
                </div>
                <span className="font-mono text-xs text-[#737373]">
                  Restaurant Averages
                </span>
              </div>

              {/* Fake Restaurant Header with Broken Rating */}
              <div className="bg-[#242428] rounded-2xl p-4 border border-[#333338] mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-bold text-lg text-white">
                      Salvatore’s Corner Tavern
                    </h4>
                    <p className="text-xs text-[#A3A3A3]">
                      Italian • Casual Dining • Mid-City
                    </p>
                  </div>
                  <div className="bg-[#2E2E34] px-3 py-1 rounded-lg text-right border border-[#44444C]">
                    <div className="text-base font-black text-amber-400 font-mono">
                      3.7 ★
                    </div>
                    <div className="text-[10px] text-[#8E8E93]">114 reviews</div>
                  </div>
                </div>

                {/* Irrelevant reviews that drag the score down */}
                <div className="mt-4 space-y-2 pt-3 border-t border-[#333338]">
                  <div className="text-xs bg-[#1C1C1E] p-2.5 rounded-lg border border-[#2E2E32]">
                    <span className="text-red-400 font-bold font-mono">1.0 ★ </span>
                    <span className="text-[#D4D4D4]">&quot;20 minutes to find parking on Saturday. Never returning.&quot;</span>
                  </div>
                  <div className="text-xs bg-[#1C1C1E] p-2.5 rounded-lg border border-[#2E2E32]">
                    <span className="text-amber-400 font-bold font-mono">2.0 ★ </span>
                    <span className="text-[#D4D4D4]">&quot;House salad was plain iceberg with bottled dressing.&quot;</span>
                  </div>
                  <div className="text-xs bg-[#1C1C1E] p-2.5 rounded-lg border border-[#2E2E32] opacity-75">
                    <span className="text-emerald-400 font-bold font-mono">5.0 ★ </span>
                    <span className="text-[#D4D4D4]">&quot;Best wood-fired margherita slice in the state.&quot; (Lost in noise)</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <ul className="space-y-2 text-xs sm:text-sm text-[#A3A3A3]">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Decor &amp; parking</strong> drag down legendary food.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Comped influencers</strong> dish out fake 10/10s.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Zero dish clarity:</strong> you still don’t know what to order.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2E32] text-xs font-mono text-[#8E8E93]">
              Result: You skip the city’s best slice because the venue average is 3.7.
            </div>
          </div>

          {/* Box 2: The Forked Verdict */}
          <div className="rounded-3xl bg-[#E13B22]/10 border-2 border-[#E13B22] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E13B22]/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E13B22]/20 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#E13B22] shrink-0" />
                  <span className="font-display font-extrabold text-sm tracking-wide text-white uppercase">
                    The Forked Standard
                  </span>
                </div>
                <span className="font-mono text-xs text-[#E13B22] font-bold">
                  Dish is Main Character
                </span>
              </div>

              {/* Real Forked Dish Card */}
              <div className="bg-[#18181A] rounded-2xl p-4 border border-[#E13B22]/30 mb-5 shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-display font-black text-xl text-white">
                      Pizza
                    </h4>
                    <div className="text-[11px] font-mono font-bold text-[#E13B22] uppercase tracking-wider mt-0.5">
                      Variant: Margherita
                    </div>
                    <p className="text-xs text-[#A3A3A3] mt-1">
                      Served at: Salvatore’s Corner Tavern • Mid-City
                    </p>
                  </div>

                  {/* Big bold rank badge */}
                  <div className="bg-[#121212] px-3.5 py-1.5 rounded-xl border border-[#E13B22] text-center">
                    <div className="font-display font-black text-2xl text-[#E13B22]">
                      #2
                    </div>
                    <div className="text-[9px] font-mono uppercase text-[#A3A3A3]">
                      In City
                    </div>
                  </div>
                </div>

                {/* Scoreboard line */}
                <div className="bg-[#121212] p-3 rounded-xl border border-[#2E2E32] text-xs">
                  <div className="flex items-center justify-between text-[#A3A3A3] font-mono text-[11px] mb-1">
                    <span>Win Rate: <strong className="text-white">87%</strong></span>
                    <span>Battles: <strong className="text-white">984</strong></span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#E13B22] h-full w-[87%]" />
                  </div>
                </div>

                {/* The Unfussy Manifesto Quote */}
                <div className="mt-3 p-2.5 rounded-lg bg-[#E13B22]/15 border border-[#E13B22]/40 text-xs text-white font-medium italic">
                  &quot;The parking’s bad and the salad’s boring. The margherita is #2 in the city. Order accordingly.&quot;
                </div>
              </div>

              {/* The Forked Guarantees */}
              <ul className="space-y-2 text-xs sm:text-sm text-[#E5E5E5]">
                <li className="flex items-start gap-2">
                  <span className="text-[#E13B22] font-bold">✓</span>
                  <span><strong>Crust &amp; flavor only:</strong> zero parking lot deductions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E13B22] font-bold">✓</span>
                  <span><strong>100% paid meals:</strong> no comped influencer hype.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E13B22] font-bold">✓</span>
                  <span><strong>Exact recommendations:</strong> order this dish, skip that one.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E13B22]/20 text-xs font-mono text-[#E5E5E5]">
              Result: You eat the #2 pizza in town without guessing.
            </div>
          </div>

        </div>

        {/* Bottom Banner callout */}
        <div className="rounded-2xl bg-[#1C1C1E] border border-[#2E2E32] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E13B22] text-white flex items-center justify-center shrink-0 font-display font-black text-xl">
              ≠
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Food isn’t an average. Taste is a head-to-head battle.
              </h3>
              <p className="text-xs sm:text-sm text-[#A3A3A3]">
                When someone asks for the best burger, you don’t give a decimal. You give a name.
              </p>
            </div>
          </div>

          <a
            href="#leaderboards"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-white text-[#121212] hover:bg-[#E13B22] hover:text-white transition-all shrink-0"
          >
            <span>Explore Dish Leaderboards</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
