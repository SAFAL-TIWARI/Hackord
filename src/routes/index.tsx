import React, { Suspense, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Video, Code2, Users, Rocket, ShieldCheck } from "lucide-react";
import { AnimatedRole } from "@/components/AnimatedRole";
import { BrandLogo } from "@/components/BrandLogo";
import { FeaturedRooms } from "@/components/FeaturedRooms";
import { FeaturesBento } from "@/components/FeaturesBento";
import { HeroShowcase } from "@/components/HeroShowcase";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AboutHackordSection } from "@/components/AboutHackordSection";
import { cn } from "@/lib/utils";

const HeroBackground = React.lazy(() =>
  import("@/components/HeroBackground").then((m) => ({ default: m.HeroBackground }))
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hackord — Collaborative Hackathon Workspaces & Dev Rooms" },
      {
        name: "description",
        content:
          "Hackord is an all-in-one developer workspace platform to discover hackathons, create real-time rooms with audio/video calls, track team tasks, and build projects together.",
      },
    ],
  }),
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full lg:w-6xl mx-auto lg:flex flex justify-center pointer-events-none">
        <header
          className={cn(
            "w-full ease-in-out pointer-events-auto",
            scrolled
              ? "mt-3 w-[88%] max-w-2xl rounded-full border border-border bg-card/85 backdrop-blur-2xl shadow-spatial py-3 px-5"
              : "mt-0 border-none bg-transparent py-5 px-8 sm:px-12"
          )}
          style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="w-full flex items-center justify-between">
            <BrandLogo size={scrolled ? "sm" : "md"} iconOnly={scrolled} className="transition-all duration-500" />

            <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <Link
                to="/signup"
                className={cn(
                  "rounded-lg bg-gradient-brand text-xs sm:text-sm font-medium text-white shadow-glow hover:opacity-90 whitespace-nowrap",
                  scrolled ? "px-3 py-1.5 animate-duration-300" : "px-4 py-2"
                )}
                style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                Get started
              </Link>
            </nav>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-8xl px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 overflow-hidden lg:overflow-visible">
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <HeroBackground />
        </Suspense>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground animate-fade-in">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>The Intelligence Engine for Hackathons & Developers</span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in animate-delay-100">
              Ship faster <br />
              <span className="text-foreground drop-shadow-sm">
                with <AnimatedRole roles={["AI.", "Confidence.", "Hackord."]} />
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-xl text-base sm:text-xl text-muted-foreground leading-relaxed animate-fade-in animate-delay-200">
              <strong className="text-foreground font-semibold">Hackord</strong> is the private workspace platform for elite hackathon teams. Host HD audio/video meetings, manage tasks, track live GitHub repositories, and collaborate in real-time.
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
                to="/explore"
                className="rounded-xl glass-strong px-8 py-3 text-center font-semibold transition hover:bg-muted/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                Explore hackathons
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

      {/* Application Purpose & 3D Interactive Showcase */}
      <AboutHackordSection />

      {/* Premium Footer with Direct Privacy & Terms Links */}
      <footer className="py-16 bg-transparent text-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6 ">
          <div className="flex flex-col items-center md:items-start gap-2 ">
            <BrandLogo size="md" />
            <p className="text-xs text-muted-foreground">
              © 2026 Hackord. The real-time workspace for hackathon teams and developers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <Link to="/contact" className="hover:text-foreground font-medium text-foreground transition-colors">Contact Us</Link>
            <Link to="/privacy" className="hover:text-foreground font-medium text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground font-medium text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
