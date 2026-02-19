"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after client mount
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-[10px] font-black tracking-widest uppercase"
    >
      {isDark ? <Sun size={12} /> : <Moon size={12} />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
