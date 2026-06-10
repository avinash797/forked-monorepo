"use client";

import { motion } from "framer-motion";

export function AboutHero() {
  return (
    <section className="text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
          ABOUT FORKED
        </p>
        <h1 className="font-display italic font-black text-4xl md:text-7xl tracking-tighter text-text-primary">
          We Rate Dishes,{" "}
          <span className="text-accent">Not Restaurants.</span>
        </h1>
        <p className="text-text-secondary mt-6 max-w-lg mx-auto text-sm leading-relaxed">
          Because &ldquo;get the gumbo at Dooky Chase&rdquo; is infinitely more
          useful than &ldquo;go to this restaurant.&rdquo; Dish-level rankings.
          Zero sponsored placements.
        </p>
      </motion.div>
    </section>
  );
}
