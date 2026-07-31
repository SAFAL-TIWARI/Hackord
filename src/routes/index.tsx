import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Users, Github, Calendar, MessageSquare, Bot } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Hackord</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
          Private hackathon workspaces
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Ship your hackathon in one{" "}
          <span className="text-gradient-brand">focused workspace.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Invite teammates by skill, manage deadlines, chat, share files, run AI tools,
          and hit submission — all inside a private room designed for hackathon teams.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-lg bg-gradient-brand px-5 py-3 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
          >
            Create a workspace
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium transition hover:bg-accent"
          >
            Live demo
          </Link>
        </div>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, title: "Invite by skill", desc: "Search by skill, college, city or experience and invite in one tap." },
            { icon: Calendar, title: "Deadline-aware", desc: "Registration, PPT, prototype, final — every date, one timeline." },
            { icon: MessageSquare, title: "Team chat", desc: "Threads, code blocks, files, pinned messages — built for builders." },
            { icon: Github, title: "GitHub integration", desc: "Repos, PRs, issues and commits inside your room." },
            { icon: Bot, title: "AI workspace", desc: "PPT, README, pitch, architecture — generated on demand." },
            { icon: Sparkles, title: "Feels premium", desc: "Linear-fast, Notion-clean, Discord-lively." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5 shadow-card animate-fade-in">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand-soft">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
