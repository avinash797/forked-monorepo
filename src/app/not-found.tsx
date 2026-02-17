import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center">
      <ForkLogo size={64} color="#FBBF24" className="mb-8" />
      <h1 className="font-display italic font-black text-6xl md:text-8xl text-white mb-4">
        4<span className="text-[#FF4D00]">0</span>4
      </h1>
      <p className="text-white/50 text-lg mb-2 max-w-md">
        This page doesn&apos;t exist — maybe the dish got taken off the menu.
      </p>
      <p className="text-white/30 text-sm mb-10">
        Check the URL or head back to familiar territory.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="bg-[#FF4D00] text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          GO HOME
        </Link>
        <Link
          href="/leaderboard"
          className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-white/10 transition-all"
        >
          LEADERBOARDS
        </Link>
      </div>
    </div>
  );
}
