"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const statements = [
  "Nobody eats a restaurant. They eat a dish.",
  "The best gumbo in the city might have 3 stars. We fix that.",
  "Not sponsored. Not paid. Not filtered. Just real battles.",
  "Your argument is data. Your vote changes the list.",
];

export function MissionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <section ref={ref} className="py-24 md:py-32 px-6 bg-surface overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.p
          className="text-[10px] font-black tracking-[0.3em] uppercase text-accent text-center mb-16"
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          WHY WE BUILT THIS
        </motion.p>

        <div className="space-y-0">
          {statements.map((statement, i) => (
            <motion.div
              key={i}
              className="group"
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Top divider */}
              <div className="h-px bg-border" />

              <div className="flex items-baseline gap-6 md:gap-10 py-6 md:py-8">
                {/* Large accent number */}
                <span
                  aria-hidden="true"
                  className="text-4xl md:text-5xl font-black italic text-accent/25 font-display leading-none shrink-0 tabular-nums group-hover:text-accent/50 transition-colors duration-300 w-12 md:w-16 text-right"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Statement */}
                <p className="font-display italic font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight tracking-tight group-hover:text-accent transition-colors duration-300">
                  {statement}
                </p>
              </div>

              {/* Bottom divider for last item */}
              {i === statements.length - 1 && (
                <div className="h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
