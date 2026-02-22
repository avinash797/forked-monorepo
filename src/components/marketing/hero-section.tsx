"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { track } from "@vercel/analytics";
import { Smartphone, Flame, Zap } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

export function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6 bg-bg">
      {/* Background Glow */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-20 -left-20 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-20 -right-20 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]"
      />

      <motion.div
        style={{ scale, opacity }}
        className="relative z-10 text-center max-w-4xl"
      >
        {/* Glass Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-1.5 mb-8 text-[10px] uppercase font-bold tracking-[0.2em]"
        >
          {IS_WAITLIST_MODE ? (
            <>
              <Zap size={12} className="text-accent" />
              Coming Soon
            </>
          ) : (
            <>
              <Flame size={12} className="text-accent" />
              Available Now on iOS &amp; Android
            </>
          )}
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-display italic font-black text-6xl md:text-8xl lg:text-9xl leading-[0.9] mb-6 tracking-tighter"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Ditch the <br />
          <span className="text-accent drop-shadow-[0_0_20px_rgba(var(--color-accent),0.3)]">
            Vibe.
          </span>{" "}
          <br />
          Rate the <span className="underline decoration-border">Dish.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          Stop settling for 4.8-star restaurants with average food. Forked uses
          head-to-head battles to find the exact best burger, pasta, and taco in
          your city—verified by real photos, not fake reviews.
        </motion.p>

        {/* CTAs or Waitlist Form */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
                className="w-full sm:w-auto bg-accent text-accent-on px-8 py-4 rounded-xl font-black text-sm tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/40"
              >
                <Smartphone size={20} />
                GET THE FREE APP
              </a>
              <Link
                href="/leaderboard"
                onClick={() => track("hero_leaderboards_click")}
                className="w-full sm:w-auto bg-surface-2 backdrop-blur-sm border border-border text-text-primary px-8 py-4 rounded-xl font-black text-sm tracking-widest hover:bg-surface transition-all text-center"
              >
                EXPLORE LEADERBOARDS
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Floating Food Images (Parallax) */}
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
          className="w-32 md:w-48 rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl -rotate-12"
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
          className="w-40 md:w-64 rounded-2xl shadow-2xl rotate-[8deg]"
          sizes="(max-width: 768px) 160px, 256px"
        />
      </motion.div>

      {/* Scroll Hint */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-tertiary flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Scroll to uncover
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-text-tertiary to-transparent" />
      </motion.div>
    </section>
  );
}
