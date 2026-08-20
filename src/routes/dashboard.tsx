import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  Inbox,
  Users2,
  Layers3,
  Zap,
  Check,
  X,
  ArrowUpRight,
  Bell,
  Plus,
  StickyNote,
  Trash2,
  LayoutList,
  LayoutGrid,
  Copy,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotlightCard } from "@/components/SpotlightCard";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getRooms, deleteRoom, type DbRoom } from "@/lib/rooms-api";
import { useAuth } from "@/lib/auth";
import {
  getPendingInvitations, acceptRoomInvitation, rejectRoomInvitation,
} from "@/lib/users-api";
import { fetchRealNotifications, type RealNotification } from "@/lib/notifications-api";
import { getNotes, createNote, deleteNote, type DbNote } from "@/lib/notes-api";
import { formatDateWord } from "@/lib/date-utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hackord" }] }),
  component: DashboardPage,
});

function formatTimeAgo(dateInput: string | Date) {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [roomsViewMode, setRoomsViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = (p.get("view") || localStorage.getItem("dashboard_rooms_view")) as any;
      if (v === "list" || v === "grid") setRoomsViewMode(v);
    }
  }, []);

  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [realNotifications, setRealNotifications] = useState<RealNotification[]>([]);
  const [dbNotes, setDbNotes] = useState<DbNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to access your dashboard");
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (roomsViewMode !== "list") url.searchParams.set("view", roomsViewMode);
        else url.searchParams.delete("view");
        window.history.replaceState({}, "", url.toString());
        localStorage.setItem("dashboard_rooms_view", roomsViewMode);
      } catch {
        // ignore
      }
    }
  }, [roomsViewMode]);

  useEffect(() => {
    let mounted = true;
    if (authLoading) return;

    async function loadDashboardData() {
      setLoading(true);
      try {
        if (user) {
          const [roomsRes, invsRes, notifsRes, notesRes] = await Promise.all([
            getRooms({ userId: user._id, email: user.email, userName: user.name }),
            getPendingInvitations({ userId: user._id, email: user.email }),
            fetchRealNotifications(user),
            getNotes({ userId: user._id, email: user.email }),
          ]);
          if (mounted) {
            setRooms(roomsRes || []);
            setInvitations(invsRes || []);
            setRealNotifications(notifsRes || []);
            setDbNotes(notesRes || []);
          }
        } else {
          const roomsRes = await getRooms({ all: true });
          if (mounted) {
            setRooms(roomsRes || []);
            setInvitations([]);
            setRealNotifications([]);
            setDbNotes([]);
          }
        }
      } catch (err) {
        console.error("[Dashboard] Error loading data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const realDeadlines = useMemo(() => {
    const list: { title: string; room: string; date: string; urgency: string; rawDate: Date }[] = [];
    rooms.forEach((r) => {
      const pairs = [
        { title: "Registration closes", val: r.deadline_registration },
        { title: "PPT Submission", val: r.deadline_ppt },
        { title: "Prototype Submission", val: r.deadline_prototype },
        { title: "Final Submission", val: r.deadline_final },
        { title: "Result declaration", val: r.deadline_result },
      ];
      pairs.forEach((p) => {
        if (p.val) {
          const d = new Date(p.val);
          if (!isNaN(d.getTime())) {
            const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const urgency = diffDays <= 2 ? "danger" : diffDays <= 7 ? "warning" : "muted";
            list.push({
              title: p.title,
              room: r.name,
              date: formatDateWord(d, { includeYear: false }),
              urgency,
              rawDate: d,
            });
          }
        }
      });
    });
    list.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    return list;
  }, [rooms]);

  const roomGroupedDeadlines = useMemo(() => {
    const map = new Map<
      string,
      {
        roomId: string;
        roomName: string;
        hackathon: string;
        deadlines: { title: string; date: string; urgency: string; rawDate: Date }[];
      }
    >();

    rooms.forEach((r) => {
      const pairs = [
        { title: "Registration closes", val: r.deadline_registration },
        { title: "PPT Submission", val: r.deadline_ppt },
        { title: "Prototype Submission", val: r.deadline_prototype },
        { title: "Final Submission", val: r.deadline_final },
        { title: "Result declaration", val: r.deadline_result },
      ];
      const roomDeadlines: { title: string; date: string; urgency: string; rawDate: Date }[] = [];
      pairs.forEach((p) => {
        if (p.val) {
          const d = new Date(p.val);
          if (!isNaN(d.getTime())) {
            const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const urgency = diffDays <= 2 ? "danger" : diffDays <= 7 ? "warning" : "muted";
            roomDeadlines.push({
              title: p.title,
              date: formatDateWord(d, { includeYear: false }),
              urgency,
              rawDate: d,
            });
          }
        }
      });

      if (roomDeadlines.length > 0) {
        roomDeadlines.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        map.set(r.id, {
          roomId: r.id,
          roomName: r.name,
          hackathon: r.hackathon,
          deadlines: roomDeadlines,
        });
      }
    });

    return Array.from(map.values());
  }, [rooms]);

  const realActivities = useMemo(() => {
    const list: { id: string; who: string; what: string; when: string; rawTime: number }[] = [];
    rooms.forEach((r) => {
      (r.activities || []).forEach((a) => {
        const t = a.when ? new Date(a.when).getTime() : Date.now();
        list.push({
          id: a.id,
          who: a.who,
          what: `${a.what} (${r.name})`,
          when: a.when ? formatTimeAgo(a.when) : "Recently",
          rawTime: t,
        });
      });
    });
    list.sort((a, b) => b.rawTime - a.rawTime);
    return list;
  }, [rooms]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!user) return null;

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

  const fetchNotes = async () => {
    if (!user) {
      setDbNotes([]);
      return;
    }
    try {
      const res = await getNotes({ userId: user._id, email: user.email });
      setDbNotes(res);
    } catch {
      setDbNotes([]);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || creatingNote) return;
    setCreatingNote(true);
    try {
      await createNote({
        title: noteTitle.trim() || "Quick Note",
        content: noteContent.trim(),
        userId: user?._id || "guest",
        email: user?.email || "",
      });
      toast.success("Note saved to database!");
      setNoteTitle("");
      setNoteContent("");
      fetchNotes();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      toast.info("Note deleted");
      setDbNotes((prev) => prev.filter((n) => (n._id || n.id) !== id));
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleAcceptInvitation = async (inv: any) => {
    try {
      const invId = inv._id || inv.id;
      await acceptRoomInvitation(invId);
      toast.success(`Joined "${inv.roomName}"!`);
      setInvitations((prev) => prev.filter((i) => (i._id || i.id) !== invId));
      if (user) {
        getRooms({ userId: user._id, email: user.email, userName: user.name }).then(setRooms);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    }
  };

  const handleRejectInvitation = async (inv: any) => {
    try {
      const invId = inv._id || inv.id;
      await rejectRoomInvitation(invId);
      toast.info(`Declined invitation for "${inv.roomName}"`);
      setInvitations((prev) => prev.filter((i) => (i._id || i.id) !== invId));
    } catch (err: any) {
      toast.error(err.message || "Failed to decline invitation");
    }
  };

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/rooms/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Room link copied to clipboard!");
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Hacker";
  const firstRoomName = rooms[0]?.name ?? "Workspace";
  const firstRoomId = rooms[0]?.id ?? "smart-india-2026";



  const stats = [
    { label: "Active Rooms", value: rooms.length, icon: Layers3, bg: "bg-emerald-400/10", color: "text-emerald-400", pulse: true },
    { label: "Pending Invites", value: invitations.length, icon: Inbox, bg: "bg-indigo-400/10", color: "text-indigo-400" },
    { label: "Upcoming Deadlines", value: realDeadlines.length, icon: CalendarClock, bg: "bg-warning/15", color: "text-warning" },
    { label: "Connections", value: rooms.reduce((acc, r) => acc + (r.members?.length || 1), 0), icon: Users2, bg: "bg-brand/10", color: "text-brand" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {loading ? (
          /* Skeleton Loader UI for smooth fast loading without dummy data flicker */
          <div className="space-y-8">
            <Skeleton className="h-40 w-full rounded-3xl" />
            {/* Desktop Skeleton Grid */}
            <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
            {/* Mobile Horizontal Scrollable Skeletons */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-52 shrink-0 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Banner */}
            <section className="glass-strong rounded-3xl p-8 sm:p-12 shadow-card relative overflow-hidden">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Welcome back</p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                    Hey {firstName} 👋
                  </h1>
                  <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
                    You have {invitations.length} pending room invitation{invitations.length === 1 ? "" : "s"} and {realDeadlines.length} upcoming hackathon deadline{realDeadlines.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/rooms/$roomId"
                    params={{ roomId: firstRoomId }}
                    className="rounded-xl border dark:border-white/15 border-foreground/15 bg-white/10 dark:bg-foreground/10 px-5 py-2.5 text-xs font-semibold text-black dark:text-foreground shadow-glow hover:bg-white/20 dark:hover:bg-foreground/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Open {firstRoomName} <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="animate-fade-in animate-delay-100">
              {/* Desktop Grid View */}
              <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((s) => (
                  <SpotlightCard
                    key={s.label}
                    className="p-5 cursor-default"
                    spotlightColor={s.pulse ? "rgba(52, 211, 153, 0.15)" : "rgba(139, 92, 246, 0.15)"}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <div className={`relative grid h-9 w-9 place-items-center rounded-lg ${s.bg}`}>
                        {s.pulse && (
                          <span className="absolute inset-0 rounded-lg animate-ping bg-emerald-400/20" />
                        )}
                        <s.icon className={`relative h-4 w-4 ${s.color} ${s.pulse ? "drop-shadow-[0_0_6px_rgb(52,211,153)]" : ""}`} />
                      </div>
                    </div>
                    <div className={`mt-3 text-3xl font-semibold ${s.pulse && s.value > 0 ? "text-emerald-400" : ""}`}>
                      {s.value}
                    </div>
                    {s.pulse && s.value > 0 && (
                      <p className="mt-1 text-xs text-emerald-400/70 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Live
                      </p>
                    )}
                  </SpotlightCard>
                ))}
              </div>

              {/* Mobile Horizontal Scrollable View (Smooth responsive horizontal carousel) */}
              <div className="flex sm:hidden overflow-x-auto gap-3 pb-3 pt-1 px-1 -mx-1 snap-x snap-mandatory custom-scrollbar">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="snap-start shrink-0 w-[220px] glass rounded-2xl p-4 shadow-card flex flex-col justify-between border border-border/70"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground truncate mr-2">{s.label}</span>
                      <div className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl ${s.bg}`}>
                        {s.pulse && (
                          <span className="absolute inset-0 rounded-xl animate-ping bg-emerald-400/20" />
                        )}
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <div className={`text-2xl font-bold ${s.pulse && s.value > 0 ? "text-emerald-400" : ""}`}>
                        {s.value}
                      </div>
                      {s.pulse && s.value > 0 && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3 animate-fade-in animate-delay-200">
              {/* Deadlines Grouped by Room */}
              <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
                  <Badge variant="secondary">{realDeadlines.length} Total</Badge>
                </div>
                {roomGroupedDeadlines.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                    No upcoming room deadlines 🎉
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                    {roomGroupedDeadlines.map((group) => (
                      <div key={group.roomId} className="rounded-xl border border-border/70 bg-card/40 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <Link
                            to="/rooms/$roomId"
                            params={{ roomId: group.roomId }}
                            className="font-bold text-sm text-primary hover:underline flex items-center gap-1.5"
                          >
                            <span>{group.roomName}</span>
                            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                              {group.hackathon}
                            </Badge>
                          </Link>
                          <span className="text-[11px] font-semibold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                            {group.deadlines.length} deadline{group.deadlines.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        <ul className="space-y-2">
                          {group.deadlines.map((d, idx) => (
                            <li
                              key={d.title + idx}
                              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-2.5 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={
                                    "grid h-7 w-7 place-items-center rounded-md " +
                                    (d.urgency === "danger"
                                      ? "bg-destructive/15 text-destructive"
                                      : d.urgency === "warning"
                                      ? "bg-warning/15 text-warning"
                                      : "bg-gradient-brand-soft text-primary")
                                  }
                                >
                                  <CalendarClock className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-foreground">{d.title}</span>
                              </div>
                              <span className="text-muted-foreground font-mono">{d.date}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Invitations */}
              <section className="glass rounded-2xl p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Pending invitations</h2>
                  <Badge variant="secondary">{invitations.length}</Badge>
                </div>
                {invitations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
                    <p className="text-sm font-medium">No pending invitations 🎉</p>
                    <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {invitations.map((i) => (
                      <div key={i._id || i.id} className="rounded-xl border border-border/60 bg-card/50 p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={i.sender?.avatar} />
                            <AvatarFallback>{(i.sender?.name || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{i.roomName}</p>
                            <p className="truncate text-xs text-muted-foreground">{i.hackathon}</p>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">"{i.message}"</p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInvitation(i)}
                            className="flex-1 bg-gradient-brand text-white shadow-glow hover:opacity-90"
                          >
                            <Check className="h-3.5 w-3.5" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectInvitation(i)}
                            className="flex-1 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 animate-fade-in animate-delay-300">
              {/* Live Activity Stream */}
              <section className="glass rounded-2xl p-6 shadow-card flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <h2 className="text-lg font-semibold">Live Activity</h2>
                </div>
                {realActivities.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                    No recent room activity recorded
                  </div>
                ) : (
                  <ul className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {realActivities.map((a, i) => (
                      <li key={a.id + i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand-soft text-xs font-semibold text-primary shrink-0">
                          {a.who[0]}
                        </div>
                        <div className="flex-1 text-sm min-w-0">
                          <span className="font-medium">{a.who}</span>{" "}
                          <span className="text-muted-foreground">{a.what}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{a.when}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* User Notes (Persisted to Database) */}
              <section className="glass rounded-2xl p-6 shadow-card flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">User Notes</h2>
                  </div>
                  <Badge variant="secondary">{dbNotes.length} saved</Badge>
                </div>

                {/* Create Note Form */}
                <form onSubmit={handleCreateNote} className="space-y-2 mb-4">
                  <Input
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title (optional)..."
                    className="text-xs bg-background/50 h-8"
                  />
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Jot down quick ideas, links, or tasks..."
                    className="w-full h-20 resize-none rounded-xl bg-background/50 border border-border/60 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creatingNote || !noteContent.trim()}
                    className="w-full bg-gradient-brand text-white text-xs h-8 shadow-glow"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Save Note to DB
                  </Button>
                </form>

                {/* Saved Notes List */}
                <div className="flex-1 max-h-[220px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                  {dbNotes.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                      No saved notes yet. Create your first note above!
                    </p>
                  ) : (
                    dbNotes.map((n) => {
                      const noteId = n._id || n.id || "";
                      return (
                        <div key={noteId} className="group relative rounded-xl border border-border/60 bg-card/60 p-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground truncate">{n.title}</p>
                            <button
                              onClick={() => handleDeleteNote(noteId)}
                              className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive shrink-0"
                              title="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap line-clamp-3">{n.content}</p>
                          <span className="mt-2 block text-[10px] text-muted-foreground/70">
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Notifications */}
              <section className="glass rounded-2xl p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent notifications</h2>
                  <Link to="/notifications" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    View all <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {realNotifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                    No recent notifications
                  </div>
                ) : (
                  <ul className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {realNotifications.slice(0, 5).map((n) => (
                      <Link key={n.id} to={(n.link || "/notifications") as any} className="block">
                        <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 hover:bg-card/80 transition">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand-soft text-primary shrink-0">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{n.detail}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
                        </li>
                      </Link>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* My Rooms Section (Displayed in List Format at the bottom of Dashboard) */}
            <section className="animate-fade-in animate-delay-400 glass rounded-3xl p-6 border border-border/70 shadow-card">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold tracking-tight">My Workspace Rooms</h2>
                    <Badge variant="secondary" className="ml-2">{rooms.length} Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your hackathon teams, member permissions, and project rooms.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Switcher (List / Grid) */}
                  <div className="flex items-center rounded-xl bg-card border border-border p-1">
                    <button
                      onClick={() => setRoomsViewMode("list")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                        roomsViewMode === "list"
                          ? "bg-gradient-brand text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutList className="h-3.5 w-3.5" /> List
                    </button>
                    <button
                      onClick={() => setRoomsViewMode("grid")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                        roomsViewMode === "grid"
                          ? "bg-gradient-brand text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" /> Grid
                    </button>
                  </div>

                  <Link
                    to="/rooms"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    All Rooms <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {rooms.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                  No rooms created yet. Click "Create Room" to start your first hackathon workspace.
                </div>
              ) : roomsViewMode === "list" ? (
                /* Structured List Format for Dashboard Bottom Rooms */
                <div className="space-y-3">
                  {rooms.map((r) => (
                    <div
                      key={r.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-card/90 hover:shadow-lg"
                    >
                      {/* Left info */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand-soft text-primary font-bold text-base shadow-sm">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <Link
                              to="/rooms/$roomId"
                              params={{ roomId: r.id }}
                              className="text-base font-semibold text-foreground group-hover:text-primary transition line-clamp-1"
                            >
                              {r.name}
                            </Link>
                            <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary border-primary/30">
                              {r.status || "Active"}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium">
                              🏆 {r.hackathon}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {r.problem || "Collaborative workspace for ideation, build, and presentation."}
                          </p>
                        </div>
                      </div>

                      {/* Right info & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                        {/* Members Stack */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {(r.members || []).slice(0, 4).map((m) => (
                              <Avatar key={m.user_id} className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={m.user_avatar} />
                                <AvatarFallback>{(m.user_name || "U")[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {r.member_count ?? (r.members?.length || 0)}/{r.max_size || 6}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {isRoomOwnerOrAdmin(r) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteRoom(r.id, r.name, e)}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete Room"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Link
                            to="/rooms/$roomId"
                            params={{ roomId: r.id }}
                          >
                            <Button size="sm" className="h-8 bg-gradient-brand text-white text-xs gap-1.5 shadow-glow">
                              Enter Room <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Grid Format fallback option */
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((r) => (
                    <SpotlightCard key={r.id} className="group p-0" spotlightColor="rgba(59, 130, 246, 0.2)">
                      <Link
                        to="/rooms/$roomId"
                        params={{ roomId: r.id }}
                        className="block h-full p-5"
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
                            {(r.members || []).slice(0, 4).map((m) => (
                              <Avatar key={m.user_id} className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={m.user_avatar} />
                                <AvatarFallback>{m.user_name[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Users2 className="h-3 w-3" />
                            {r.member_count ?? (r.members?.length || 0)}/{r.max_size}
                          </span>
                        </div>
                      </Link>
                    </SpotlightCard>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
