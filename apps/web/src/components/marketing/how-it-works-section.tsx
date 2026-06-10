"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Utensils, Camera, Swords, Crown } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    icon: Utensils,
    title: "Eat",
    description:
      "Order the dish. The specific dish — not just 'dinner at this restaurant.' That's the whole point.",
  },
  {
    number: "02",
    icon: Camera,
    title: "Snap",
    description:
      "Take a photo before you eat. No photo, no rating. Anyone can leave a number — not everyone can prove they showed up.",
  },
  {
    number: "03",
    icon: Swords,
    title: "Battle",
    description:
      "We show you two dishes. You pick the winner. No scales, no sliders. Just: which one wins?",
  },
  {
    number: "04",
    icon: Crown,
    title: "Rank",
    description:
      "The best dish earns its rank by beating everything else. Not by collecting the most clicks. The argument is settled.",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <section ref={ref} className="py-24 md:py-32 px-6 bg-bg">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
            HOW IT WORKS
          </p>
          <h2 className="font-display italic font-black text-4xl md:text-6xl tracking-tighter">
            EAT. SNAP. BATTLE. RANK.
          </h2>
          <p className="text-text-secondary mt-4 max-w-md mx-auto text-sm">
            From the table to the leaderboard. Under 30 seconds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="relative bg-surface border border-border rounded-2xl p-6 pt-10 overflow-hidden group hover:bg-surface-2 hover:border-accent/30 transition-all duration-300"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
            >
              {/* Large ghost step number for editorial depth */}
              <span
                aria-hidden="true"
                className="absolute -top-2 right-3 text-[5.5rem] font-black italic text-text-primary/5 leading-none select-none pointer-events-none group-hover:text-accent/10 transition-colors duration-300"
              >
                {step.number}
              </span>

              {/* Icon */}
              <div className="relative z-10 w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                <step.icon size={20} className="text-accent" />
              </div>

              <span className="text-[9px] font-black tracking-[0.25em] text-text-tertiary block mb-2">
                STEP {step.number}
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
