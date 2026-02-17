"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between ${
        isScrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-[#FF4D00] p-1.5 rounded-lg">
          <UtensilsCrossed size={20} color="white" strokeWidth={3} />
        </div>
        <span className="text-xl font-extrabold tracking-tighter uppercase italic text-white">
          Forked
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-tight text-white/60">
        <Link href="/leaderboard" className="hover:text-white transition-colors">
          Leaderboards
        </Link>
        <Link href="/blog" className="hover:text-white transition-colors">
          Blog
        </Link>
        <Link href="/about" className="hover:text-white transition-colors">
          About
        </Link>
        <Link href="/how-it-works" className="hover:text-white transition-colors">
          How It Works
        </Link>
      </div>

      <Link
        href="#download"
        className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-[#FF4D00] hover:text-white transition-all active:scale-95"
      >
        GET THE APP
      </Link>
    </nav>
  );
}
