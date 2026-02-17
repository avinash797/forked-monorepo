"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const statements = [
  "Make food decision fatigue obsolete.",
  "Drop the curtains from fancy restaurants.",
  "Spotlight hole-in-the-wall gems.",
  "Push chefs to compete and perfect their craft.",
];

export function MissionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref} className="py-24 md:py-32 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <motion.p
          className="text-[10px] font-black tracking-[0.3em] uppercase text-[#FF4D00] text-center mb-12"
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          THE MISSION
        </motion.p>

        <div className="space-y-8">
          {statements.map((statement, i) => (
            <motion.p
              key={i}
              className="font-display italic font-black text-2xl sm:text-3xl md:text-5xl text-white text-center leading-tight tracking-tight"
              animate={
                isInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
            >
              {statement}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
