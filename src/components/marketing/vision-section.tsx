"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Target, ShieldCheck, Zap, Trophy } from "lucide-react";

const features = [
  { icon: Target, label: "Dish Precision", desc: "Rank specific items, not facades." },
  { icon: ShieldCheck, label: "ELO Verified", desc: "No bot-spam or fake averages." },
  { icon: Zap, label: "Zero Friction", desc: "Rate in 2 seconds. Eat in 2 minutes." },
  { icon: Trophy, label: "The Champ", desc: "Defend your favorite dish's crown." },
];

export function VisionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section
      id="vision"
      ref={ref}
      className="py-24 md:py-32 px-6 bg-[#0a0a0a] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        {/* Text Column */}
        <div className="space-y-8">
          <motion.h2
            className="font-display italic font-black text-4xl md:text-6xl"
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
          >
            Google Reviews <br /> Are{" "}
            <span className="text-[#FF4D00]">Broken.</span>
          </motion.h2>

          <motion.div
            className="space-y-6 text-white/60 text-lg leading-relaxed font-light"
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            <p>
              Just because a steakhouse is rated 4.8 doesn&apos;t mean their
              burger isn&apos;t an afterthought. And that quiet hole-in-the-wall?
              It might be serving the city&apos;s #1 Carbonara, but you&apos;d
              never find it on a &ldquo;Top Rated&rdquo; list obscured by vibes
              and valet parking.
            </p>
            <p className="border-l-2 border-[#FF4D00] pl-6 italic text-white/80">
              &ldquo;We&apos;re dropping the curtain on mediocre icons. We value
              the sweat, the seasoning, and the craft — not the interior
              design.&rdquo;
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((item, i) => (
              <motion.div
                key={item.label}
                className="bg-white/5 border border-white/10 p-4 rounded-xl"
                animate={
                  isInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 20 }
                }
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <item.icon className="text-[#FF4D00] mb-3" size={24} />
                <h4 className="text-white font-bold text-sm mb-1">
                  {item.label}
                </h4>
                <p className="text-white/40 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Image Column */}
        <div className="relative">
          <motion.div
            className="relative z-10 aspect-square rounded-3xl overflow-hidden border-4 border-white/5 shadow-2xl"
            animate={
              isInView
                ? { scale: 1, rotate: 0 }
                : { scale: 0.8, rotate: -5 }
            }
            transition={{ duration: 1 }}
          >
            <Image
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000"
              alt="Hole in the wall restaurant with incredible food"
              fill
              className="object-cover grayscale brightness-50 contrast-125"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

            <div className="absolute bottom-8 left-8 right-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#FF4D00] text-white text-[10px] font-black px-2 py-0.5 rounded">
                  HOLE IN THE WALL
                </span>
                <span className="text-white/40 text-[10px] font-bold">VS</span>
                <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  The Overhyped Spot
                </span>
              </div>
              <p className="text-2xl font-black italic">
                SHINING LIGHT ON THE UNKNOWN GIANTS.
              </p>
            </div>
          </motion.div>

          {/* Decorative frames */}
          <div className="absolute -top-10 -right-10 w-full h-full border border-white/5 rounded-3xl -z-10" />
          <div className="absolute -bottom-6 -left-6 w-1/2 h-1/2 bg-[#FF4D00]/20 blur-[80px] -z-10" />
        </div>
      </div>
    </section>
  );
}
