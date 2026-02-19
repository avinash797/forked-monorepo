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
    description: "Try a dish worth rating at any restaurant in your city.",
  },
  {
    number: "02",
    icon: Camera,
    title: "Snap",
    description:
      "Take a mandatory photo. No photo, no rating. This is your proof.",
  },
  {
    number: "03",
    icon: Swords,
    title: "Compare",
    description:
      '"This vs That" — pick the winner in head-to-head dish battles.',
  },
  {
    number: "04",
    icon: Crown,
    title: "Rank",
    description:
      "Elo-powered leaderboards update in real-time. The cream rises to the top.",
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
            EAT. SNAP. COMPARE. RANK.
          </h2>
          <p className="text-text-secondary mt-4 max-w-md mx-auto">
            Four simple steps to find the best food in your city.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="bg-surface border border-border rounded-2xl p-6 relative group hover:bg-surface-2 hover:border-text-tertiary transition-all"
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
            >
              <span className="text-[10px] font-black tracking-widest text-text-tertiary block mb-4">
                STEP {step.number}
              </span>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <step.icon size={24} className="text-accent" />
              </div>
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
