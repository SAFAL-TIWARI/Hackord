import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Users2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ROOMS } from "@/lib/dummy-data";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "My Rooms — HackDiscord" }] }),
  component: RoomsLayout,
});

function RoomsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/rooms";
  if (isChild) return <Outlet />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">Private workspaces you're part of.</p>
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
                  <h3 className="mt-1 text-lg font-semibold">{r.name}</h3>
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
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users2 className="h-3 w-3" />
                  {r.members.length}/{r.maxSize}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
