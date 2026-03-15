"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { track } from "@vercel/analytics";

export function EloBattleSection() {
  const [voted, setVoted] = useState<null | "left" | "right">(null);
  const [deltas, setDeltas] = useState<{ left: number; right: number } | null>(
    null
  );

  const handleVote = (side: "left" | "right") => {
    if (voted) return;
    track("battle_vote", {
      side,
      dish: side === "left" ? "Domelise's Shrimp Po-Boy" : "Parkway Shrimp Po-Boy",
    });
    setVoted(side);
    setTimeout(() => {
      const leftDelta = side === "left" ? 1 : -1;
      const rightDelta = side === "right" ? 1 : -1;
      setDeltas({ left: leftDelta, right: rightDelta });
    }, 400);
  };

  const resetBattle = () => {
    track("battle_reset");
    setVoted(null);
    setDeltas(null);
  };

  return (
    <section
      id="battles"
      className="py-16 md:py-32 px-6 relative overflow-hidden bg-bg snap-start snap-always"
    >
      <div className="max-w-4xl mx-auto text-center mb-10 md:mb-20">
        <h2 className="font-display italic font-black text-3xl md:text-5xl lg:text-7xl mb-4 md:mb-6 tracking-tighter">
          You Have An Opinion.{" "}
          <br className="hidden md:block" />
          <span className="text-accent">Prove It.</span>
        </h2>
        <p className="text-text-secondary text-lg font-light max-w-2xl mx-auto">
          Five-star systems let anyone tank a restaurant because the parking was
          bad. Forked skips the scale entirely — you pick which dish wins,
          head-to-head. Every time someone votes, points transfer from the loser
          to the winner. The best dish earns its rank by beating everything else.
          Not by collecting the most clicks.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3 md:gap-4 relative items-center">
        {/* Battle divider line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border z-0" />

        {/* VS badge — more prominent with glow ring */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-bg border-2 border-border flex items-center justify-center shadow-lg">
            <span className="text-accent font-black italic text-sm leading-none">
              VS
            </span>
          </div>
          {!voted && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[8px] font-black tracking-widest uppercase text-text-tertiary text-center mt-1 whitespace-nowrap"
            >
              Tap to pick
            </motion.p>
          )}
        </div>

        {/* Left Dish */}
        <motion.div
          role="button"
          tabIndex={voted ? -1 : 0}
          aria-label="Vote for Shrimp Po-Boy from Domelise's"
          aria-pressed={voted === "left"}
          aria-disabled={!!voted}
          className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-500 ${voted === "left"
              ? "border-accent scale-[1.02] shadow-[0_0_40px_rgba(238,108,43,0.2)]"
              : voted === "right"
                ? "border-border opacity-40"
                : "border-border opacity-80 hover:opacity-100 hover:border-border"
            }`}
          onClick={() => handleVote("left")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleVote("left");
            }
          }}
          whileTap={!voted ? { scale: 0.98 } : undefined}
        >
          <Image
            src="/images/poboy/domelises-poboy.png"
            alt="Shrimp Po-Boy"
            width={800}
            height={1000}
            className="w-full aspect-[3/4] md:aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            sizes="(max-width: 768px) 50vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            <h3 className="text-lg md:text-3xl font-black italic mb-1 uppercase tracking-tight text-white">
              Shrimp Po-Boy
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/60 font-bold text-xs uppercase tracking-widest">
                Domilise&apos;s Po-Boy & Bar
              </p>
              <AnimatePresence>
                {deltas && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-1 text-xs font-black ${deltas.left > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {deltas.left > 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {voted === "left" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute top-6 left-6 bg-accent text-accent-on p-2 rounded-full shadow-lg"
            >
              <Trophy size={20} />
            </motion.div>
          )}
        </motion.div>

        {/* Right Dish */}
        <motion.div
          role="button"
          tabIndex={voted ? -1 : 0}
          aria-label="Vote for Shrimp Po-Boy from Parkway Bakery"
          aria-pressed={voted === "right"}
          aria-disabled={!!voted}
          className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-500 ${voted === "right"
              ? "border-accent scale-[1.02] shadow-[0_0_40px_rgba(238,108,43,0.2)]"
              : voted === "left"
                ? "border-border opacity-40"
                : "border-border opacity-80 hover:opacity-100 hover:border-border"
            }`}
          onClick={() => handleVote("right")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleVote("right");
            }
          }}
          whileTap={!voted ? { scale: 0.98 } : undefined}
        >
          <Image
            src="/images/poboy/parkway-poboy.jpeg"
            alt="Shrimp Po-Boy"
            width={800}
            height={1000}
            className="w-full aspect-[3/4] md:aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            sizes="(max-width: 768px) 50vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            <h3 className="text-lg md:text-3xl font-black italic mb-1 uppercase tracking-tight text-white">
              Shrimp Po-Boy
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/60 font-bold text-xs uppercase tracking-widest">
                Parkway Bakery & Tavern
              </p>
              <AnimatePresence>
                {deltas && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-1 text-xs font-black ${deltas.right > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {deltas.right > 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {voted === "right" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute top-6 right-6 bg-accent text-accent-on p-2 rounded-full shadow-lg"
            >
              <Trophy size={20} />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="mt-8 md:mt-12 text-center">
        <AnimatePresence mode="wait">
          {!voted ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-bold tracking-[0.3em] uppercase text-text-secondary"
            >
              You already have an opinion. Pick one.
            </motion.p>
          ) : (
            <motion.p
              key="voted"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-bold tracking-[0.3em] uppercase text-text-secondary"
            >
              That&apos;s your vote. It counts.
            </motion.p>
          )}
        </AnimatePresence>
        <button
          onClick={resetBattle}
          className="mt-6 text-[10px] font-black tracking-widest text-accent hover:text-text-primary transition-colors cursor-pointer"
        >
          FIGHT AGAIN
        </button>
      </div>
    </section>
  );
}
