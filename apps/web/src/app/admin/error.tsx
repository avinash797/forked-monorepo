"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center min-h-[60vh]">
      <h1 className="font-display italic font-black text-4xl text-text-primary mb-4">
        Dashboard <span className="text-accent">error.</span>
      </h1>
      <p className="text-text-secondary text-lg mb-8 max-w-md">
        Something went wrong loading this admin page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="bg-accent text-accent-on px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          TRY AGAIN
        </button>
        <Link
          href="/admin"
          className="bg-surface-2 border border-border text-text-primary px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-surface transition-all"
        >
          DASHBOARD
        </Link>
      </div>
    </div>
  );
}
