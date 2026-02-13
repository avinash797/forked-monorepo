import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#221610]/90 backdrop-blur-md border-b border-[rgba(236,237,238,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <ForkLogo size={28} color="#FBBF24" />
            <span className="text-lg font-bold text-white">Forked</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/leaderboard"
              className="text-sm text-[#c9a492] hover:text-white transition-colors"
            >
              Leaderboards
            </Link>
            <Link
              href="/about"
              className="text-sm text-[#c9a492] hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-[#c9a492] hover:text-white transition-colors"
            >
              How It Works
            </Link>
          </div>

          <Link
            href="#download"
            className="bg-accent text-accent-on px-4 py-2 rounded-sm text-sm font-semibold hover:brightness-110 transition-all"
          >
            Get the App
          </Link>
        </div>
      </div>
    </nav>
  );
}
