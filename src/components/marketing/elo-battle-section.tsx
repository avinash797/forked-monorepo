"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { track } from "@vercel/analytics";

export function EloBattleSection() {
  const [scores, setScores] = useState({ left: 1450, right: 1442 });
  const [voted, setVoted] = useState<null | "left" | "right">(null);

  const handleVote = (side: "left" | "right") => {
    if (voted) return;
    track("elo_battle_vote", {
      side,
      dish: side === "left" ? "Smash Burger" : "Truffle Brioche",
    });
    setVoted(side);
    setTimeout(() => {
      setScores((prev) => ({
        left: side === "left" ? prev.left + 15 : prev.left - 12,
        right: side === "right" ? prev.right + 15 : prev.right - 12,
      }));
    }, 400);
  };

  const resetBattle = () => {
    track("elo_battle_reset");
    setVoted(null);
    setScores({ left: 1450, right: 1442 });
  };

  return (
    <section
      id="elo"
      className="py-16 md:py-32 px-6 relative overflow-hidden bg-bg snap-start snap-always"
    >
      <div className="max-w-4xl mx-auto text-center mb-10 md:mb-20">
        <h2 className="font-display italic font-black text-3xl md:text-5xl lg:text-7xl mb-4 md:mb-6 tracking-tighter">
          Forget 5 Stars. <br className="hidden md:block" /> Welcome to the{" "}
          <span className="text-accent">Arena.</span>
        </h2>
        <p className="text-text-secondary text-lg font-light max-w-2xl mx-auto">
          Five-star rating systems are rigged. Forked uses a competitive Elo
          rating system—just like chess or competitive gaming. Every rating is a
          head-to-head battle. If a challenger beats the champion, it steals its
          points. The cream rises to the top.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3 md:gap-4 relative items-center">
        {/* Battle Line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border z-0" />
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-bg border border-border items-center justify-center z-10">
          <span className="text-accent font-black italic text-xs">VS</span>
        </div>

        {/* Left Dish */}
        <motion.div
          role="button"
          tabIndex={voted ? -1 : 0}
          aria-label="Vote for Smash Burger from Tony's Diner"
          aria-pressed={voted === "left"}
          aria-disabled={!!voted}
          className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
            voted === "left"
              ? "border-accent scale-[1.02] shadow-[0_0_40px_rgba(238,108,43,0.2)]"
              : "border-border opacity-80 hover:opacity-100"
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
            src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800"
            alt="Smash Burger"
            width={800}
            height={1000}
            className="w-full aspect-[3/4] md:aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            sizes="(max-width: 768px) 50vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            <h3 className="text-lg md:text-3xl font-black italic mb-1 uppercase tracking-tight text-white">
              Smash Burger
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/60 font-bold text-xs uppercase tracking-widest">
                Tony&apos;s Diner
              </p>
              <div className="text-right">
                <span className="text-[10px] text-white/60 uppercase font-black block">
                  ELO SCORE
                </span>
                <span className="text-lg md:text-2xl font-mono font-bold text-accent">
                  {scores.left}
                </span>
              </div>
            </div>
          </div>
          {voted === "left" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
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
          aria-label="Vote for Truffle Brioche from L'Avenue Grill"
          aria-pressed={voted === "right"}
          aria-disabled={!!voted}
          className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
            voted === "right"
              ? "border-accent scale-[1.02] shadow-[0_0_40px_rgba(238,108,43,0.2)]"
              : "border-border opacity-80 hover:opacity-100"
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
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800"
            alt="Truffle Brioche"
            width={800}
            height={1000}
            className="w-full aspect-[3/4] md:aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            sizes="(max-width: 768px) 50vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            <h3 className="text-lg md:text-3xl font-black italic mb-1 uppercase tracking-tight text-white">
              Truffle Brioche
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/60 font-bold text-xs uppercase tracking-widest">
                L&apos;Avenue Grill
              </p>
              <div className="text-right">
                <span className="text-[10px] text-white/60 uppercase font-black block">
                  ELO SCORE
                </span>
                <span className="text-lg md:text-2xl font-mono font-bold text-accent">
                  {scores.right}
                </span>
              </div>
            </div>
          </div>
          {voted === "right" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-6 right-6 bg-accent text-accent-on p-2 rounded-full shadow-lg"
            >
              <Trophy size={20} />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="mt-8 md:mt-12 text-center">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-text-secondary">
          Tap to decide who wins this round
        </p>
        <button
          onClick={resetBattle}
          className="mt-6 text-[10px] font-black tracking-widest text-accent hover:text-text-primary transition-colors cursor-pointer"
        >
          RESET BATTLE
        </button>
      </div>
    </section>
  );
}
