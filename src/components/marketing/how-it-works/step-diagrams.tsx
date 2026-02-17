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
      <div className="w-20 h-20 rounded-full bg-[#FF4D00]/10 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[#FF4D00]/20 flex items-center justify-center">
          <MapPin size={24} className="text-[#FF4D00]" />
        </div>
      </div>
      <div className="absolute top-2 right-4 text-[8px] font-bold tracking-widest text-white/20 uppercase">
        Your City
      </div>
      <div className="absolute bottom-2 left-4 w-16 h-1 rounded-full bg-white/5" />
      <div className="absolute bottom-5 left-8 w-10 h-1 rounded-full bg-white/5" />
    </div>
  );
}

function CameraPhoneVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="w-20 h-28 rounded-xl border-2 border-white/20 bg-white/5 flex flex-col items-center justify-center gap-2">
        <Camera size={20} className="text-[#FF4D00]" />
        <div className="w-12 h-8 rounded bg-white/10" />
        <div className="w-3 h-3 rounded-full border border-white/20" />
      </div>
    </div>
  );
}

function BattleCardsVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center gap-3">
      <div className="w-16 h-20 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
        <span className="text-[10px] font-black text-[#FF4D00]">1842</span>
      </div>
      <div className="flex flex-col items-center">
        <Swords size={16} className="text-white/30" />
        <span className="text-[8px] font-black text-white/20 mt-1">VS</span>
      </div>
      <div className="w-16 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
        <span className="text-[10px] font-black text-white/40">1756</span>
      </div>
    </div>
  );
}

function MiniLeaderboardVisual() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="w-40 space-y-1.5">
        {[
          { rank: 1, w: "100%", color: "bg-[#FBBF24]" },
          { rank: 2, w: "85%", color: "bg-white/20" },
          { rank: 3, w: "70%", color: "bg-white/10" },
        ].map((row) => (
          <div key={row.rank} className="flex items-center gap-2">
            <span className="text-[9px] font-black text-white/30 w-3">
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
    subtitle: "Discover dishes near you",
    description:
      "Open the app, find a restaurant in your city, and order a dish worth rating. Any dish, any restaurant.",
    visual: <MapPinVisual />,
  },
  {
    number: "02",
    icon: Camera,
    title: "Snap",
    subtitle: "Photo-first ratings",
    description:
      "Every rating requires a photo. Snap a picture of your dish before you dig in. No photo, no rating.",
    visual: <CameraPhoneVisual />,
  },
  {
    number: "03",
    icon: Swords,
    title: "Battle",
    subtitle: "Head-to-head matchups",
    description:
      "After rating, we serve you a \"This vs That\" matchup against a similarly-rated dish. Pick the winner in 3 seconds.",
    visual: <BattleCardsVisual />,
  },
  {
    number: "04",
    icon: Crown,
    title: "Rank",
    subtitle: "Real-time leaderboards",
    description:
      "Every battle updates Elo scores instantly. The best dishes rise to the top, powered by real user preferences.",
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
            className="bg-white/5 border border-white/10 rounded-2xl p-6 group hover:bg-white/10 hover:border-white/20 transition-all"
            animate={
              isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
          >
            <span className="text-[10px] font-black tracking-widest text-white/20 block mb-3">
              STEP {step.number}
            </span>
            {step.visual}
            <div className="mt-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center mb-3">
                <step.icon size={20} className="text-[#FF4D00]" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                {step.title}
              </h3>
              <p className="text-xs font-bold text-[#FF4D00]/60 uppercase tracking-wider mb-2">
                {step.subtitle}
              </p>
              <p className="text-sm text-white/40 leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
