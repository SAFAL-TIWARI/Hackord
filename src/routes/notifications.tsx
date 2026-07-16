import { createFileRoute } from "@tanstack/react-router";
import { Bell, Inbox, Github, MessageSquare, Video, UserPlus, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { NOTIFICATIONS } from "@/lib/dummy-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HackDiscord" }] }),
  component: NotificationsPage,
});

const iconFor = (t: string) =>
  t === "invite" ? Inbox : t === "meeting" ? Video : t === "chat" ? MessageSquare :
  t === "submission" ? CalendarClock : t === "github" ? Github : t === "member" ? UserPlus : Bell;

function NotificationsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything that's happened across your rooms.</p>
        </div>
        <div className="glass rounded-2xl p-2 shadow-card">
          <ul className="divide-y divide-border">
            {NOTIFICATIONS.map((n) => {
              const Icon = iconFor(n.type);
              return (
                <li key={n.id} className="flex items-start gap-3 p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.unread && <Badge className="bg-gradient-brand text-white border-transparent">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
