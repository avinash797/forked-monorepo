"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Swords } from "lucide-react";

function BattleMockup() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <p className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
        THIS VS THAT
      </p>
      <div className="flex gap-4">
        <div className="flex-1 bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="w-full h-20 rounded-lg bg-[#FF4D00]/10 mb-3" />
          <p className="text-xs font-bold text-white">Gumbo</p>
          <p className="text-[10px] text-white/30">Dooky Chase&apos;s</p>
          <p className="text-sm font-black text-[#FBBF24] mt-1">1842</p>
        </div>
        <div className="flex items-center">
          <Swords size={20} className="text-white/20" />
        </div>
        <div className="flex-1 bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="w-full h-20 rounded-lg bg-white/5 mb-3" />
          <p className="text-xs font-bold text-white">Gumbo</p>
          <p className="text-[10px] text-white/30">Coop&apos;s Place</p>
          <p className="text-sm font-black text-white/40 mt-1">1756</p>
        </div>
      </div>
      <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">
        Tap to pick the winner
      </p>
    </div>
  );
}

export function StorySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref}>
      <motion.div
        className="text-center mb-16"
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#FF4D00] mb-4">
          OUR STORY
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter">
          Born in New Orleans
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          className="space-y-6 text-sm text-white/40 leading-relaxed"
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p>
            Forked started with a simple argument: where&apos;s the best gumbo
            in New Orleans? Not the best restaurant — the best{" "}
            <span className="text-white font-bold">gumbo</span>. We realized
            that no platform answered this question well.
          </p>
          <p>
            Restaurant ratings are broken. A 4.5-star restaurant might have
            mediocre gumbo but great service. A hole-in-the-wall with 3.8
            stars might serve the best bowl in the city. The signal is buried
            in the noise.
          </p>
          <p>
            So we built Forked — a platform where every rating is about a
            specific dish, every ranking is powered by head-to-head battles, and
            the algorithm does the rest. No opinions. No editorial picks. Just
            data.
          </p>
          <p>
            We launched in New Orleans because no city takes its food more
            seriously. If our system can rank gumbo, po&apos;boys, and
            crawfish &eacute;touff&eacute;e to the satisfaction of locals, it
            can rank anything, anywhere.
          </p>
        </motion.div>

        <motion.div
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <BattleMockup />
        </motion.div>
      </div>
    </section>
  );
}
