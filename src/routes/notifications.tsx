import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Inbox, Github, MessageSquare, Video, UserPlus, CalendarClock, Layers3, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRealNotifications, type RealNotification } from "@/lib/notifications-api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Hackord" }] }),
  component: NotificationsPage,
});

const iconFor = (t: string) =>
  t === "invite" ? Inbox : t === "meeting" ? Video : t === "chat" || t === "message" ? MessageSquare :
    t === "deadline" ? CalendarClock : t === "github" ? Github : t === "member" || t === "activity" ? UserPlus : Bell;

function NotificationsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<RealNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (authLoading) return;

    setLoading(true);
    fetchRealNotifications(user)
      .then((res) => {
        if (mounted) setList(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const markAllRead = () => {
    const updated = list.map((n) => ({ ...n, unread: false }));
    setList(updated);
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (n: RealNotification) => {
    setList((prev) => prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)));
    const targetLink = n.link || "/dashboard";
    navigate({ to: targetLink as any });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Real-time updates, deadlines, and room invitations across your platform account.</p>
          </div>
          {list.some((n) => n.unread) && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="glass rounded-2xl p-2 shadow-card min-h-[300px]">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/40">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full max-w-md" />
                  </div>
                  <Skeleton className="h-3 w-12 shrink-0" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
              <Bell className="h-10 w-10 opacity-20" />
              <p className="text-base font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground">When you receive room invites or hit hackathon deadlines, they will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              <ul className="divide-y divide-border">
                {list.map((n) => {
                  const Icon = iconFor(n.type);
                  return (
                    <li
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="group flex items-start gap-3 p-4 cursor-pointer hover:bg-card/70 transition rounded-xl"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand-soft text-primary shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium group-hover:text-primary transition">{n.title}</p>
                          {n.unread && <Badge className="bg-gradient-brand text-white border-transparent text-[10px]">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{n.time}</span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
