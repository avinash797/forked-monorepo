"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { track } from "@vercel/analytics";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

const allNavLinks = [
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
];

const waitlistHiddenHrefs = ["/leaderboard", "/blog"];

const navLinks = IS_WAITLIST_MODE
  ? allNavLinks.filter((l) => !waitlistHiddenHrefs.includes(l.href))
  : allNavLinks;

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 min-h-16 flex items-center justify-between ${
        isScrolled || isMobileOpen
          ? "bg-bg/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/fork-logo/fork-gold.png"
          alt="Forked logo"
          width={28}
          height={28}
        />
        <span className="text-xl font-extrabold tracking-tighter uppercase italic text-text-primary">
          Forked
        </span>
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-tight text-text-secondary">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => track("nav_link_click", { label: link.label })}
            className="hover:text-text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {!IS_WAITLIST_MODE && (
          <Link
            href="#download"
            onClick={() => track("nav_cta_click", { location: "desktop" })}
            className="hidden sm:inline-flex bg-text-primary text-bg px-5 py-2 rounded-full text-xs font-bold hover:bg-accent hover:text-accent-on transition-all active:scale-95"
          >
            GET THE APP
          </Link>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => {
            track("nav_mobile_menu", {
              action: isMobileOpen ? "close" : "open",
            });
            setIsMobileOpen(!isMobileOpen);
          }}
          className="md:hidden text-text-primary p-1 cursor-pointer"
          aria-label={
            isMobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-bg/95 backdrop-blur-md border-b border-border md:hidden">
          <div className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  track("nav_link_click", { label: link.label });
                  setIsMobileOpen(false);
                }}
                className="text-text-secondary hover:text-text-primary text-base font-medium py-3 border-b border-border transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {!IS_WAITLIST_MODE && (
              <Link
                href="#download"
                onClick={() => {
                  track("nav_cta_click", { location: "mobile" });
                  setIsMobileOpen(false);
                }}
                className="mt-3 bg-accent text-accent-on px-6 py-3 rounded-xl text-sm font-bold tracking-widest text-center hover:scale-105 active:scale-95 transition-all"
              >
                GET THE APP
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
