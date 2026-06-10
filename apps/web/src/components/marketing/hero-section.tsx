"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { track } from "@vercel/analytics";
import { Smartphone } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

const STATS = [
  { value: "12,000+", label: "Dishes Ranked" },
  { value: "3", label: "Cities Fighting" },
  { value: "48K+", label: "Battles Decided" },
];

export function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 bg-bg">
      {/* Noise/grain texture overlay for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
        }}
      />

      {/* Background glow blobs */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-20 -left-40 w-[900px] h-[900px] bg-accent/5 rounded-full blur-[200px] pointer-events-none"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -bottom-20 -right-40 w-[700px] h-[700px] bg-accent/10 rounded-full blur-[160px] pointer-events-none"
      />

      <motion.div
        style={{ scale, opacity }}
        className="relative z-10 text-center max-w-4xl w-full"
      >
        {/* Animated availability badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 bg-surface border border-border rounded-full px-4 py-2 mb-8 text-[10px] uppercase font-bold tracking-[0.2em] shadow-sm"
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
          </span>
          {IS_WAITLIST_MODE ? "Coming Soon" : "Available Now on iOS & Android"}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="font-display italic font-black text-[clamp(3rem,11vw,8rem)] leading-[0.88] mb-6 tracking-tighter"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Ditch the <br />
          <span className="text-accent">Vibe.</span> <br />
          Rate the{" "}
          <span className="underline decoration-border underline-offset-4 decoration-2">
            Dish.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          Not &ldquo;go to this restaurant.&rdquo; Get the gumbo at Dooky
          Chase. Dish-level rankings from real head-to-head battles, verified
          by photos. Under 30 seconds to vote.
        </motion.p>

        {/* CTAs or Waitlist Form */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          {IS_WAITLIST_MODE ? (
            <WaitlistForm source="hero" />
          ) : (
            <>
              <a
                href="#download"
                onClick={() => track("hero_download_cta_click")}
                className="w-full sm:w-auto bg-accent text-accent-on px-8 py-4 rounded-xl font-black text-sm tracking-widest flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/25 cursor-pointer"
              >
                <Smartphone size={18} />
                GET THE FREE APP
              </a>
              <Link
                href="/leaderboard"
                onClick={() => track("hero_leaderboards_click")}
                className="w-full sm:w-auto bg-surface border border-border text-text-primary px-8 py-4 rounded-xl font-black text-sm tracking-widest hover:bg-surface-2 hover:border-text-tertiary transition-all text-center"
              >
                SEE WHO&apos;S WINNING
              </Link>
            </>
          )}
        </motion.div>

        {/* Community stats strip */}
        <motion.div
          className="flex items-center justify-center gap-8 md:gap-14 pt-8 border-t border-border/60"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl md:text-3xl font-black font-display italic text-text-primary tabular-nums">
                {stat.value}
              </p>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-tertiary mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Floating food images (parallax) */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-20 md:left-20 top-1/4 z-0 opacity-50 md:opacity-100"
      >
        <Image
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
          alt="Burger dish"
          width={192}
          height={192}
          priority
          className="w-32 md:w-48 rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl -rotate-12 ring-1 ring-border"
          sizes="(max-width: 768px) 128px, 192px"
        />
      </motion.div>
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-20 md:right-40 bottom-1/4 z-0 opacity-50 md:opacity-100"
      >
        <Image
          src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=400"
          alt="Sandwich dish"
          width={256}
          height={256}
          priority
          className="w-40 md:w-64 rounded-2xl shadow-2xl rotate-[8deg] ring-1 ring-border"
          sizes="(max-width: 768px) 160px, 256px"
        />
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-tertiary flex flex-col items-center gap-2"
      >
        <span className="text-[9px] font-bold tracking-[0.3em] uppercase">
          Settle the argument
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-text-tertiary to-transparent" />
      </motion.div>
    </section>
  );
}
