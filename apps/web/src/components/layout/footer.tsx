import Link from "next/link";
import { Flame, Mail } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface FooterProps {
  onOpenEarlyAccess?: () => void;
}

export function Footer({ onOpenEarlyAccess }: FooterProps = {}) {
  return (
    <footer className="bg-[#0D0D0E] text-[#A3A3A3] pt-16 pb-12 border-t border-[#26262A] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#222226]">
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#E13B22] text-white flex items-center justify-center font-display font-black text-lg tracking-tight">
                F
              </div>
              <span className="font-display font-black text-2xl tracking-tight text-white">FORKED</span>
            </Link>
            <p className="text-sm text-[#D4D4D4] max-w-sm leading-relaxed">
              <strong>Rank the dish, not the place.</strong> Settle the debate with pairwise head-to-head battles and public citywide leaderboards.
            </p>
            <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-[#18181A] border border-[#2E2E32] text-xs text-white">
              <Flame className="w-4 h-4 text-[#E13B22] shrink-0" />
              <span>Strictly zero star averages. 100% paid meals.</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#the-enemy" className="hover:text-white transition-colors">The Enemy (Anti-Star)</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">The Three Pillars</Link></li>
              <li><Link href="/#leaderboards" className="hover:text-white transition-colors">Dish Leaderboards</Link></li>
              <li><Link href="/#compare" className="hover:text-white transition-colors">Compare vs Beli & Yelp</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ & Math Model</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              {IS_WAITLIST_MODE ? "Private Beta" : "Get Forked"}
            </h4>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {IS_WAITLIST_MODE
                ? "Core features are finalized and in active testing. Reserve your spot for the next test cohort on iOS and Android."
                : "Available now on iOS and Android. Settle the debate with pairwise head-to-head battles."}
            </p>
            {IS_WAITLIST_MODE ? (
              onOpenEarlyAccess ? (
                <button
                  onClick={onOpenEarlyAccess}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Join Beta Waitlist</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Join Beta Waitlist</span>
                </Link>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#18181A] hover:bg-[#222226] border border-[#2E2E32] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>App Store</span>
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#18181A] hover:bg-[#222226] border border-[#2E2E32] text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Google Play</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
          <div className="flex items-center gap-6">
            <span>&copy; 2026 Forked. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px]">Made for Mobile First</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
