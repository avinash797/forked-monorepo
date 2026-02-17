import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/fork-logo/fork-gold.png"
              alt="Forked logo"
              width={28}
              height={28}
            />
            <span className="text-2xl font-extrabold tracking-tighter uppercase italic text-white">
              Forked
            </span>
          </Link>
          <p className="text-white/50 text-xs font-medium max-w-xs uppercase tracking-widest leading-loose">
            The dish-level ranking engine for the next generation of food lovers.
            Built for data. Built for taste.
          </p>
        </div>

        <div className="flex gap-12 text-xs font-black tracking-widest text-white/40 uppercase">
          <div className="space-y-4">
            <p className="text-white/30">EXPLORE</p>
            <Link href="/leaderboard" className="block hover:text-white transition-colors">
              Leaderboards
            </Link>
            <Link href="/blog" className="block hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="#download" className="block hover:text-white transition-colors">
              Download
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-white/30">COMPANY</p>
            <Link href="/about" className="block hover:text-white transition-colors">
              About
            </Link>
            <Link href="/how-it-works" className="block hover:text-white transition-colors">
              How It Works
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-white/30">LEGAL</p>
            <Link href="/privacy" className="block hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="block hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center md:text-left">
        <p className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase">
          Made with love in New Orleans
        </p>
      </div>
    </footer>
  );
}
