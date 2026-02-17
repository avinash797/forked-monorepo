"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";
import { Button } from "@/components/ui/button";

const DISH_TYPES = ["Po'boy", "Burger", "Tacos", "Pizza", "Fried Chicken"];

export function HeroSection() {
  const [dishIndex, setDishIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setDishIndex((i) => (i + 1) % DISH_TYPES.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#221610] to-[#342219]">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(238,108,43,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16">
        <div className="flex justify-center mb-8">
          <ForkLogo size={72} color="#FBBF24" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Find the Best{" "}
          <span
            className={`inline-block text-[#ee6c2b] transition-all duration-300 ${
              isAnimating
                ? "opacity-0 translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
          >
            {DISH_TYPES[dishIndex]}
          </span>
          <br />
          in Your City
        </h1>

        <p className="text-lg sm:text-xl text-[#c9a492] max-w-2xl mx-auto mb-10">
          Not restaurant ratings. Dish ratings. Powered by real people, ranked
          by real battles.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button size="lg" className="w-full sm:w-auto text-base">
            Download the App
          </Button>
          <Link href="/leaderboard">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-base bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              See the Leaderboards
            </Button>
          </Link>
        </div>

        {/* App store badges */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            App Store
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
            </svg>
            Google Play
          </a>
        </div>
      </div>
    </section>
  );
}
