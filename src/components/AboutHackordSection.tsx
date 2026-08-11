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
      className="relative mx-auto max-w-7xl px-3 sm:px-6 py-12 sm:py-28 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Glow Orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 relative z-10 px-2">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-xs font-semibold text-primary shadow-glow">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Purpose & Core Architecture</span>
        </div>
        <h2 className="text-2.5xl sm:text-5xl font-bold tracking-tight text-foreground">
          What is <span className="text-gradient-brand">Hackord</span>?
        </h2>
        <p className="text-xs sm:text-lg text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Hackord</strong> is an all-in-one developer workspace and collaboration platform built for hackathon participants, software engineers, and project teams to build and ship software together.
        </p>
      </div>

      {/* Interactive Stage Selector Tabs */}
      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 relative z-10 max-w-full px-1">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon;
          const isActive = idx === activeIndex;
          return (
            <button
              key={feat.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-gradient-brand text-white shadow-glow scale-105 ring-2 ring-primary/40"
                  : "glass text-muted-foreground hover:text-foreground hover:bg-card/60"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isActive ? "text-white animate-pulse" : "text-primary"}`} />
              <span className="whitespace-nowrap">{feat.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3D Perspective Interactive Canvas Container */}
      <div className="mt-8 sm:mt-12 grid lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
        {/* Left Column: Feature Breakdown Accordion List */}
        <div className="lg:col-span-5 space-y-3 sm:space-y-4">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            const isActive = idx === activeIndex;

            return (
              <div
                key={feat.id}
                onClick={() => setActiveIndex(idx)}
                className={`group cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-5 transition-all duration-300 border ${
                  isActive
                    ? "glass-strong border-primary/50 shadow-[0_10px_30px_-10px_var(--color-primary)] ring-1 ring-primary/30"
                    : "glass border-border/50 hover:border-border hover:bg-card/40 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                      isActive
                        ? "bg-gradient-brand text-white shadow-glow scale-105 sm:scale-110"
                        : "bg-primary/10 text-primary group-hover:scale-105"
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                      <h3
                        className={`text-sm sm:text-base font-semibold transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {feat.title}
                      </h3>
                      {isActive && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary border border-primary/20 shrink-0">
                          {feat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                      {isActive ? feat.detailedDesc : feat.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Progress bar animation for active tab */}
                {isActive && (
                  <div className="mt-3 sm:mt-4 h-1 w-full bg-muted/40 rounded-full overflow-hidden">
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
        <div className="lg:col-span-7 relative group min-w-0">
          {/* Ambient Card Backlight Aura */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 via-indigo-500/20 to-purple-500/30 blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* 3D Tilted Glass Canvas Window */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-border bg-card/30 backdrop-blur-2xl p-4 sm:p-8 shadow-card hover:shadow-spatial transition-all duration-700 transform lg:perspective-[1000px] lg:rotate-x-2 lg:-rotate-y-2 group-hover:rotate-x-0 group-hover:rotate-y-0 group-hover:scale-[1.01] overflow-hidden">
            {/* Stage Top Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 sm:pb-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/80 shrink-0" />
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/80 shrink-0" />
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/80 shrink-0" />
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs font-mono text-muted-foreground truncate max-w-[130px] sm:max-w-none">
                  hackord://workspace/{activeFeature.id}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-primary/10 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-primary border border-primary/20 shrink-0">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{activeFeature.stats}</span>
              </div>
            </div>

            {/* Dynamic Stage Canvas View per Active Feature */}
            <div className="min-h-[280px] sm:min-h-[320px] flex flex-col justify-between">
              {/* STAGE 0: Video Rooms Simulation */}
              {activeIndex === 0 && (
                <div className="space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-video bg-slate-900 border border-primary/30 p-3 flex flex-col justify-between shadow-lg">
                      <div className="flex justify-between items-center z-10">
                        <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] text-white font-medium truncate max-w-[120px]">
                          Alex Rivera (Lead Dev)
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/40 to-indigo-900/30 flex items-center justify-center">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/30 border border-primary flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-glow">
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

                    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-video bg-slate-900 border border-border p-3 flex flex-col justify-between shadow-lg">
                      <div className="flex justify-between items-center z-10">
                        <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] text-white font-medium truncate max-w-[120px]">
                          Sophia Lin (UI/UX)
                        </span>
                        <MicOff className="h-3 w-3 text-red-400" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-200 font-bold text-base sm:text-lg">
                          SL
                        </div>
                      </div>
                      <div className="z-10">
                        <span className="text-[10px] text-muted-foreground font-mono">Mic Muted</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Active Info Pill */}
                  <div className="rounded-xl border border-border bg-card/60 p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Agora RTC Room Channel Active</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">High fidelity 1080p stream with sub-100ms latency</p>
                      </div>
                    </div>
                    <Link
                      to="/signup"
                      className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-white shadow-glow hover:opacity-90 shrink-0 w-full sm:w-auto text-center"
                    >
                      Join Room
                    </Link>
                  </div>
                </div>
              )}

              {/* STAGE 1: Hackathon Discovery Simulation */}
              {activeIndex === 1 && (
                <div className="space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-primary/5 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2.5 sm:px-3 py-0.5 text-xs font-semibold">
                        Featured Global Hackathon
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 shrink-0" /> $75,000 Prize Pool
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-xl font-bold text-foreground">AI Innovation World Hackathon 2026</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Build next-gen autonomous AI agents & developer tools. Connect with team members on Hackord.
                      </p>
                    </div>

                    {/* Countdown Simulation */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center pt-1 sm:pt-2">
                      <div className="rounded-lg sm:rounded-xl bg-background/80 p-1.5 sm:p-2 border border-border">
                        <span className="text-sm sm:text-lg font-bold text-primary font-mono block">04</span>
                        <span className="block text-[9px] sm:text-[10px] text-muted-foreground uppercase">Days</span>
                      </div>
                      <div className="rounded-lg sm:rounded-xl bg-background/80 p-1.5 sm:p-2 border border-border">
                        <span className="text-sm sm:text-lg font-bold text-primary font-mono block">18</span>
                        <span className="block text-[9px] sm:text-[10px] text-muted-foreground uppercase">Hours</span>
                      </div>
                      <div className="rounded-lg sm:rounded-xl bg-background/80 p-1.5 sm:p-2 border border-border">
                        <span className="text-sm sm:text-lg font-bold text-primary font-mono block">32</span>
                        <span className="block text-[9px] sm:text-[10px] text-muted-foreground uppercase">Mins</span>
                      </div>
                      <div className="rounded-lg sm:rounded-xl bg-background/80 p-1.5 sm:p-2 border border-border">
                        <span className="text-sm sm:text-lg font-bold text-primary font-mono block">14</span>
                        <span className="block text-[9px] sm:text-[10px] text-muted-foreground uppercase">Secs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/explore"
                      className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Explore all active hackathons <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* STAGE 2: GitHub Intelligence Simulation */}
              {activeIndex === 2 && (
                <div className="space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="rounded-xl sm:rounded-2xl border border-border bg-slate-950 p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-slate-200 shadow-xl space-y-2.5 overflow-x-auto">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 sm:gap-2 truncate max-w-[180px] sm:max-w-none">
                        <Code2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        SAFAL-TIWARI/Hackord (main branch)
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 100% Synced
                      </span>
                    </div>

                    <div className="space-y-2 leading-relaxed">
                      <p className="text-slate-400 break-words">
                        <span className="text-emerald-400">commit 9f42a18</span> — Add Agora RTC audio/video stream hooks
                      </p>
                      <p className="text-slate-400 break-words">
                        <span className="text-purple-400">PR #14</span> — Integrated real-time room notifications & OAuth
                      </p>
                      <div className="rounded-lg bg-slate-900 p-2 sm:p-2.5 border border-slate-800 text-emerald-300">
                        <code>$ git push origin main --tags</code>
                        <p className="text-[10px] text-slate-400 mt-1">✓ Build passed • Deployment live on hackord.vercel.app</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/60 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">Connected GitHub Repositories: <strong className="text-foreground">12 active repos</strong></span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 shrink-0">
                      Live Pull Request Sync
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 3: Team Control Simulation */}
              {activeIndex === 3 && (
                <div className="space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="rounded-xl border border-border bg-card/60 p-2.5 sm:p-3 space-y-2">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To Do (2)</span>
                      <div className="rounded-lg bg-background p-2 sm:p-2.5 border border-border text-xs font-medium space-y-1 shadow-sm">
                        <p className="text-foreground truncate">Design Pitch Deck</p>
                        <span className="inline-block rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] text-indigo-400 font-semibold">Design</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5 sm:p-3 space-y-2">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-wider">In Progress (3)</span>
                      <div className="rounded-lg bg-background p-2 sm:p-2.5 border border-primary/40 text-xs font-medium space-y-1 shadow-sm">
                        <p className="text-foreground truncate">Agora Video Integration</p>
                        <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400 font-semibold">Backend</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/60 p-2.5 sm:p-3 space-y-2">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Done (8)</span>
                      <div className="rounded-lg bg-background p-2 sm:p-2.5 border border-border text-xs font-medium space-y-1 shadow-sm opacity-80">
                        <p className="text-foreground line-through truncate">OAuth Authentication</p>
                        <span className="inline-block rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400 font-semibold">Auth</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/60 p-3 sm:p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground">Project Completion Progress</span>
                    </div>
                    <span className="text-xs font-bold text-primary font-mono shrink-0">82% Complete</span>
                  </div>
                </div>
              )}

              {/* Stage Bottom Tagline Bar */}
              <div className="mt-4 sm:mt-6 border-t border-border/60 pt-3 sm:pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground break-words">{activeFeature.tagline}</span>
                <Link to="/signup" className="text-primary font-medium hover:underline inline-flex items-center gap-1 shrink-0">
                  Try Hackord Free <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Key Pillars Grid */}
      <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
        <div className="glass-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center space-y-1 border border-border/60 min-w-0">
          <span className="text-base sm:text-xl font-bold text-gradient-brand font-mono truncate block">&lt; 100ms</span>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate block">Agora RTC Voice/Video</p>
        </div>
        <div className="glass-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center space-y-1 border border-border/60 min-w-0">
          <span className="text-base sm:text-xl font-bold text-gradient-brand font-mono truncate block">100% Free</span>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate block">Developer Workspaces</p>
        </div>
        <div className="glass-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center space-y-1 border border-border/60 min-w-0">
          <span className="text-base sm:text-xl font-bold text-gradient-brand font-mono truncate block">GitHub Sync</span>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate block">Real-time Commit Feeds</p>
        </div>
        <div className="glass-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center space-y-1 border border-border/60 min-w-0">
          <span className="text-base sm:text-xl font-bold text-gradient-brand font-mono truncate block">OAuth 2.0</span>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate block">Google & GitHub Auth</p>
        </div>
      </div>
    </section>
  );
}
