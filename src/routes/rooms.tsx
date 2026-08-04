import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Users2, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomSkeleton } from "@/components/RoomSkeleton";
import { getRooms, deleteRoom, type DbRoom } from "@/lib/rooms-api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "My Rooms — Hackord" }] }),
  pendingComponent: RoomSkeleton,
  loader: () => getRooms(),
  component: RoomsLayout,
});

function RoomsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const initialRooms = Route.useLoaderData();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);
  const [rooms, setRooms] = useState<DbRoom[]>(initialRooms || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (authLoading) return;

    setLoading(true);
    if (user) {
      getRooms({
        userId: user._id,
        email: user.email,
        userName: user.name,
      })
        .then((res) => {
          if (mounted && res) setRooms(res);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      getRooms({ all: true })
        .then((res) => {
          if (mounted) setRooms(res || []);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const isRoomOwnerOrAdmin = (r: DbRoom) => {
    if (!user) return true;
    if (user.role === "admin") return true;
    const userIds = [user._id, user.username, user.email?.toLowerCase()].filter(Boolean);
    if (r.creator_id && userIds.includes(String(r.creator_id))) return true;
    if (r.creator_email && user.email && r.creator_email.toLowerCase() === user.email.toLowerCase()) return true;
    if (Array.isArray(r.members) && r.members.length > 0) {
      const ownerMember = r.members.find((m) => m && m.role === "Owner") || r.members[0];
      const oId = String(ownerMember.user_id || "").toLowerCase();
      const oName = String(ownerMember.user_name || "").toLowerCase();
      if (userIds.some((id) => String(id).toLowerCase() === oId) || (user.name && user.name.toLowerCase() === oName)) {
        return true;
      }
    }
    return false;
  };

  const handleDeleteRoom = async (roomId: string, roomName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${roomName}"?`)) return;
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast.success(`Room "${roomName}" deleted successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete room");
    }
  };

  const isChild = pathname !== "/rooms";
  if (isChild) return <Outlet />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">Private workspaces you're part of.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 shadow-card space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-5 w-44" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex -space-x-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
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
                className="group glass rounded-2xl p-5 shadow-card transition hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{r.hackathon}</p>
                      <h3 className="mt-1 text-lg font-semibold group-hover:text-gradient-brand">{r.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">{r.status}</Badge>
                      {isRoomOwnerOrAdmin(r) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteRoom(r.id, r.name, e)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Room"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{r.problem}</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40">
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
