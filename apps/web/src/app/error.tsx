"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F0F10] flex flex-col items-center justify-center px-6 text-center">
      <ForkLogo size={48} color="#FBBF24" className="mb-6" />
      <h1 className="font-display italic font-black text-4xl md:text-6xl text-white mb-4">
        Something went <span className="text-[#C0392B]">wrong.</span>
      </h1>
      <p className="text-white/50 text-lg mb-8 max-w-md">
        An unexpected error occurred. Try again or head back home.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="bg-[#C0392B] text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-white/10 transition-all"
        >
          GO HOME
        </Link>
      </div>
    </div>
  );
}
