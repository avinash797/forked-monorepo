"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, Swords, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: BarChart3,
    title: "Every dish starts at 1500",
    description:
      "New dishes enter the system with a baseline Elo score of 1500. This is the same starting point used in competitive chess.",
  },
  {
    icon: Swords,
    title: "Battles shift the scores",
    description:
      "When you pick a winner, the winning dish gains points and the losing dish drops. Upsets cause bigger swings.",
  },
  {
    icon: TrendingUp,
    title: "Rankings stabilize over time",
    description:
      "More battles = more confidence. Dishes with hundreds of battles have precise, reliable scores. The cream rises to the top.",
  },
];

export function EloExplainer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref} className="space-y-12">
      <motion.div
        className="text-center"
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
          THE ENGINE
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-text-primary">
          Powered by Elo
        </h2>
        <p className="text-text-secondary mt-4 max-w-lg mx-auto text-sm">
          The same rating system used to rank chess grandmasters, now ranking
          the best dishes in your city.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            className="text-center space-y-4"
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <step.icon size={28} className="text-accent" />
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-text-primary">
              {step.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.blockquote
        className="border-l-2 border-accent/40 pl-6 py-2 text-text-secondary italic text-sm max-w-xl mx-auto"
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        &ldquo;In chess, Elo separates grandmasters from amateurs. In Forked, it
        separates transcendent gumbo from tourist traps.&rdquo;
      </motion.blockquote>
    </section>
  );
}
