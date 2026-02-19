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
    <section id="elo" className="py-16 md:py-32 px-6 relative overflow-hidden bg-black snap-start snap-always">
      <div className="max-w-4xl mx-auto text-center mb-10 md:mb-20">
        <h2 className="font-display italic font-black text-3xl md:text-7xl mb-4 md:mb-6 tracking-tighter">
          The Battle For{" "}
          <span className="text-[#FF4D00]">The Best.</span>
        </h2>
        <p className="text-white/50 text-lg font-light max-w-2xl mx-auto">
          Forget 5-point averages. Forked uses an ELO competitive rating system.
          Every rating is a clash. Every score is earned. This is the leaderboard
          for the real world.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3 md:gap-4 relative items-center">
        {/* Battle Line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-0" />
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black border border-white/20 items-center justify-center z-10">
          <span className="text-[#FF4D00] font-black italic text-xs">VS</span>
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
              ? "border-[#FF4D00] scale-[1.02] shadow-[0_0_40px_rgba(255,77,0,0.2)]"
              : "border-white/5 opacity-80 hover:opacity-100"
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
            <h3 className="text-lg md:text-3xl font-black italic mb-1 uppercase tracking-tight">
              Smash Burger
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/40 font-bold text-xs uppercase tracking-widest">
                Tony&apos;s Diner
              </p>
              <div className="text-right">
                <span className="text-[10px] text-white/40 uppercase font-black block">
                  ELO SCORE
                </span>
                <span className="text-lg md:text-2xl font-mono font-bold text-[#FF4D00]">
                  {scores.left}
                </span>
              </div>
            </div>
          </div>
          {voted === "left" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-6 left-6 bg-[#FF4D00] text-white p-2 rounded-full shadow-lg"
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
              ? "border-[#FF4D00] scale-[1.02] shadow-[0_0_40px_rgba(255,77,0,0.2)]"
              : "border-white/5 opacity-80 hover:opacity-100"
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
            <h3 className="text-lg md:text-3xl font-black italic mb-1 uppercase tracking-tight">
              Truffle Brioche
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/40 font-bold text-xs uppercase tracking-widest">
                L&apos;Avenue Grill
              </p>
              <div className="text-right">
                <span className="text-[10px] text-white/40 uppercase font-black block">
                  ELO SCORE
                </span>
                <span className="text-lg md:text-2xl font-mono font-bold text-[#FF4D00]">
                  {scores.right}
                </span>
              </div>
            </div>
          </div>
          {voted === "right" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-6 right-6 bg-[#FF4D00] text-white p-2 rounded-full shadow-lg"
            >
              <Trophy size={20} />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="mt-8 md:mt-12 text-center">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/50">
          Tap to decide who wins this round
        </p>
        <button
          onClick={resetBattle}
          className="mt-6 text-[10px] font-black tracking-widest text-[#FF4D00] hover:text-white transition-colors cursor-pointer"
        >
          RESET BATTLE
        </button>
      </div>
    </section>
  );
}
