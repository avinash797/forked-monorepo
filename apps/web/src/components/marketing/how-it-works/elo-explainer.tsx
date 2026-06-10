"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, Swords, TrendingUp } from "lucide-react";

const concepts = [
  {
    icon: BarChart3,
    title: "Every dish starts equal",
    description:
      "New dishes enter on a level playing field. Nobody gets a head start. The battles determine everything.",
  },
  {
    icon: Swords,
    title: "Battles shift the rankings",
    description:
      "When you pick a winner, our algorithm updates both dishes' rankings. Upsets carry more weight — beating the #1 dish moves the needle more.",
  },
  {
    icon: TrendingUp,
    title: "Rankings stabilize over time",
    description:
      "More battles, more confidence. A dish with 500 battles has a precise, reliable rank. One with 10 is still proving itself. The real list earns its place.",
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
          Why No Star Ratings
        </h2>
        <p className="text-text-secondary mt-4 max-w-lg mx-auto text-sm">
          Forked never asks you for a number. It asks you one simpler
          question: which one wins? Your answer does the math.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {concepts.map((concept, i) => (
          <motion.div
            key={concept.title}
            className="text-center space-y-4"
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <concept.icon size={28} className="text-accent" />
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-text-primary">
              {concept.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
              {concept.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.blockquote
        className="border-l-2 border-accent/40 pl-6 py-2 text-text-secondary italic text-sm max-w-xl mx-auto"
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        &ldquo;You don&apos;t decide what&apos;s good. The battles do. One head-to-head
        at a time, the real list reveals itself.&rdquo;
      </motion.blockquote>
    </section>
  );
}
