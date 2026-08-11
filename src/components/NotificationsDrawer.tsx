import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, X, Check, CheckCheck, Info, Users, CalendarClock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchRealNotifications, type RealNotification } from "@/lib/notifications-api";

const ICON_MAP: Record<string, React.ElementType> = {
  invite: Users,
  deadline: CalendarClock,
  message: MessageSquare,
  activity: MessageSquare,
  info: Info,
};

function getIcon(type?: string) {
  return ICON_MAP[type ?? "info"] ?? Info;
}

export function NotificationsDrawer() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<RealNotification[]>([]);

  const loadNotifications = async () => {
    const live = await fetchRealNotifications();
    setNotifs(live);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const unread = notifs.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (n: RealNotification) => {
    setNotifs((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
    );
    setOpen(false);
    const targetLink = n.link || "/dashboard";
    navigate({ to: targetLink as any });
  };

  return (
    <>
      {/* Trigger button */}
      <button
        id="notifications-trigger"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-brand text-[9px] font-bold text-white shadow-glow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-sidebar/95 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Notifications</h2>
            {unread > 0 && (
              <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-xs font-medium text-white">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
              <Bell className="h-10 w-10 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifs.map((n) => {
                const Icon = getIcon(n.type);
                return (
                  <li
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "group flex items-start gap-3 px-5 py-4 transition cursor-pointer hover:bg-sidebar-accent/70",
                      n.unread && "bg-primary/10"
                    )}
                  >
                    {/* Icon bubble */}
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand-soft">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm", n.unread ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>
                          {n.title}
                        </p>
                        {n.unread && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.detail}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {n.time ?? "Just now"}
                      </p>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => dismiss(n.id, e)}
                      className="mt-0.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground group-hover:flex transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button
            className="w-full rounded-lg bg-gradient-brand-soft py-2 text-sm font-medium text-primary transition hover:bg-gradient-brand hover:text-white"
            onClick={() => {
              setOpen(false);
              navigate({ to: "/notifications" as any });
            }}
          >
            View all notifications
          </button>
        </div>
      </aside>
    </>
  );
}
