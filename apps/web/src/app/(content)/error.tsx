"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center min-h-[60vh]">
      <h1 className="font-display italic font-black text-4xl md:text-5xl text-text-primary mb-4">
        Something went <span className="text-accent">wrong.</span>
      </h1>
      <p className="text-text-secondary text-lg mb-8 max-w-md">
        We couldn&apos;t load this page. Try again or head back home.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="bg-accent text-accent-on px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="bg-surface-2 border border-border text-text-primary px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-surface transition-all"
        >
          GO HOME
        </Link>
      </div>
    </div>
  );
}
