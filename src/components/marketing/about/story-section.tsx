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
        Tap to pick the winner
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
          OUR STORY
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-text-primary">
          Born in New Orleans
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          className="space-y-6 text-sm text-text-secondary leading-relaxed"
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p>
            Forked started with a simple argument: where&apos;s the best gumbo
            in New Orleans? Not the best restaurant — the best{" "}
            <span className="text-text-primary font-bold">gumbo</span>. We
            realized that no platform answered this question well.
          </p>
          <p>
            Restaurant ratings are broken. A 4.5-star restaurant might have
            mediocre gumbo but great service. A hole-in-the-wall with 3.8 stars
            might serve the best bowl in the city. The signal is buried in the
            noise.
          </p>
          <p>
            So we built Forked — a platform where every rating is about a
            specific dish, every ranking is powered by head-to-head battles, and
            the algorithm does the rest. No opinions. No editorial picks. Just
            data.
          </p>
          <p>
            We launched in New Orleans because no city takes its food more
            seriously. If our system can rank gumbo, po&apos;boys, and crawfish
            &eacute;touff&eacute;e to the satisfaction of locals, it can rank
            anything, anywhere.
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
