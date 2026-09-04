import React, { Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AnimatedRole } from "@/components/AnimatedRole";
import { FeaturedRooms } from "@/components/FeaturedRooms";
import { FeaturesBento } from "@/components/FeaturesBento";
import { HeroShowcase } from "@/components/HeroShowcase";
import { AboutHackordSection } from "@/components/AboutHackordSection";
import { HomeNavbar } from "@/components/HomeNavbar";
import { HomeFooter } from "@/components/HomeFooter";

import { ScrollSequence } from "@/components/ScrollSequence";

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
  return (
    <div className="relative min-h-screen bg-[#060813] text-foreground flex flex-col justify-between">
      {/* Desktop-only Cinematic Background Scroll Reveal Effect */}
      <ScrollSequence frameCount={204} />

      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        {/* Header */}
        <HomeNavbar />

      {/* Hero Section */}
      <section className="relative  max-w-8xl px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 overflow-hidden lg:overflow-visible">
        <Suspense fallback={<div className="absolute inset-0 bg-transparent" />}>
          <HeroBackground />
        </Suspense>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-black-200 animate-fade-in">
              <span>The Intelligence Engine for Hackathons & Developers</span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white animate-fade-in animate-delay-100">
              Ship faster <br />
              <span className="text-white drop-shadow-sm">
                with <AnimatedRole roles={["AI.", "Confidence.", "Hackord."]} />
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-xl text-base sm:text-xl text-slate-300 leading-relaxed animate-fade-in animate-delay-200">
              <strong className="text-white font-semibold">Hackord</strong> is the private workspace platform for elite hackathon teams. Host HD audio/video meetings, manage tasks, track live GitHub repositories, and collaborate in real-time.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4 animate-fade-in animate-delay-300">
              <Link
                to="/signup"
                className="group relative rounded-xl px-8 py-3 text-center font-semibold text-slate-950 transition-all hover:scale-105 active:scale-95 shadow-card"
              >
                <div className="absolute inset-0 rounded-xl bg-white group-hover:bg-white/90 transition-colors" />
                <span className="relative">Create a workspace</span>
              </Link>
              <Link
                to="/explore"
                className="rounded-xl bg-white/10 dark:bg-card/45 backdrop-blur-2xl border border-white/20 dark:border-border px-8 py-3 text-center font-semibold text-white dark:text-foreground transition hover:bg-white/20 dark:hover:bg-card hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-card"
              >
                <Compass className="h-4 w-4 text-primary" />
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
      <HomeFooter />
      </div>
    </div>
  );
}
