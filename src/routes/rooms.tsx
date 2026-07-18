import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Users2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getRooms } from "@/lib/rooms-api";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "My Rooms — HackDiscord" }] }),
  loader: () => getRooms(),
  component: RoomsLayout,
});

function RoomsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/rooms";
  if (isChild) return <Outlet />;

  const rooms = Route.useLoaderData();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">Private workspaces you're part of.</p>
        </div>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold">No rooms yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first hackathon workspace.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((r) => (
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
                    {(r.members ?? []).slice(0, 4).map((m) => (
                      <Avatar key={m.user_id} className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={m.user_avatar} />
                        <AvatarFallback>{m.user_name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users2 className="h-3 w-3" />
                    {r.member_count ?? (r.members?.length ?? 0)}/{r.max_size}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
