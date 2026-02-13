import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";

export function Footer() {
  return (
    <footer className="bg-[#221610] border-t border-[rgba(236,237,238,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ForkLogo size={24} color="#FBBF24" />
              <span className="text-lg font-bold text-white">Forked</span>
            </Link>
            <p className="text-sm text-[#c9a492]">
              Not restaurant ratings. Dish ratings. Powered by real people,
              ranked by real battles.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/leaderboard"
                  className="text-sm text-[#c9a492] hover:text-white transition-colors"
                >
                  Leaderboards
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[#c9a492] hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-[#c9a492] hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[#c9a492] hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[#c9a492] hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Download */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              Get the App
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                App Store
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[rgba(236,237,238,0.08)]">
          <p className="text-center text-sm text-[#9BA1A6]">
            Made with love in New Orleans
          </p>
        </div>
      </div>
    </footer>
  );
}
