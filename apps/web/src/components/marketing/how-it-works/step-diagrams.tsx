"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Camera, Swords, Crown } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface StepCard {
  number: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  visual: React.ReactNode;
}

function MapPinVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <MapPin size={24} className="text-accent" />
        </div>
      </div>
      <div className="absolute top-2 right-4 text-[8px] font-bold tracking-widest text-text-tertiary uppercase">
        Your City
      </div>
      <div className="absolute bottom-2 left-4 w-16 h-1 rounded-full bg-surface-2" />
      <div className="absolute bottom-5 left-8 w-10 h-1 rounded-full bg-surface-2" />
    </div>
  );
}

function CameraPhoneVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="w-20 h-28 rounded-xl border-2 border-border bg-surface-2 flex flex-col items-center justify-center gap-2">
        <Camera size={20} className="text-accent" />
        <div className="w-12 h-8 rounded bg-surface" />
        <div className="w-3 h-3 rounded-full border border-border" />
      </div>
    </div>
  );
}

function BattleCardsVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center gap-3">
      <div className="w-16 h-20 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
        <span className="text-[10px] font-black text-accent">X</span>
      </div>
      <div className="flex flex-col items-center">
        <Swords size={16} className="text-text-tertiary" />
        <span className="text-[8px] font-black text-text-tertiary mt-1">
          VS
        </span>
      </div>
      <div className="w-16 h-20 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
        <span className="text-[10px] font-black text-text-secondary">Y</span>
      </div>
    </div>
  );
}

function MiniLeaderboardVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="w-40 space-y-1.5">
        {[
          { rank: 1, w: "100%", color: "bg-gold" },
          { rank: 2, w: "85%", color: "bg-silver" },
          { rank: 3, w: "70%", color: "bg-bronze" },
        ].map((row) => (
          <div key={row.rank} className="flex items-center gap-2">
            <span className="text-[9px] font-black text-text-tertiary w-3">
              {row.rank}
            </span>
            <div
              className={`h-3 rounded-full ${row.color}`}
              style={{ width: row.w }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const steps: StepCard[] = [
  {
    number: "01",
    icon: MapPin,
    title: "Find",
    subtitle: "The specific dish, not the restaurant",
    description:
      "Order the dish. The specific one — not just 'dinner at this restaurant.' That's the whole point.",
    visual: <MapPinVisual />,
  },
  {
    number: "02",
    icon: Camera,
    title: "Snap",
    subtitle: "Prove you were there",
    description:
      "Take a photo before you eat. Photo = higher weight. Anyone can leave a number — not everyone can prove they showed up.",
    visual: <CameraPhoneVisual />,
  },
  {
    number: "03",
    icon: Swords,
    title: "Battle",
    subtitle: "Pick the winner",
    description:
      "We show you two dishes of the same type. Pick the winner. No scales, no sliders. Just: which one wins?",
    visual: <BattleCardsVisual />,
  },
  {
    number: "04",
    icon: Crown,
    title: "Rank",
    subtitle: "The argument is settled",
    description:
      "The best dish earns its rank by beating everything else — not by collecting the most clicks. The argument is settled.",
    visual: <MiniLeaderboardVisual />,
  },
];

export function StepDiagrams() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <section ref={ref}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            className="bg-surface border border-border rounded-2xl p-6 group hover:bg-surface-2 hover:border-accent/30 transition-all"
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
          >
            <span className="text-[10px] font-black tracking-widest text-text-tertiary block mb-3">
              STEP {step.number}
            </span>
            {step.visual}
            <div className="mt-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                <step.icon size={20} className="text-accent" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-text-primary mb-1">
                {step.title}
              </h3>
              <p className="text-xs font-bold text-accent/60 uppercase tracking-wider mb-2">
                {step.subtitle}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
