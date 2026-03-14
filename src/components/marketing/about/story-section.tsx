"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Swords } from "lucide-react";

function BattleMockup() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <p className="text-[10px] font-black tracking-[0.3em] text-text-tertiary uppercase">
        THIS VS THAT
      </p>
      <div className="flex gap-4">
        <div className="flex-1 bg-surface-2 rounded-xl p-4 text-center border border-border">
          <div className="w-full h-20 rounded-lg bg-accent/10 mb-3" />
          <p className="text-xs font-bold text-text-primary">Gumbo</p>
          <p className="text-[10px] text-text-tertiary">Dooky Chase&apos;s</p>
          <p className="text-sm font-black text-gold mt-1">1842</p>
        </div>
        <div className="flex items-center">
          <Swords size={20} className="text-text-tertiary" />
        </div>
        <div className="flex-1 bg-surface-2 rounded-xl p-4 text-center border border-border">
          <div className="w-full h-20 rounded-lg bg-border mb-3" />
          <p className="text-xs font-bold text-text-primary">Gumbo</p>
          <p className="text-[10px] text-text-tertiary">Coop&apos;s Place</p>
          <p className="text-sm font-black text-text-secondary mt-1">1756</p>
        </div>
      </div>
      <p className="text-[10px] text-text-tertiary text-center uppercase tracking-widest">
        You already have an opinion. Pick one.
      </p>
    </div>
  );
}

export function StorySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref}>
      <motion.div
        className="text-center mb-16"
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
          HOW IT STARTED
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-text-primary">
          Born in New Orleans
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          className="space-y-5 text-sm text-text-secondary leading-relaxed"
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p>
            Forked started with a simple argument: where&apos;s the best gumbo
            in New Orleans? Not the best restaurant — the best{" "}
            <span className="text-text-primary font-bold">gumbo</span>.
          </p>
          <p>
            We asked locals, chefs, food critics, and tourists. Everyone had an
            opinion. Nobody had a platform. The argument had been going on for
            decades with no way to settle it.
          </p>
          <p>
            Restaurant ratings are broken. A 4.5-star restaurant might have
            mediocre gumbo but great service. A hole-in-the-wall with 3.8 stars
            might serve the best bowl in the city. The signal is buried under
            valet parking reviews and ambiance complaints.
          </p>
          <p>
            So we built something different. Every rating is about a specific
            dish. Every ranking comes from head-to-head battles — no star
            scales, no editorial picks, no paid placements.{" "}
            <span className="text-text-primary font-bold">
              The only way to climb is to serve better food.
            </span>
          </p>
          <p>
            We launched in New Orleans because no city takes its food more
            seriously. People here argue about gumbo the way other cities argue
            about sports teams. If our system can settle that argument, it can
            settle any argument, anywhere.
          </p>
        </motion.div>

        <motion.div
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <BattleMockup />
        </motion.div>
      </div>
    </section>
  );
}
