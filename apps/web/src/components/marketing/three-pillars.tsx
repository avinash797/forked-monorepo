"use client";

import { useState } from "react";
import { Layers, Check } from "lucide-react";

export function ThreePillars() {
  const [activeVariantTab, setActiveVariantTab] = useState<'roastbeef' | 'shrimp' | 'oyster'>('roastbeef');

  const variantExamples = {
    roastbeef: {
      dish: "Po'boy",
      variant: 'Roast Beef Debris',
      winner: 'Parkway Bakery & Tavern',
      neighborhood: 'Mid-City, NOLA',
      insight: 'Dark slow-simmered roast beef gravy soaked into crisp Leidenheimer crust.',
    },
    shrimp: {
      dish: "Po'boy",
      variant: 'Crispy Fried Gulf Shrimp',
      winner: "Domilise's Po-Boy & Bar",
      neighborhood: 'Uptown, NOLA',
      insight: 'Crisp cornmeal-dusted Gulf shrimp piled high, dressed with pickles & hot sauce.',
    },
    oyster: {
      dish: "Po'boy",
      variant: 'Cornmeal Fried Oyster',
      winner: "Mahony's Po-Boys",
      neighborhood: 'Magazine St, NOLA',
      insight: 'Flash-fried plump oysters matched like-for-like against other fried oyster rolls.',
    },
  };

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-bg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-text-primary text-bg text-xs font-mono font-medium uppercase tracking-widest mb-4">
            <Layers className="w-3.5 h-3.5 text-accent" />
            Core Philosophy
          </div>

          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-text-primary tracking-tight leading-tight mb-3">
            How Forked ends the debate.
          </h2>
          <p className="text-base sm:text-lg text-text-secondary">
            Three direct rules that replace review noise with real taste.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Pillar 1 */}
          <div className="rounded-3xl bg-surface border border-border p-7 sm:p-8 flex flex-col justify-between shadow-xs hover:border-text-primary transition-colors relative">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-text-primary text-bg flex items-center justify-center font-display font-black text-xl mb-6">
                01
              </div>

              <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-1">
                Pillar 1
              </div>
              <h3 className="font-display font-black text-2xl text-text-primary mb-2">
                The dish is the main character.
              </h3>

              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                Never &quot;go to XYZ.&quot; Always <strong>&quot;order the roast beef po&apos;boy at XYZ.&quot;</strong> Exact like-for-like variant rankings—no apples to oranges.
              </p>

              {/* Interactive Variant Preview */}
              <div className="bg-surface-2 rounded-2xl p-4 border border-border mb-6">
                <div className="text-[10px] font-mono uppercase text-text-tertiary mb-2">
                  Like-for-like variant precision:
                </div>
                <div className="flex gap-1 mb-3">
                  {(['roastbeef', 'shrimp', 'oyster'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setActiveVariantTab(v)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        activeVariantTab === v
                          ? 'bg-text-primary text-bg'
                          : 'bg-surface text-text-tertiary border border-border'
                      }`}
                    >
                      {v === 'roastbeef' ? 'Roast Beef' : v === 'shrimp' ? 'Fried Shrimp' : 'Oyster'}
                    </button>
                  ))}
                </div>
                <div className="bg-surface p-3 rounded-xl border border-border">
                  <div className="text-sm font-display font-black text-text-primary">
                    {variantExamples[activeVariantTab].dish}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider mt-0.5">
                    Variant: {variantExamples[activeVariantTab].variant}
                  </div>
                  <div className="text-xs text-text-primary font-semibold mt-1">
                    #1: {variantExamples[activeVariantTab].winner} ({variantExamples[activeVariantTab].neighborhood})
                  </div>
                  <div className="text-[10px] text-text-tertiary mt-1 leading-snug">
                    {variantExamples[activeVariantTab].insight}
                  </div>
                </div>
              </div>
            </div>

            <ul className="space-y-2 pt-4 border-t border-border text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>Strict like-for-like variant comparisons</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>Zero decor, parking, or cocktail bias</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-3xl bg-surface border border-border p-7 sm:p-8 flex flex-col justify-between shadow-xs hover:border-text-primary transition-colors relative">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accent text-accent-on flex items-center justify-center font-display font-black text-xl mb-6">
                02
              </div>

              <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-1">
                Pillar 2
              </div>
              <h3 className="font-display font-black text-2xl text-text-primary mb-2">
                Battles, not stars.
              </h3>

              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                No fake decimal ratings. One quick 3-way verdict (Bad, Okay, Great), then pick the winner in 2 head-to-head battles. Done in under 10 seconds.
              </p>

              {/* Visual Flow demonstration */}
              <div className="bg-surface-2 rounded-2xl p-4 border border-border mb-6 space-y-2">
                <div className="text-[10px] font-mono uppercase text-text-tertiary">
                  The 10-Second Flow:
                </div>
                <div className="flex items-center gap-2 bg-surface p-2.5 rounded-xl border border-border">
                  <span className="w-5 h-5 rounded-full bg-text-primary text-bg text-[10px] font-bold flex items-center justify-center">1</span>
                  <span className="text-xs text-text-primary font-semibold">Verdict:</span>
                  <div className="flex gap-1 ml-auto">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-text-tertiary font-mono">Bad</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-text-tertiary font-mono">Okay</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-accent-on font-mono font-bold">Great</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-surface p-2.5 rounded-xl border border-border">
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-on text-[10px] font-bold flex items-center justify-center">2</span>
                  <div className="min-w-0">
                    <div className="text-xs text-text-primary font-black">Po&apos;boy Battle</div>
                    <div className="text-[10px] text-accent font-mono font-bold">Variant: Roast Beef Debris</div>
                  </div>
                  <span className="text-[11px] text-text-tertiary font-mono ml-auto">Parkway beats Parasol&apos;s</span>
                </div>

                <div className="flex items-center gap-2 bg-text-primary text-bg p-2.5 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-success text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span className="text-xs font-semibold">Output:</span>
                  <span className="text-[11px] font-mono text-success ml-auto">Strict Personal Top 5</span>
                </div>
              </div>
            </div>

            <ul className="space-y-2 pt-4 border-t border-border text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>Normalized math (no ties, no fake 4.3s)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>Takes under 10 seconds per meal</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-3xl bg-surface border border-border p-7 sm:p-8 flex flex-col justify-between shadow-xs hover:border-text-primary transition-colors relative">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-text-primary text-bg flex items-center justify-center font-display font-black text-xl mb-6">
                03
              </div>

              <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent mb-1">
                Pillar 3
              </div>
              <h3 className="font-display font-black text-2xl text-text-primary mb-2">
                The city decides.
              </h3>

              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                One public leaderboard per dish per city. Not a private diary. The link you send in group chats to end the debate.
              </p>

              {/* Visual Leaderboard callout */}
              <div className="bg-surface-2 rounded-2xl p-4 border border-border mb-6">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-text-tertiary mb-2">
                  <span>Public City Scoreboard</span>
                  <span className="text-accent font-bold">New Orleans</span>
                </div>

                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-surface border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-black text-accent">#1</span>
                        <div>
                          <div className="font-bold text-text-primary leading-tight">Po&apos;boy • Parkway Tavern</div>
                          <div className="text-[10px] text-accent font-mono font-bold">Variant: Roast Beef Debris</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-text-tertiary ml-2 shrink-0">88% win</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-black text-text-primary">#2</span>
                        <div>
                          <div className="font-bold text-text-primary leading-tight">Po&apos;boy • Parasol&apos;s Bar</div>
                          <div className="text-[10px] text-accent font-mono font-bold">Variant: Garlic Gravy</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-text-tertiary ml-2 shrink-0">83% win</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-black text-text-primary">#3</span>
                        <div>
                          <div className="font-bold text-text-primary leading-tight">Po&apos;boy • Domilise&apos;s</div>
                          <div className="text-[10px] text-accent font-mono font-bold">Variant: Fried Shrimp & Gravy</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-text-tertiary ml-2 shrink-0">79% win</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ul className="space-y-2 pt-4 border-t border-border text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>Hole-in-the-walls rise on merit, not marketing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span>Shareable cards for subreddits and group chats</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
