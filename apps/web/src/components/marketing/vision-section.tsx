"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Target, ShieldCheck, Zap, Trophy } from "lucide-react";

const features = [
  {
    icon: Target,
    label: "Rank the Dish. Not the Vibe.",
    desc: "Your gumbo rating doesn't care if the waiter was slow.",
  },
  {
    icon: ShieldCheck,
    label: "Not Sponsored. Not Paid.",
    desc: "The only way to climb is to serve better food.",
  },
  {
    icon: Zap,
    label: "Under 30 Seconds to Vote",
    desc: "One photo. One battle. Done before the check arrives.",
  },
  {
    icon: Trophy,
    label: "Hole-in-the-Wall Energy",
    desc: "The hidden gems win here. Not the Instagram bait.",
  },
];

export function VisionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section
      id="vision"
      ref={ref}
      className="py-24 md:py-32 px-6 bg-surface relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Text Column */}
        <div className="space-y-8">
          <motion.div
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
              THE ARGUMENT
            </p>
            <h2 className="font-display italic font-black text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tighter">
              Nobody Eats <br />
              a <span className="text-accent">Restaurant.</span>
            </h2>
          </motion.div>

          <motion.div
            className="space-y-5 text-text-secondary text-lg leading-relaxed font-light"
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            <p>
              The most useful food recommendation you&apos;ll ever get is not
              &ldquo;go to this restaurant.&rdquo; It&apos;s &ldquo;order the
              gumbo at Dooky Chase.&rdquo; But every review app gives you the
              restaurant — the vibe, the service, the parking.
            </p>
            <p>
              Your city&apos;s best po&apos;boy is probably at a place with 3
              stars because the owner was rude once. The overhyped spot with 4.8
              stars is coasting on its interior design. We only rank the dish.
              Nothing else.
            </p>

            {/* Editorial pull quote */}
            <blockquote className="relative pl-6 py-1">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent to-accent/0" />
              <p className="italic text-text-primary/80 font-medium text-base md:text-lg">
                &ldquo;The hole-in-the-wall with the best gumbo in the city is
                losing to a steakhouse with a valet. That&apos;s what
                we&apos;re here to fix.&rdquo;
              </p>
            </blockquote>
          </motion.div>

          {/* Feature cards: editorial left-border style */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {features.map((item, i) => (
              <motion.div
                key={item.label}
                className="pl-4 border-l-2 border-border hover:border-accent transition-colors duration-300 group cursor-default"
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <item.icon
                  className="text-accent mb-2 group-hover:scale-110 transition-transform duration-200"
                  size={18}
                />
                <h4 className="text-text-primary font-black text-sm mb-1 leading-snug">
                  {item.label}
                </h4>
                <p className="text-text-tertiary text-xs leading-snug">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Image Column */}
        <div className="relative">
          <motion.div
            className="relative z-10 aspect-square rounded-2xl overflow-hidden border border-border shadow-2xl"
            animate={
              isInView ? { scale: 1, rotate: 0 } : { scale: 0.9, rotate: -3 }
            }
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000"
              alt="Hole in the wall restaurant with incredible food"
              fill
              priority
              className="object-cover grayscale brightness-50 contrast-125"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <div className="absolute bottom-8 left-8 right-8 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-accent text-accent-on text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                  HOLE IN THE WALL
                </span>
                <span className="text-white/50 text-[9px] font-black tracking-widest">
                  VS
                </span>
                <span className="bg-white/10 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase border border-white/20">
                  THE 4.8-STAR TRAP
                </span>
              </div>
              <p className="text-xl md:text-2xl font-black italic text-white leading-tight">
                THE HOLE-IN-THE-WALL WINS HERE.
              </p>
            </div>
          </motion.div>

          {/* Decorative offset frame */}
          <div className="absolute -top-4 -right-4 w-full h-full border border-accent/20 rounded-2xl -z-10" />
          {/* Accent glow */}
          <div className="absolute -bottom-8 -left-8 w-2/3 h-2/3 bg-accent/15 blur-[80px] -z-10 rounded-full pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
