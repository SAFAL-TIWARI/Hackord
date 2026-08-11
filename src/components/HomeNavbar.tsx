import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function HomeNavbar() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (saved) return saved;
    }
    return "dark";
  });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="sticky top-0 z-50 w-full px-4 sm:px-6 py-3 transition-all duration-300">
      <header
        className={cn(
          "mx-auto max-w-7xl w-full rounded-2xl transition-all duration-300 px-4 sm:px-8 py-3 flex items-center justify-between",
          scrolled
            ? "border border-border/80 bg-card/85 backdrop-blur-2xl shadow-spatial"
            : "border border-transparent bg-transparent"
        )}
      >
        <BrandLogo size="md" className="transition-transform duration-300 hover:scale-105" />

        <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Link
            to="/signup"
            className="rounded-xl bg-gradient-brand text-xs sm:text-sm font-semibold text-white px-4 py-2 shadow-glow hover:opacity-90 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Get started
          </Link>
        </nav>
      </header>
    </div>
  );
}
