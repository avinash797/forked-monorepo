"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { track } from "@vercel/analytics";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";

const MARQUEE_DISHES = [
  "Pizza", "Smash Burger", "Tacos al Pastor", "Roast Beef Po'boy", "Hot Chicken",
  "Tonkotsu Ramen", "Italian Beef", "Buffalo Wings", "Birria Tacos",
  "Fried Chicken Sandwich", "Pad Thai", "Cheesesteak", "Lobster Roll",
  "Texas Brisket", "Fish & Chips", "Chicken Tikka Masala", "Biryani",
  "Dan Dan Noodles", "Gumbo", "Bagel & Lox", "Carnitas", "French Dip",
  "Clam Chowder", "Pork Belly Bao", "Shawarma", "Mac & Cheese",
];

const allNavLinks = [
  { href: "/#the-enemy", label: "The Enemy" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#leaderboards", label: "Leaderboards" },
  { href: "/#compare", label: "Compare" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

const waitlistHiddenHrefs = ["/blog"];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navLinks = IS_WAITLIST_MODE
    ? allNavLinks.filter((l) => !waitlistHiddenHrefs.includes(l.href))
    : allNavLinks;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="bg-[#121212] text-[#FBF9F5] py-2 border-b border-[#252525] overflow-hidden whitespace-nowrap select-none">
        <div className="animate-marquee flex items-center">
          {[0, 1].map((loop) => (
            <div key={loop} className="flex items-center">
              {MARQUEE_DISHES.map((dish, i) => (
                <div key={`dish-${loop}-${i}`} className="inline-flex items-center gap-3 px-4 shrink-0">
                  <span className="text-xs font-medium tracking-wider text-white/90 uppercase">{dish}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E13B22]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          isScrolled || isMobileOpen
            ? "bg-bg/90 backdrop-blur-md border-b border-border shadow-xs py-3"
            : "bg-bg border-b border-border py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/images/fork-logo/fork-gold.png" alt="Forked logo" width={36} height={36} />
              <div className="flex flex-col">
                <span className="font-display font-black text-2xl tracking-tight leading-none text-text-primary">
                  FORKED
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-tertiary leading-none mt-0.5">
                  Rank The Dish
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-text-secondary">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => track("nav_link_click", { label: link.label })}
                  className="px-3 py-1.5 rounded-md hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="p-2 rounded-lg text-text-primary hover:bg-surface-2 focus:outline-none"
                aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileOpen}
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileOpen && (
          <div className="lg:hidden bg-bg border-b border-border px-4 pt-3 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    track("nav_link_click", { label: link.label });
                    setIsMobileOpen(false);
                  }}
                  className="px-3 py-2 text-sm font-medium rounded-md text-text-secondary bg-surface-2 hover:brightness-95"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
