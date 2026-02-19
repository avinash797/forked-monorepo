import Link from "next/link";
import Image from "next/image";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-border bg-bg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/fork-logo/fork-gold.png"
              alt="Forked logo"
              width={28}
              height={28}
            />
            <span className="text-2xl font-extrabold tracking-tighter uppercase italic text-text-primary">
              Forked
            </span>
          </Link>
          <p className="text-text-secondary text-xs font-medium max-w-xs uppercase tracking-widest leading-loose">
            The dish-level ranking engine for the next generation of food
            lovers. Built for data. Built for taste.
          </p>
        </div>

        <div className="flex gap-12 text-xs font-black tracking-widest text-text-tertiary uppercase">
          {!IS_WAITLIST_MODE && (
            <div className="space-y-4">
              <p className="text-text-tertiary">EXPLORE</p>
              <Link
                href="/leaderboard"
                className="block hover:text-text-primary transition-colors"
              >
                Leaderboards
              </Link>
              <Link
                href="/blog"
                className="block hover:text-text-primary transition-colors"
              >
                Blog
              </Link>
              <Link
                href="#download"
                className="block hover:text-text-primary transition-colors"
              >
                Download
              </Link>
            </div>
          )}
          <div className="space-y-4">
            <p className="text-text-tertiary">COMPANY</p>
            <Link
              href="/about"
              className="block hover:text-text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/how-it-works"
              className="block hover:text-text-primary transition-colors"
            >
              How It Works
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-text-tertiary">LEGAL</p>
            <Link
              href="/privacy"
              className="block hover:text-text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="block hover:text-text-primary transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-text-tertiary text-[10px] font-bold tracking-[0.5em] uppercase">
          Made with love in New Orleans
        </p>
        <ThemeToggle />
      </div>
    </footer>
  );
}
