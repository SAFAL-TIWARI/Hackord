import React, { Suspense, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AnimatedRole } from "@/components/AnimatedRole";
import { BrandLogo } from "@/components/BrandLogo";
import { FeaturedRooms } from "@/components/FeaturedRooms";
import { FeaturesBento } from "@/components/FeaturesBento";
import { HeroShowcase } from "@/components/HeroShowcase";
import { ThemeToggle } from "@/components/ThemeToggle";

const HeroBackground = React.lazy(() =>
  import("@/components/HeroBackground").then((m) => ({ default: m.HeroBackground }))
);

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (saved) return saved;
    }
    return "dark";
  });

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
    <div className="min-h-screen bg-background bg-mesh text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark:border-white/5 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
          <BrandLogo size="md" />

          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

           
            <Link
              to="/signup"
              className="rounded-lg bg-gradient-brand px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-glow transition hover:opacity-90 whitespace-nowrap"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-8xl px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 border-b border-white/10 dark:border-white/5 overflow-hidden lg:overflow-visible">
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <HeroBackground />
        </Suspense>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground animate-fade-in">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>The Intelligence Engine for Hackathons</span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in animate-delay-100">
              Ship faster <br />
              <span className="text-foreground drop-shadow-sm">
                with <AnimatedRole roles={["AI.", "Confidence.", "Hackord."]} />
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-xl text-base sm:text-xl text-muted-foreground leading-relaxed animate-fade-in animate-delay-200">
              The premium workspace for elite hackathon teams. Automate pull requests, generate pitch decks, and collaborate in real-time with an intelligent AI copilot.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4 animate-fade-in animate-delay-300">
              <Link
                to="/signup"
                className="group relative rounded-xl px-8 py-3 text-center font-semibold text-background transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_var(--color-primary)]"
              >
                <div className="absolute inset-0 rounded-xl bg-foreground group-hover:bg-foreground/90 transition-colors" />
                <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-r from-primary via-brand to-primary opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />
                <span className="relative">Create a workspace</span>
              </Link>
              <Link
                to="/dashboard"
                className="rounded-xl glass-strong px-8 py-3 text-center font-semibold transition hover:bg-muted/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live demo
              </Link>
            </div>
          </div>

          <div className="animate-fade-in animate-delay-400">
            <HeroShowcase />
          </div>
        </div>
      </section>

      {/* Featured Active Rooms & Create Room Grid */}
      <FeaturedRooms />

      {/* Bento Grid Features */}
      <FeaturesBento />

      {/* Premium Footer */}
      <footer className="border-t border-white/10 dark:border-white/5 bg-background/80 py-16 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <BrandLogo size="md" />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">API Reference</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
