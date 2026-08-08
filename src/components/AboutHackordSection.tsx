import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Video,
  Code2,
  Users,
  Rocket,
  ShieldCheck,
  Zap,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Mic,
  MicOff,
  VideoOff,
  MessageSquare,
  Trophy,
  Activity,
  Layers,
} from "lucide-react";

interface FeaturePillar {
  id: string;
  title: string;
  shortDesc: string;
  detailedDesc: string;
  icon: React.ElementType;
  tagline: string;
  badge: string;
  stats: string;
}

const FEATURES: FeaturePillar[] = [
  {
    id: "video-rooms",
    title: "Real-Time HD Video Rooms",
    shortDesc: "Host virtual project rooms with Agora voice & video RTC, instant chat, and presence.",
    detailedDesc:
      "Hackord provides dedicated team workspaces equipped with crystal-clear HD audio/video calls powered by Agora RTC. Brainstorm, pair-program, and present live to hackathon judges without leaving your browser.",
    icon: Video,
    tagline: "Agora RTC Powered • Encrypted HD Audio & Video",
    badge: "Live Audio/Video",
    stats: "< 100ms Global Latency",
  },
  {
    id: "hackathon-discovery",
    title: "Hackathon Discovery Engine",
    shortDesc: "Discover global hackathons, track registration deadlines, and join active project teams.",
    detailedDesc:
      "Never miss a deadline. Explore curated hackathons worldwide, filter by track prizes and tech stacks, bookmark upcoming events, and find like-minded team members with matching skillsets.",
    icon: Rocket,
    tagline: "Global Events • Prize Pools • Team Matchmaking",
    badge: "Smart Discovery",
    stats: "Live Countdown & Alerts",
  },
  {
    id: "github-intelligence",
    title: "GitHub Intelligence & Sync",
    shortDesc: "Connect GitHub repositories to track live commit stats, pull requests, and activity.",
    detailedDesc:
      "Keep your entire team aligned. Connect your GitHub repository to stream real-time commit activity, pull request status, and developer contribution heatmaps directly inside your project room.",
    icon: Code2,
    tagline: "Live Repo Sync • Commit Feeds • Pull Request Status",
    badge: "Developer Engine",
    stats: "Automated PR Analytics",
  },
  {
    id: "team-control",
    title: "Team & Task Milestone Control",
    shortDesc: "Organize Kanban task boards, assign roles, track milestones, and trigger alerts.",
    detailedDesc:
      "Streamline project execution during high-stakes hackathons. Manage team milestones, assign tasks by specialty (Frontend, Backend, AI, Design), and trigger instant email/in-app notifications.",
    icon: Users,
    tagline: "Kanban Milestone Control • Role Assignment • Email Alerts",
    badge: "Task Orchestrator",
    stats: "Real-Time Sync",
  },
];

