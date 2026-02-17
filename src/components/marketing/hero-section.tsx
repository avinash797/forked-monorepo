"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Smartphone, Flame } from "lucide-react";

export function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6 bg-[#050505]">
      {/* Background Glow */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-20 -left-20 w-[600px] h-[600px] bg-[#FF4D00]/5 rounded-full blur-[120px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-20 -right-20 w-[400px] h-[400px] bg-[#FF4D00]/10 rounded-full blur-[100px]"
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
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 text-[10px] uppercase font-bold tracking-[0.2em]"
        >
          <Flame size={12} className="text-[#FF4D00]" />
          Available Now on iOS &amp; Android
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-display italic font-black text-6xl md:text-8xl lg:text-9xl leading-[0.9] mb-6 tracking-tighter"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Ditch the <br />
          <span className="text-[#FF4D00] drop-shadow-[0_0_20px_rgba(255,77,0,0.3)]">
            Vibe.
          </span>{" "}
          <br />
          Rate the{" "}
          <span className="underline decoration-white/20">Dish.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          Forked is the real-time ranking engine for food obsessives. We strip
          away the fancy curtains to find the city&apos;s absolute champions. No
          averages. No fake reviews. Just data-driven dominance.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <a
            href="#download"
            className="w-full sm:w-auto bg-[#FF4D00] text-white px-8 py-4 rounded-xl font-black text-sm tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,77,0,0.4)]"
          >
            <Smartphone size={20} />
            DOWNLOAD APP
          </a>
          <Link
            href="/leaderboard"
            className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-xl font-black text-sm tracking-widest hover:bg-white/10 transition-all text-center"
          >
            SEE LEADERBOARDS
          </Link>
        </motion.div>
      </motion.div>

      {/* Floating Food Images (Parallax) */}
      <motion.div style={{ y: y1 }} className="absolute -left-20 md:left-20 top-1/4 z-0 opacity-50 md:opacity-100">
        <Image
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
          alt="Burger dish"
          width={192}
          height={192}
          className="w-32 md:w-48 rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl -rotate-12"
          sizes="(max-width: 768px) 128px, 192px"
        />
      </motion.div>
      <motion.div style={{ y: y2 }} className="absolute -right-20 md:right-40 bottom-1/4 z-0 opacity-50 md:opacity-100">
        <Image
          src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=400"
          alt="Sandwich dish"
          width={256}
          height={256}
          className="w-40 md:w-64 rounded-2xl shadow-2xl rotate-[8deg]"
          sizes="(max-width: 768px) 160px, 256px"
        />
      </motion.div>

      {/* Scroll Hint */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Scroll to uncover
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  );
}
