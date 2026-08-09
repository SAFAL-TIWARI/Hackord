import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Layers3, ArrowUpRight, Plus, Users2 } from "lucide-react";
import { SpotlightCard } from "@/components/SpotlightCard";
import { getRooms, type DbRoom } from "@/lib/rooms-api";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function FeaturedRooms() {
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms({ all: true })
      .then((res) => setRooms(res || []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Layers3 className="h-3.5 w-3.5" />
            <span>Active Platform Workspaces</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Featured Hackathon Rooms</h2>
          <p className="text-sm text-muted-foreground mt-1">Join an active project team or create your own room in seconds.</p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <span>View all rooms in Dashboard</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* CREATE NEW ROOM CARD */}
        <SpotlightCard className="group relative flex flex-col justify-between rounded-2xl border-2 border-dashed border-primary/40 bg-card/30 p-6 transition-all duration-300 hover:border-primary hover:bg-card/55 hover:shadow-glow cursor-pointer">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow transition-transform duration-300 group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary transition-colors">+ Create New Room</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Start a team workspace for your next hackathon. Set project goals, invite teammates, and auto-generate pitch decks.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary ring-1 ring-primary/20 transition-all hover:bg-primary hover:text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Room Now</span>
          </Link>
        </SpotlightCard>

        {/* DYNAMIC REAL ROOMS */}
        {rooms.slice(0, 3).map((r) => (
          <SpotlightCard key={r.id} className="flex flex-col justify-between rounded-2xl bg-card/30 backdrop-blur-xl p-6 border border-border shadow-card hover:shadow-spatial hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">
                  {r.status}
                </Badge>
                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[120px]">
                  {r.hackathon}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground truncate">{r.name}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {r.problem || r.description || "No description provided."}
              </p>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span className="font-mono text-emerald-500 dark:text-emerald-400">{r.progress || 0}% Complete</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${r.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 flex items-center justify-between">
              <div className="flex -space-x-2">
                {(r.members ?? []).slice(0, 3).map((m) => (
                  <Avatar key={m.user_id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={m.user_avatar} />
                    <AvatarFallback>{m.user_name?.[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Link
                to="/rooms/$roomId"
                params={{ roomId: r.id }}
                className="rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
              >
                View Room →
              </Link>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
