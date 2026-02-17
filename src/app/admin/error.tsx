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
      <h1 className="font-display italic font-black text-4xl text-white mb-4">
        Dashboard <span className="text-[#FF4D00]">error.</span>
      </h1>
      <p className="text-white/50 text-lg mb-8 max-w-md">
        Something went wrong loading this admin page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="bg-[#FF4D00] text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          TRY AGAIN
        </button>
        <Link
          href="/admin"
          className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-white/10 transition-all"
        >
          DASHBOARD
        </Link>
      </div>
    </div>
  );
}
