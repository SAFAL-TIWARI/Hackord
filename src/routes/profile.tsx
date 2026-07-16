import { createFileRoute } from "@tanstack/react-router";
import { Github, Linkedin, Globe, GraduationCap, MapPin, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CURRENT_USER, ROOMS, SKILLS } from "@/lib/dummy-data";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — HackDiscord" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const u = CURRENT_USER;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 border-4 border-background shadow-glow">
              <AvatarImage src={u.avatar} />
              <AvatarFallback>{u.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">{u.name}</h1>
              <p className="text-sm text-muted-foreground">@{u.username}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {u.college}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {u.city}, {u.country}</span>
                <Badge variant="secondary">{u.experience}</Badge>
              </div>
            </div>
            <Button variant="outline"><Pencil className="h-4 w-4" /> Edit</Button>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
            Building useful things at hackathons. Focused on developer tooling and thoughtful UI.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {SKILLS.slice(0, 8).map((s) => (
                <Badge key={s} className="border-transparent bg-gradient-brand-soft text-foreground">{s}</Badge>
              ))}
            </div>
            <h2 className="mt-8 mb-4 text-lg font-semibold">Current rooms</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROOMS.map((r) => (
                <div key={r.id} className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <p className="text-xs text-muted-foreground">{r.hackathon}</p>
                  <p className="mt-1 font-medium">{r.name}</p>
                </div>
              ))}
            </div>
            <h2 className="mt-8 mb-4 text-lg font-semibold">Completed hackathons</h2>
            <ul className="space-y-2 text-sm">
              {[
                { name: "HackMIT 2025", result: "Top 10" },
                { name: "ETHIndia 2024", result: "Finalist" },
                { name: "Smart India 2024", result: "Winner" },
              ].map((h) => (
                <li key={h.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 p-3">
                  <span>{h.name}</span>
                  <Badge variant="secondary">{h.result}</Badge>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rounded-2xl p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold">Links</h2>
            <ul className="space-y-3 text-sm">
              <li><a className="inline-flex items-center gap-2 hover:text-foreground text-muted-foreground" href={u.github}><Github className="h-4 w-4" /> GitHub</a></li>
              <li><a className="inline-flex items-center gap-2 hover:text-foreground text-muted-foreground" href={u.linkedin}><Linkedin className="h-4 w-4" /> LinkedIn</a></li>
              <li><a className="inline-flex items-center gap-2 hover:text-foreground text-muted-foreground" href="#"><Globe className="h-4 w-4" /> Portfolio</a></li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
