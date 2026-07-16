import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  Inbox,
  Users2,
  Layers3,
  Sparkles,
  Check,
  X,
  ArrowUpRight,
  Bell,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CURRENT_USER,
  INVITATIONS,
  NOTIFICATIONS,
  ROOMS,
} from "@/lib/dummy-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HackDiscord" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const stats = [
    { label: "Total Rooms", value: ROOMS.length, icon: Layers3 },
    { label: "Active Rooms", value: ROOMS.filter((r) => r.status === "Active").length, icon: Sparkles },
    { label: "Pending Invitations", value: INVITATIONS.length, icon: Inbox },
    { label: "Upcoming Deadlines", value: 4, icon: CalendarClock },
  ];
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome */}
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                Hey {CURRENT_USER.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                You have {INVITATIONS.length} pending invitations and 1 deadline this week.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/rooms/$roomId"
                params={{ roomId: ROOMS[0].id }}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-accent"
              >
                Open {ROOMS[0].name}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand-soft">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold">{s.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Deadlines */}
          <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
              <Badge variant="secondary">This month</Badge>
            </div>
            <ul className="space-y-3">
              {[
                { title: "PPT Submission", room: "Team Nebula", date: "Aug 15", urgency: "warning" },
                { title: "Prototype Submission", room: "Team Nebula", date: "Sep 01", urgency: "muted" },
                { title: "Registration closes", room: "ChainCraft", date: "Jul 25", urgency: "danger" },
                { title: "Result declaration", room: "Team Nebula", date: "Oct 05", urgency: "muted" },
              ].map((d) => (
                <li key={d.title} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={
                      "grid h-10 w-10 place-items-center rounded-lg " +
                      (d.urgency === "danger" ? "bg-destructive/15 text-destructive"
                       : d.urgency === "warning" ? "bg-warning/15 text-warning"
                       : "bg-gradient-brand-soft text-primary")
                    }>
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.room}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{d.date}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Invitations */}
          <section className="glass rounded-2xl p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold">Pending invitations</h2>
            <div className="space-y-3">
              {INVITATIONS.map((i) => (
                <div key={i.id} className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={i.sender.avatar} />
                      <AvatarFallback>{i.sender.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.roomName}</p>
                      <p className="truncate text-xs text-muted-foreground">{i.hackathon}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">"{i.message}"</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-brand text-white shadow-glow hover:opacity-90">
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <section className="glass rounded-2xl p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
            <ul className="space-y-3">
              {[
                { who: "Priya", what: "uploaded Pitch-Deck-v2.pptx", when: "1h ago" },
                { who: "Rohan", what: "opened PR #24 – Add crop yield model v1", when: "3h ago" },
                { who: "Ishita", what: "connected repo team-nebula/farmyield", when: "6h ago" },
                { who: "Aarav", what: "completed 'Landing page'", when: "1d ago" },
              ].map((a, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand-soft text-xs font-semibold text-primary">
                    {a.who[0]}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.when}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Notifications */}
          <section className="glass rounded-2xl p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent notifications</h2>
              <Link to="/notifications" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="space-y-3">
              {NOTIFICATIONS.slice(0, 5).map((n) => (
                <li key={n.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand-soft text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* My Rooms preview */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My rooms</h2>
            <Link to="/rooms" className="text-sm text-muted-foreground hover:text-foreground">See all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ROOMS.map((r) => (
              <Link
                key={r.id}
                to="/rooms/$roomId"
                params={{ roomId: r.id }}
                className="group glass rounded-2xl p-5 shadow-card transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{r.hackathon}</p>
                    <h3 className="mt-1 text-lg font-semibold group-hover:text-gradient-brand">{r.name}</h3>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{r.problem}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {r.members.slice(0, 4).map((m) => (
                      <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback>{m.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Users2 className="h-3 w-3" />
                    {r.members.length}/{r.maxSize}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
