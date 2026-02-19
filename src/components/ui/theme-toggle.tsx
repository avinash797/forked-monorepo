"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    const newIsDark = !isDark;
    if (newIsDark) {
      html.classList.add("dark");
      localStorage.setItem("forked-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("forked-theme", "light");
    }
    setIsDark(newIsDark);
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black tracking-widest uppercase"
    >
      {isDark ? <Sun size={12} /> : <Moon size={12} />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