export function AboutHackordSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate tabs every 6 seconds unless user hovers/interacts
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeFeature = FEATURES[activeIndex];
  const IconComponent = activeFeature.icon;

  return (
    <section
      id="about-hackord"
      className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28 border-t border-white/10 dark:border-white/5 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Glow Orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold text-primary shadow-glow">
          <ShieldCheck className="h-4 w-4" />
          <span>Purpose & Core Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          What is <span className="text-gradient-brand">Hackord</span>?
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Hackord</strong> is an all-in-one developer workspace and collaboration platform built for hackathon participants, software engineers, and project teams to build and ship software together.
        </p>
      </div>

      {/* Interactive Stage Selector Tabs */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 relative z-10">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon;
          const isActive = idx === activeIndex;
          return (
            <button
              key={feat.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-gradient-brand text-white shadow-glow scale-105 ring-2 ring-primary/40"
                  : "glass text-muted-foreground hover:text-foreground hover:bg-card/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white animate-pulse" : "text-primary"}`} />
              <span>{feat.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3D Perspective Interactive Canvas Container */}
      <div className="mt-12 grid lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Feature Breakdown Accordion List */}
        <div className="lg:col-span-5 space-y-4">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            const isActive = idx === activeIndex;

            return (
              <div
                key={feat.id}
                onClick={() => setActiveIndex(idx)}
                className={`group cursor-pointer rounded-2xl p-5 transition-all duration-300 border ${
                  isActive
                    ? "glass-strong border-primary/50 shadow-[0_10px_30px_-10px_var(--color-primary)] ring-1 ring-primary/30"
                    : "glass border-border/50 hover:border-border hover:bg-card/40 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                      isActive
                        ? "bg-gradient-brand text-white shadow-glow scale-110"
                        : "bg-primary/10 text-primary group-hover:scale-105"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-base font-semibold transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {feat.title}
                      </h3>
                      {isActive && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20 shrink-0">
                          {feat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isActive ? feat.detailedDesc : feat.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Progress bar animation for active tab */}
                {isActive && (
                  <div className="mt-4 h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      key={activeIndex}
                      className="h-full bg-gradient-brand transition-all duration-[6000ms] ease-linear"
                      style={{ width: isPaused ? "100%" : "100%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: 3D Stage Viewport Simulator */}
        <div className="lg:col-span-7 relative group">
          {/* Ambient Card Backlight Aura */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 via-indigo-500/20 to-purple-500/30 blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* 3D Tilted Glass Canvas Window */}
          <div className="relative rounded-3xl border border-white/15 dark:border-white/10 bg-card/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl transition-all duration-700 transform lg:perspective-[1000px] lg:rotate-x-2 lg:-rotate-y-2 group-hover:rotate-x-0 group-hover:rotate-y-0 group-hover:scale-[1.01]">
            {/* Stage Top Header Bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">
                  hackord://workspace/{activeFeature.id}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{activeFeature.stats}</span>
              </div>
            </div>

            {/* Dynamic Stage Canvas View per Active Feature */}
            <div className="min-h-[320px] flex flex-col justify-between">
              {/* STAGE 0: Video Rooms Simulation */}
              {activeIndex === 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-primary/30 p-3 flex flex-col justify-between shadow-lg">
                      <div className="flex justify-between items-center z-10">
                        <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] text-white font-medium">
                          Alex Rivera (Lead Dev)
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/40 to-indigo-900/30 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-primary/30 border border-primary flex items-center justify-center text-white font-bold text-lg shadow-glow">
                          AR
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 z-10">
                        <div className="flex gap-0.5 items-end h-3">
                          <span className="w-1 bg-emerald-400 h-2 animate-bounce" />
                          <span className="w-1 bg-emerald-400 h-3 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 bg-emerald-400 h-1.5 animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-[10px] text-emerald-300 font-mono">Audio Speaking</span>
                      </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-border p-3 flex flex-col justify-between shadow-lg">
                      <div className="flex justify-between items-center z-10">
                        <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] text-white font-medium">
                          Sophia Lin (UI/UX)
                        </span>
                        <MicOff className="h-3 w-3 text-red-400" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-200 font-bold text-lg">
                          SL
                        </div>
                      </div>
                      <div className="z-10">
                        <span className="text-[10px] text-muted-foreground font-mono">Mic Muted</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Active Info Pill */}
                  <div className="rounded-xl border border-border bg-card/60 p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Agora RTC Room Channel Active</p>
                        <p className="text-[11px] text-muted-foreground">High fidelity 1080p stream with sub-100ms latency</p>
                      </div>
                    </div>
                    <Link
                      to="/signup"
                      className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-white shadow-glow hover:opacity-90 shrink-0"
                    >
                      Join Room
                    </Link>
                  </div>
                </div>
              )}

              {/* STAGE 1: Hackathon Discovery Simulation */}
              {activeIndex === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-primary/5 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-3 py-0.5 text-xs font-semibold">
                        Featured Global Hackathon
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" /> $75,000 Prize Pool
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-foreground">AI Innovation World Hackathon 2026</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Build next-gen autonomous AI agents & developer tools. Connect with team members on Hackord.
                      </p>
                    </div>

                    {/* Countdown Simulation */}
                    <div className="grid grid-cols-4 gap-2 text-center pt-2">
                      <div className="rounded-xl bg-background/80 p-2 border border-border">
                        <span className="text-lg font-bold text-primary font-mono">04</span>
                        <span className="block text-[10px] text-muted-foreground uppercase">Days</span>
                      </div>
                      <div className="rounded-xl bg-background/80 p-2 border border-border">
                        <span className="text-lg font-bold text-primary font-mono">18</span>
                        <span className="block text-[10px] text-muted-foreground uppercase">Hours</span>
                      </div>
                      <div className="rounded-xl bg-background/80 p-2 border border-border">
                        <span className="text-lg font-bold text-primary font-mono">32</span>
                        <span className="block text-[10px] text-muted-foreground uppercase">Mins</span>
                      </div>
                      <div className="rounded-xl bg-background/80 p-2 border border-border">
                        <span className="text-lg font-bold text-primary font-mono">14</span>
                        <span className="block text-[10px] text-muted-foreground uppercase">Secs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/explore"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Explore all active hackathons <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* STAGE 2: GitHub Intelligence Simulation */}
              {activeIndex === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-purple-400" />
                        SAFAL-TIWARI/Hackord (main branch)
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 100% Synced
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-slate-400">
                        <span className="text-emerald-400">commit 9f42a18</span> — Add Agora RTC audio/video stream hooks
                      </p>
                      <p className="text-slate-400">
                        <span className="text-purple-400">PR #14</span> — Integrated real-time room notifications & OAuth
                      </p>
                      <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-emerald-300">
                        <code>$ git push origin main --tags</code>
                        <p className="text-[10px] text-slate-400 mt-1">✓ Build passed • Deployment live on hackord.vercel.app</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/60 p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Connected GitHub Repositories: <strong>12 active repos</strong></span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Live Pull Request Sync
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 3: Team Control Simulation */}
              {activeIndex === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To Do (2)</span>
                      <div className="rounded-lg bg-background p-2.5 border border-border text-xs font-medium space-y-1 shadow-sm">
                        <p className="text-foreground">Design Pitch Deck</p>
                        <span className="inline-block rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] text-indigo-400 font-semibold">Design</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">In Progress (3)</span>
                      <div className="rounded-lg bg-background p-2.5 border border-primary/40 text-xs font-medium space-y-1 shadow-sm">
                        <p className="text-foreground">Agora Video Integration</p>
                        <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400 font-semibold">Backend</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Done (8)</span>
                      <div className="rounded-lg bg-background p-2.5 border border-border text-xs font-medium space-y-1 shadow-sm opacity-80">
                        <p className="text-foreground line-through">OAuth Authentication</p>
                        <span className="inline-block rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400 font-semibold">Auth</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/60 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-foreground">Project Completion Progress</span>
                    </div>
                    <span className="text-xs font-bold text-primary font-mono">82% Complete</span>
                  </div>
                </div>
              )}

              {/* Stage Bottom Tagline Bar */}
              <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{activeFeature.tagline}</span>
                <Link to="/signup" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                  Try Hackord Free <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Key Pillars Grid */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <div className="glass-strong rounded-2xl p-4 text-center space-y-1 border border-border/60">
          <span className="text-xl font-bold text-gradient-brand font-mono">&lt; 100ms</span>
          <p className="text-xs text-muted-foreground font-medium">Agora RTC Voice/Video</p>
        </div>
        <div className="glass-strong rounded-2xl p-4 text-center space-y-1 border border-border/60">
          <span className="text-xl font-bold text-gradient-brand font-mono">100% Free</span>
          <p className="text-xs text-muted-foreground font-medium">Developer Workspaces</p>
        </div>
        <div className="glass-strong rounded-2xl p-4 text-center space-y-1 border border-border/60">
          <span className="text-xl font-bold text-gradient-brand font-mono">GitHub Sync</span>
          <p className="text-xs text-muted-foreground font-medium">Real-time Commit Feeds</p>
        </div>
        <div className="glass-strong rounded-2xl p-4 text-center space-y-1 border border-border/60">
          <span className="text-xl font-bold text-gradient-brand font-mono">OAuth 2.0</span>
          <p className="text-xs text-muted-foreground font-medium">Google & GitHub Auth</p>
        </div>
      </div>
    </section>
  );
}
