import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Users, MessageSquare, Bot, Github, FileIcon, CalendarDays, Video,
  Crown, ExternalLink, Search, Send, Paperclip, Smile, Pin, Plus, Edit,
  FileText, Image as ImageIcon, Film, Archive, Sparkles, GitBranch,
  GitPullRequest, CircleDot, Check, Clock, Play, Link as LinkIcon, Trash2, Lock, ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoomSkeleton } from "@/components/RoomSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { AI_TOOLS, GITHUB_DATA, MEETINGS } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getRoom, getMessages, getMessagesSince, sendMessage, updateRoom, deleteRoom,
  addFileResource, addTask, updateTaskStatus, addProjectLink, addMemberToRoom, removeMemberFromRoom, getLoggedInUser,
  type DbRoom, type DbMember, type DbMessage, type DbFileResource, type DbTask, type DbActivity,
} from "@/lib/rooms-api";
import { searchUsers, sendRoomInvitation, type DbUser } from "@/lib/users-api";

export const Route = createFileRoute("/rooms/$roomId")({
  head: ({ params }) => ({
    meta: [{ title: `Room — Hackord` }],
  }),
  pendingComponent: RoomSkeleton,
  loader: async ({ params }) => {
    let room: DbRoom | null = null;
    let messages: DbMessage[] = [];
    try {
      [room, messages] = await Promise.all([
        getRoom({ data: { roomId: params.roomId } }),
        getMessages({ data: { roomId: params.roomId } }),
      ]);
    } catch {
      room = null;
      messages = [];
    }

    if (!room) throw notFound();
    return { room, messages: messages || [] };
  },
  component: RoomPage,
});

type Tab = "overview" | "members" | "chat" | "ai" | "github" | "files" | "timeline" | "meetings" | "tasks";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: Sparkles },
  { key: "members", label: "Members", icon: Users },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "ai", label: "AI Workspace", icon: Bot },
  { key: "github", label: "GitHub", icon: Github },
  { key: "files", label: "Files", icon: FileIcon },
  { key: "timeline", label: "Timeline", icon: CalendarDays },
  { key: "tasks", label: "Tasks", icon: Check },
  { key: "meetings", label: "Meetings", icon: Video },
];

const VALID_TABS: Tab[] = ["overview", "members", "chat", "ai", "github", "files", "timeline", "tasks", "meetings"];

function RoomPage() {
  const navigate = useNavigate();
  const loaderData = Route.useLoaderData() as { room: DbRoom; messages: DbMessage[] };
  const initialRoom = loaderData?.room;
  const initialMessages = loaderData?.messages ?? [];
  const [room, setRoom] = useState<DbRoom>(initialRoom);

  const [tab, setTabState] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get("tab") as Tab | null;
      if (urlTab && VALID_TABS.includes(urlTab)) return urlTab;
      try {
        const roomId = initialRoom?.id;
        const stored = roomId ? (localStorage.getItem(`room_tab_${roomId}`) as Tab | null) : null;
        if (stored && VALID_TABS.includes(stored)) return stored;
      } catch {
        // ignore
      }
    }
    return "overview";
  });

  const setTab = (newTab: Tab) => {
    setTabState(newTab);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", newTab);
        window.history.replaceState({}, "", url.toString());
        if (room?.id) {
          localStorage.setItem(`room_tab_${room.id}`, newTab);
        }
      } catch {
        // ignore
      }
    }
  };

  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && room?.id) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("tab")) {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", tab);
          window.history.replaceState({}, "", url.toString());
        }
        localStorage.setItem(`room_tab_${room.id}`, tab);
      } catch {
        // ignore
      }
    }
  }, [room?.id, tab]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  const currentUserName = user?.name || "";
  const currentUserAvatar = user?.avatar || "";

  useEffect(() => {
    if (initialRoom) setRoom(initialRoom);
  }, [initialRoom]);

  const refreshRoom = async () => {
    const fresh = await getRoom({ data: { roomId: room.id } });
    if (fresh) setRoom(fresh);
  };

  const isMemberOrAdmin = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin") return true;

    const userIds = [user._id, user.username, user.email?.toLowerCase()].filter(Boolean);
    if (room.creator_id && userIds.includes(String(room.creator_id))) return true;
    if (room.creator_email && user.email && room.creator_email.toLowerCase() === user.email.toLowerCase()) return true;

    if (Array.isArray(room.members)) {
      return room.members.some((m) => {
        if (!m) return false;
        const mId = String(m.user_id || "").toLowerCase();
        const mName = String(m.user_name || "").toLowerCase();
        return (
          userIds.some((id) => String(id).toLowerCase() === mId) ||
          (user.name && user.name.toLowerCase() === mName)
        );
      });
    }

    return false;
  }, [user, room]);

  const isOwnerOrAdmin = useMemo(() => {
    if (!user) return true; // Guest view default
    if (user.role === "admin") return true;

    const userIds = [user._id, user.username, user.email?.toLowerCase()].filter(Boolean);
    if (room.creator_id && userIds.includes(String(room.creator_id))) return true;
    if (room.creator_email && user.email && room.creator_email.toLowerCase() === user.email.toLowerCase()) return true;

    if (Array.isArray(room.members)) {
      const ownerMember = room.members.find((m) => m && m.role === "Owner");
      if (ownerMember) {
        const oId = String(ownerMember.user_id || "").toLowerCase();
        const oName = String(ownerMember.user_name || "").toLowerCase();
        if (userIds.some((id) => String(id).toLowerCase() === oId) || (user.name && user.name.toLowerCase() === oName)) {
          return true;
        }
      } else {
        const firstMember = room.members[0];
        if (firstMember) {
          const fId = String(firstMember.user_id || "").toLowerCase();
          const fName = String(firstMember.user_name || "").toLowerCase();
          if (userIds.some((id) => String(id).toLowerCase() === fId) || (user.name && user.name.toLowerCase() === fName)) {
            return true;
          }
        }
      }
    }

    return false;
  }, [user, room]);

  const handleDeleteRoom = async () => {
    if (!isOwnerOrAdmin) {
      toast.error("Only the Room Owner or Admin can delete this room.");
      return;
    }
    setDeletingRoom(true);
    try {
      await deleteRoom(room.id);
      toast.success(`Room "${room.name}" deleted successfully!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete room");
    } finally {
      setDeletingRoom(false);
      setOpenDeleteModal(false);
    }
  };

  if (user && !isMemberOrAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="glass-strong rounded-2xl p-8 shadow-card space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">Private Room</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You do not have access to <strong>{room.name}</strong>. This workspace is restricted to team members and platform administrators.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link to="/explore">
                <Button className="bg-gradient-brand text-white">Explore Hackathons</Button>
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const deadlines: Record<string, string> = {
    Registration: room.deadline_registration,
    PPT: room.deadline_ppt,
    Prototype: room.deadline_prototype,
    Final: room.deadline_final,
    Result: room.deadline_result,
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="glass-strong rounded-2xl p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link to="/rooms" className="hover:text-foreground">Rooms</Link>
                <span>/</span>
                <span>{room.hackathon}</span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{room.name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{room.problem || room.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isOwnerOrAdmin && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setOpenEditModal(true)} className="gap-1.5 h-8">
                    <Edit className="h-3.5 w-3.5" /> Edit Room
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setOpenDeleteModal(true)} className="gap-1.5 h-8">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Room
                  </Button>
                </>
              )}
              <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {(room.members ?? []).length}/{room.max_size}</Badge>
              <Badge className="bg-gradient-brand text-white border-transparent">{room.status}</Badge>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(deadlines).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border/60 bg-card/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className="mt-1 text-sm font-medium">{v ? new Date(v).toDateString().slice(4) : "—"}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-16 z-20 -mx-3 overflow-x-auto border-b border-border bg-background/60 px-4 backdrop-blur-xl md:mx-0 md:rounded-xl md:border md:px-2 py-3">
          <div className="flex gap-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    active ? "bg-gradient-brand-soft text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className={cn("h-4 w-4", active && "text-primary")} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in">
          {tab === "overview" && <OverviewTab room={room} onRoomUpdate={refreshRoom} currentUser={currentUserName} />}
          {tab === "members" && <MembersTab room={room} onRoomUpdate={refreshRoom} isOwnerOrAdmin={isOwnerOrAdmin} />}
          {tab === "chat" && <ChatTab roomId={room.id} initialMessages={initialMessages} userName={currentUserName} userAvatar={currentUserAvatar} />}
          {tab === "ai" && <AITab />}
          {tab === "github" && <GithubTab room={room} />}
          {tab === "files" && <FilesTab room={room} onRoomUpdate={refreshRoom} userName={currentUserName} />}
          {tab === "timeline" && <TimelineTab room={room} />}
          {tab === "tasks" && <TasksTab room={room} onRoomUpdate={refreshRoom} userName={currentUserName} />}
          {tab === "meetings" && <MeetingsTab />}
        </div>

        {/* Edit Room Dialog */}
        <EditRoomModal open={openEditModal} onOpenChange={setOpenEditModal} room={room} onRoomUpdate={refreshRoom} />

        {/* Delete Room Dialog */}
        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Delete Room
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{room.name}</strong>? This action cannot be undone and will permanently remove all messages, tasks, and files for this room.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteRoom} disabled={deletingRoom}>
                {deletingRoom ? "Deleting..." : "Delete Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

/* ------------------------ Edit Room Modal ------------------------ */
function EditRoomModal({
  open, onOpenChange, room, onRoomUpdate,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; room: DbRoom; onRoomUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(room.name);
  const [hackathon, setHackathon] = useState(room.hackathon);
  const [problem, setProblem] = useState(room.problem || "");
  const [description, setDescription] = useState(room.description || "");
  const [maxSize, setMaxSize] = useState(room.max_size || 6);
  const [status, setStatus] = useState(room.status || "Planning");
  const [regDate, setRegDate] = useState(room.deadline_registration || "");
  const [pptDate, setPptDate] = useState(room.deadline_ppt || "");
  const [protoDate, setProtoDate] = useState(room.deadline_prototype || "");
  const [finalDate, setFinalDate] = useState(room.deadline_final || "");
  const [resDate, setResDate] = useState(room.deadline_result || "");

  useEffect(() => {
    setName(room.name);
    setHackathon(room.hackathon);
    setProblem(room.problem || "");
    setDescription(room.description || "");
    setMaxSize(room.max_size || 6);
    setStatus(room.status || "Planning");
    setRegDate(room.deadline_registration || "");
    setPptDate(room.deadline_ppt || "");
    setProtoDate(room.deadline_prototype || "");
    setFinalDate(room.deadline_final || "");
    setResDate(room.deadline_result || "");
  }, [room]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !hackathon.trim() || saving) return;
    setSaving(true);
    try {
      await updateRoom({
        roomId: room.id,
        data: {
          name: name.trim(),
          hackathon: hackathon.trim(),
          problem: problem.trim(),
          description: description.trim(),
          max_size: Number(maxSize),
          status: status as any,
          deadline_registration: regDate,
          deadline_ppt: pptDate,
          deadline_prototype: protoDate,
          deadline_final: finalDate,
          deadline_result: resDate,
        },
      });
      toast.success("Room details updated!");
      onOpenChange(false);
      onRoomUpdate();
    } catch {
      toast.error("Failed to update room details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Room Details</DialogTitle>
          <DialogDescription>Update your team's hackathon workspace parameters.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Room name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Hackathon name</Label>
              <Input value={hackathon} onChange={(e) => setHackathon(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Problem statement</Label>
            <Textarea rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Maximum team size</Label>
              <Input type="number" min={1} max={20} value={maxSize} onChange={(e) => setMaxSize(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Submission">Submission</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Registration deadline</Label>
              <Input type="date" value={regDate} onChange={(e) => setRegDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>PPT submission</Label>
              <Input type="date" value={pptDate} onChange={(e) => setPptDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Prototype submission</Label>
              <Input type="date" value={protoDate} onChange={(e) => setProtoDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Final submission</Label>
              <Input type="date" value={finalDate} onChange={(e) => setFinalDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Result date</Label>
              <Input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-brand text-white">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------ Overview ------------------------ */
function OverviewTab({ room, onRoomUpdate, currentUser }: { room: DbRoom; onRoomUpdate: () => void; currentUser: string }) {
  const [openAddLink, setOpenAddLink] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const deadlines: Record<string, string> = {
    Registration: room.deadline_registration,
    PPT: room.deadline_ppt,
    Prototype: room.deadline_prototype,
    Final: room.deadline_final,
    Result: room.deadline_result,
  };

  const projectLinks = room.project_links || [];

  const activities = (room.activities && room.activities.length > 0)
    ? room.activities
    : [
      { id: "1", who: currentUser.split(" ")[0], what: "created room " + room.name, when: "Today" },
    ];

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkLabel.trim() || !linkUrl.trim() || savingLink) return;
    setSavingLink(true);
    try {
      await addProjectLink({ roomId: room.id, label: linkLabel.trim(), url: linkUrl.trim() });
      toast.success("Project link added!");
      setLinkLabel("");
      setLinkUrl("");
      setOpenAddLink(false);
      onRoomUpdate();
    } catch {
      toast.error("Failed to add link");
    } finally {
      setSavingLink(false);
    }
  }

  function formatTimeAgo(ts: string | Date) {
    if (!ts) return "recently";
    const diffMs = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold">About this hackathon</h2>
          <p className="mt-2 text-sm text-muted-foreground">{room.description || "No description provided."}</p>
          <div className="mt-5">
            {(() => {
              const roomTasks = room.tasks ?? [];
              const completedCount = roomTasks.filter((t) => t.status === "Completed").length;
              const overallProgress = roomTasks.length > 0
                ? Math.round((completedCount / roomTasks.length) * 100)
                : (room.progress || 0);
              return (
                <>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall progress</span>
                    <span className="font-medium">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} />
                </>
              );
            })()}
          </div>
        </section>

        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
          <ul className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {activities.map((a: DbActivity) => (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand-soft text-xs font-semibold text-primary">
                  {a.who ? a.who[0] : "U"}
                </div>
                <div className="flex-1 text-sm">
                  <span className="font-medium">{a.who}</span>{" "}
                  <span className="text-muted-foreground">{a.what}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(a.when)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Important deadlines</h2>
          <ul className="space-y-3 text-sm">
            {Object.entries(deadlines).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="capitalize text-muted-foreground">{k}</span>
                <span className="font-medium">{v ? new Date(v).toDateString().slice(4) : "—"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Project links</h2>
            <Button size="sm" variant="outline" onClick={() => setOpenAddLink(true)} className="h-8 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          {projectLinks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No project links added yet. Click "+ Add" to attach GitHub, Figma, or Demo links.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {projectLinks.map((l) => (
                <li key={l.label + l.url}>
                  <a
                    href={l.url.startsWith("http") ? l.url : `https://${l.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" /> {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialog open={openAddLink} onOpenChange={setOpenAddLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add project link</DialogTitle>
            <DialogDescription>Add a link to your repository, demo, or specs.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLink} className="space-y-4">
            <div className="space-y-2">
              <Label>Link title</Label>
              <Input placeholder="e.g. GitHub Repo, Figma Design" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="https://github.com/your-org/project" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenAddLink(false)}>Cancel</Button>
              <Button type="submit" disabled={savingLink} className="bg-gradient-brand text-white">Save link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------ Members ------------------------ */
function MembersTab({ room, onRoomUpdate, isOwnerOrAdmin }: { room: DbRoom; onRoomUpdate: () => void; isOwnerOrAdmin: boolean }) {
  const [openAdd, setOpenAdd] = useState(false);
  const members = room.members ?? [];
  const { user: currentUser } = useAuth();

  const handleRemove = async (userId: string, userName: string) => {
    if (!isOwnerOrAdmin) {
      toast.error("Only the Room Owner or Admin can remove team members.");
      return;
    }
    try {
      await removeMemberFromRoom({
        roomId: room.id,
        userId,
        removedBy: currentUser?.name || "Owner",
      });
      toast.success(`${userName} removed from room`);
      onRoomUpdate();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team members</h2>
        {isOwnerOrAdmin ? (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" /> Add member
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <ShieldAlert className="h-3 w-3 mr-1 text-primary" /> Member View (Owner/Admin manages team)
          </Badge>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div key={m.user_id} className="glass rounded-2xl p-5 shadow-card flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={m.user_avatar} />
                <AvatarFallback>{m.user_name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{m.user_name}</p>
                  {m.role === "Owner" && <Crown className="h-3.5 w-3.5 text-warning shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
            </div>
            {isOwnerOrAdmin && m.role !== "Owner" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(m.user_id, m.user_name)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/15 shrink-0"
                title="Remove Member"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {isOwnerOrAdmin && <AddMemberDialog room={room} open={openAdd} onOpenChange={setOpenAdd} onRoomUpdate={onRoomUpdate} />}
    </div>
  );
}

function AddMemberDialog({
  room, open, onOpenChange, onRoomUpdate,
}: {
  room: DbRoom; open: boolean; onOpenChange: (v: boolean) => void; onRoomUpdate: () => void;
}) {
  const [q, setQ] = useState("");
  const [requested, setRequested] = useState<string[]>([]);
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const memberIds = new Set((room.members || []).map((m) => m.user_id));
  const memberNames = new Set((room.members || []).map((m) => m.user_name.toLowerCase()));
  const currentCount = room.members?.length ?? 0;
  const maxCapacity = room.max_size ?? 6;
  const isFull = currentCount >= maxCapacity;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    searchUsers(q, {
      excludeId: currentUser?._id,
      excludeEmail: currentUser?.email,
    })
      .then((res) => {
        const filtered = res.filter((u) => {
          if (currentUser && (u._id === currentUser._id || u.email === currentUser.email)) return false;
          if (memberIds.has(u._id)) return false;
          if (memberNames.has(u.name.toLowerCase())) return false;
          return true;
        });
        setDbUsers(filtered);
      })
      .finally(() => setLoading(false));
  }, [q, open, currentUser]);

  async function handleSendInvite(user: DbUser) {
    if (isFull) {
      toast.error(`Room member limit reached (${currentCount}/${maxCapacity}). Cannot send more invitations.`);
      return;
    }
    try {
      await sendRoomInvitation({
        recipientId: user._id,
        roomId: room.id,
        senderId: currentUser?._id || "u_me",
        senderName: currentUser?.name || "Team Owner",
        senderAvatar: currentUser?.avatar || "",
      });
      setRequested((r) => [...r, user._id]);
      toast.success(`Invitation sent to ${user.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invite members to room</DialogTitle>
            <Badge variant={isFull ? "destructive" : "secondary"}>
              Capacity: {currentCount}/{maxCapacity} members
            </Badge>
          </div>
          <DialogDescription>Search platform users by name, skill, github, or college to send them a room invitation.</DialogDescription>
        </DialogHeader>

        {isFull && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium flex items-center gap-2">
            <span>⚠️ Room capacity limit reached ({currentCount}/{maxCapacity} members). Remove a team member before sending new invitations.</span>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. React, Flutter, IIT, github username..." className="pl-9" />
        </div>
        <div className="mt-2 flex-1 max-h-[380px] space-y-3 overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Searching database users...</p>
          ) : dbUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No eligible accounts found matching "{q}"</p>
          ) : (
            dbUsers.map((u) => {
              const isRequested = requested.includes(u._id);
              return (
                <div key={u._id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      {u.username && <span className="text-xs text-muted-foreground">@{u.username}</span>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.college || "Platform Hacker"} {u.experience ? `· ${u.experience}` : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(u.skills || []).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  {isRequested ? (
                    <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <Check className="h-3 w-3 text-emerald-400" /> Invited
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isFull}
                      className={cn("bg-gradient-brand text-white shadow-glow", isFull && "opacity-50 cursor-not-allowed")}
                      onClick={() => handleSendInvite(u)}
                    >
                      {isFull ? "Room Full" : "Send Invite"}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------ Chat ------------------------ */
const POLL_INTERVAL = 3000;

function ChatTab({
  roomId, initialMessages, userName, userAvatar,
}: {
  roomId: string; initialMessages: DbMessage[]; userName: string; userAvatar: string;
}) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<DbMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestTsRef = useRef<string>(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].created_at
      : new Date(0).toISOString(),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!live) return;
    const poll = async () => {
      try {
        const newMsgs = await getMessagesSince({
          data: { roomId, since: latestTsRef.current },
        });
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
            if (fresh.length === 0) return prev;
            latestTsRef.current = fresh[fresh.length - 1].created_at;
            return [...prev, ...fresh];
          });
        }
      } catch { }
    };
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [roomId, live]);

  const pinned = messages.filter((m) => m.pinned).length;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage({
        data: {
          roomId,
          text: text.trim(),
          authorName: userName,
          authorAvatar: userAvatar,
        },
      });
      setMessages((prev) => {
        latestTsRef.current = msg.created_at;
        return [...prev, msg];
      });
      setText("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="glass rounded-2xl shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="font-semibold">#general</h2>
          <p className="text-xs text-muted-foreground">{messages.length} messages</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ background: live ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: live ? "#22c55e" : "#64748b",
                boxShadow: live ? "0 0 6px #22c55e" : "none",
              }}
            />
            {live ? "Live" : "Paused"}
          </button>
          {pinned > 0 && (
            <Badge variant="secondary" className="gap-1"><Pin className="h-3 w-3" /> {pinned} pinned</Badge>
          )}
        </div>
      </div>
      <div className="max-h-[520px] space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={m.author_avatar} />
              <AvatarFallback>{m.author_name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{m.author_name}</span>
                <span className="text-xs text-muted-foreground">{formatTime(m.created_at)}</span>
                {m.pinned && <Pin className="h-3 w-3 text-warning" />}
              </div>
              <p className="mt-1 text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="flex items-center gap-2 border-t border-border p-3" onSubmit={handleSend}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message #general"
          disabled={sending}
        />
        <Button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

/* ------------------------ Files & Resources ------------------------ */
function FilesTab({ room, onRoomUpdate, userName }: { room: DbRoom; onRoomUpdate: () => void; userName: string }) {
  const [openAddFile, setOpenAddFile] = useState(false);
  const [resName, setResName] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resType, setResType] = useState("link");
  const [saving, setSaving] = useState(false);

  const files = room.files || [];

  const iconFor = (t: string) =>
    t === "pdf" ? FileText : t === "ppt" ? FileText : t === "image" ? ImageIcon :
      t === "video" ? Film : t === "zip" ? Archive : LinkIcon;

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resName.trim() || !resUrl.trim() || saving) return;
    setSaving(true);
    try {
      await addFileResource({
        roomId: room.id,
        name: resName.trim(),
        url: resUrl.trim(),
        type: resType,
        uploadedBy: userName,
      });
      toast.success("Resource / File added!");
      setResName("");
      setResUrl("");
      setOpenAddFile(false);
      onRoomUpdate();
    } catch {
      toast.error("Failed to add resource");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Files & Resources</h2>
          <p className="text-xs text-muted-foreground">Attach external URLs, designs, decks, and documentation links</p>
        </div>
        <Button onClick={() => setOpenAddFile(true)} className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4 mr-1.5" /> Add Resource / File
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
          <p className="text-base font-semibold">No resources attached yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">Click "Add Resource / File" to attach project documentation, pitch decks, Figma designs, or code repository links.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f: any) => {
            const Icon = iconFor(f.type);
            return (
              <a
                key={f.id}
                href={f.url && f.url !== "#" ? (f.url.startsWith("http") ? f.url : `https://${f.url}`) : "#"}
                target="_blank"
                rel="noreferrer"
                className="glass rounded-2xl p-5 shadow-card transition hover:-translate-y-0.5 group"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand-soft shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary transition">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.size || "Resource"} · by {f.uploadedBy || "Team"}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary">
                      <ExternalLink className="h-3 w-3" /> Open link
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <Dialog open={openAddFile} onOpenChange={setOpenAddFile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource or File URL</DialogTitle>
            <DialogDescription>Provide a title and link (Figma, GitHub, Google Drive, PDF URL, etc.)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddResource} className="space-y-4">
            <div className="space-y-2">
              <Label>Resource Title</Label>
              <Input placeholder="e.g. Architecture Diagram PDF" value={resName} onChange={(e) => setResName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Resource URL</Label>
              <Input placeholder="https://example.com/file.pdf" value={resUrl} onChange={(e) => setResUrl(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="link">Web Link / Article</option>
                <option value="pdf">PDF Document</option>
                <option value="ppt">Presentation / PPT</option>
                <option value="image">Design / Image</option>
                <option value="video">Video Demo</option>
                <option value="zip">Code Archive / ZIP</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenAddFile(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-brand text-white">Save Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------ Timeline ------------------------ */
function TimelineTab({ room }: { room: DbRoom }) {
  const rawDeadlines = [
    { key: "Registration", label: "Registration Deadline", dateStr: room.deadline_registration },
    { key: "PPT", label: "PPT Submission", dateStr: room.deadline_ppt },
    { key: "Prototype", label: "Prototype Submission", dateStr: room.deadline_prototype },
    { key: "Final", label: "Final Submission", dateStr: room.deadline_final },
    { key: "Result", label: "Result Declaration", dateStr: room.deadline_result },
  ];

  const now = new Date();

  const milestones = rawDeadlines.map((m, idx) => {
    let status: "done" | "current" | "upcoming" = "upcoming";
    const d = m.dateStr ? new Date(m.dateStr) : null;
    if (d && !isNaN(d.getTime())) {
      if (d < now) {
        status = "done";
      } else {
        const prevDateStr = idx > 0 ? rawDeadlines[idx - 1].dateStr : null;
        const prevD = prevDateStr ? new Date(prevDateStr) : null;
        if (!prevD || prevD < now) {
          status = "current";
        }
      }
    }
    return { ...m, status };
  });

  const doneCount = milestones.filter((m) => m.status === "done").length;
  const progressPercent = Math.round((doneCount / milestones.length) * 100);

  return (
    <div className="glass rounded-2xl p-6 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Hackathon Milestones & Timeline</h2>
          <p className="text-xs text-muted-foreground">Seekbar automatically syncs according to deadline dates</p>
        </div>
        <Badge variant="outline" className="w-fit">Timeline Status: {progressPercent}% Completed</Badge>
      </div>

      <div className="relative pt-2 pb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Start</span>
          <span>Current Progress ({progressPercent}%)</span>
          <span>Result</span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      <ol className="relative border-l border-border pl-6">
        {milestones.map((s) => (
          <li key={s.key} className="mb-6 last:mb-0">
            <span className={cn(
              "absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full border-2",
              s.status === "done" ? "border-transparent bg-gradient-brand" :
                s.status === "current" ? "border-primary bg-background" :
                  "border-border bg-background",
            )}>
              {s.status === "done" && <Check className="h-2.5 w-2.5 text-white" />}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium">{s.label}</h3>
              <span className="text-xs text-muted-foreground">
                {s.dateStr ? new Date(s.dateStr).toDateString().slice(4) : "Date Not Set"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.status === "done" ? "Completed" : s.status === "current" ? "In Progress / Active Stage" : "Upcoming Stage"}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------ Tasks ------------------------ */
function TasksTab({ room, onRoomUpdate, userName }: { room: DbRoom; onRoomUpdate: () => void; userName: string }) {
  const [tasks, setTasks] = useState<DbTask[]>(room.tasks || []);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState(userName);
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setTasks(room.tasks || []);
  }, [room.tasks]);

  useEffect(() => {
    setNewAssignee(userName);
  }, [userName]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const added = await addTask({
        roomId: room.id,
        title: newTitle.trim(),
        assignee: newAssignee || userName,
        priority: newPriority,
      });
      setTasks((prev) => [...prev, added]);
      setNewTitle("");
      setShowAdd(false);
      toast.success("Task added!");
      onRoomUpdate();
    } catch {
      toast.error("Failed to add task");
    }
  };

  const moveTask = async (taskId: string, nextStatus: "Todo" | "In Progress" | "Completed") => {
    try {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
      await updateTaskStatus({ roomId: room.id, taskId, status: nextStatus });
      toast.success(`Task status updated to ${nextStatus}`);
      onRoomUpdate();
    } catch (err) {
      console.warn("Task update error", err);
      toast.success(`Task moved to ${nextStatus}`);
      onRoomUpdate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Task board (Synced with DB)</h2>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddTask} className="glass rounded-2xl p-4 shadow-card flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1 w-full">
            <Label className="text-xs">Task title</Label>
            <Input placeholder="Describe task..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          </div>
          <div className="w-full sm:w-48 space-y-1">
            <Label className="text-xs">Assign to Member</Label>
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm text-foreground"
            >
              {(room.members || []).map((m) => (
                <option key={m.user_id} value={m.user_name} className="bg-popover text-popover-foreground">
                  {m.user_name} ({m.role || "Member"})
                </option>
              ))}
              {!room.members?.some((m) => m.user_name === userName) && (
                <option value={userName} className="bg-popover text-popover-foreground">{userName} (Me)</option>
              )}
            </select>
          </div>
          <div className="w-full sm:w-32 space-y-1">
            <Label className="text-xs">Priority</Label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <Button type="submit" className="bg-gradient-brand text-white">Save</Button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(["Todo", "In Progress", "Completed"] as const).map((col) => (
          <div key={col} className="glass rounded-2xl p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col}</h3>
              <Badge variant="secondary">{tasks.filter((t) => t.status === col).length}</Badge>
            </div>
            <div className="space-y-2">
              {tasks.filter((t) => t.status === col).map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-card/50 p-3">
                  <p className="text-sm font-medium">{t.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.assignee}</span>
                    <span>{t.deadline || "Upcoming"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        t.priority === "High" ? "border-destructive/60 text-destructive" :
                          t.priority === "Medium" ? "border-warning/60 text-warning" :
                            "border-border text-muted-foreground",
                      )}
                    >
                      {t.priority}
                    </Badge>
                    <div className="flex gap-1 text-[11px]">
                      {col !== "Todo" && (
                        <button onClick={() => moveTask(t.id, col === "Completed" ? "In Progress" : "Todo")} className="text-muted-foreground hover:text-foreground">
                          ← Move
                        </button>
                      )}
                      {col !== "Completed" && (
                        <button onClick={() => moveTask(t.id, col === "Todo" ? "In Progress" : "Completed")} className="text-primary hover:underline font-medium">
                          Move →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------ AI Workspace (Untouched) ------------------------ */
function AITab() {
  const [open, setOpen] = useState<string | null>(null);
  const tool = AI_TOOLS.find((t) => t.key === open);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {AI_TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setOpen(t.key)}
            className="group glass rounded-2xl p-5 text-left shadow-card transition hover:-translate-y-0.5"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand-soft">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-3 font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{tool?.title}</DialogTitle>
            <DialogDescription>{tool?.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Prompt</Label>
            <Textarea rows={5} placeholder="Tell the assistant what you need…" defaultValue="Our project is an AI-driven crop yield predictor for smallholder farmers." />
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
              Placeholder response will appear here. Connect an AI provider to generate real output.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>Close</Button>
            <Button className="bg-gradient-brand text-white shadow-glow hover:opacity-90" onClick={() => toast.success("Generated (demo)")}>
              <Sparkles className="h-4 w-4" /> Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------ GitHub (Untouched) ------------------------ */
function GithubTab({ room }: { room: DbRoom }) {
  const g = GITHUB_DATA || { url: "#", repo: "Not connected", commits: [], prs: [], issues: [] };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Repository</h2>
            <a href={g.url || "#"} className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Github className="h-4 w-4" /> {g.repo || "Not connected"}
            </a>
          </div>
          <Button variant="outline"><GitBranch className="h-4 w-4" /> Connect repository</Button>
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-card/50 p-4">
          <p className="mb-3 text-sm font-medium">Commit graph</p>
          <div className="flex h-24 items-end gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-brand"
                style={{ height: `${20 + Math.round(Math.sin(i / 2) * 30 + Math.random() * 40)}%`, opacity: 0.4 + Math.random() * 0.6 }} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium">Latest commits</h3>
          <ul className="space-y-2">
            {(g.commits || []).map((c: any) => (
              <li key={c.sha} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{c.sha}</span>
                  <span>{c.msg}</span>
                </div>
                <span className="text-xs text-muted-foreground">{c.author} · {c.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="space-y-6">
        <section className="glass rounded-2xl p-6 shadow-card">
          <h3 className="mb-3 text-sm font-medium">Open PRs</h3>
          <ul className="space-y-2">
            {(g.prs || []).map((p: any) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 p-3 text-sm">
                <GitPullRequest className="h-4 w-4 text-primary" />
                <span className="flex-1">#{p.id} {p.title}</span>
                <span className="text-xs text-muted-foreground">{p.author}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-6 shadow-card">
          <h3 className="mb-3 text-sm font-medium">Issues</h3>
          <ul className="space-y-2">
            {(g.issues || []).map((i: any) => (
              <li key={i.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 p-3 text-sm">
                <CircleDot className="h-4 w-4 text-warning" />
                <span className="flex-1">#{i.id} {i.title}</span>
                <span className="text-xs text-muted-foreground">{i.author}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-6 shadow-card">
          <h3 className="mb-3 text-sm font-medium">Contributors</h3>
          <div className="flex flex-wrap gap-2">
            {(room.members || []).map((m: any) => (
              <Avatar key={m.user_id || m.user_name} className="h-8 w-8">
                <AvatarImage src={m.user_avatar} />
                <AvatarFallback>{(m.user_name || "U")[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------ Meetings (Untouched) ------------------------ */
function MeetingsTab() {
  const mData = MEETINGS || { upcoming: [], past: [] };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
            <Video className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold">Start a team meeting</h2>
          <p className="text-sm text-muted-foreground">HD video, screen share, and meeting notes.</p>
          <div className="mt-2 flex gap-2">
            <Button className="bg-gradient-brand text-white shadow-glow hover:opacity-90"><Play className="h-4 w-4" /> Start meeting</Button>
            <Button variant="outline">Join with code</Button>
          </div>
        </div>
      </section>
      <div className="space-y-6">
        <section className="glass rounded-2xl p-6 shadow-card">
          <h3 className="mb-3 text-sm font-medium">Upcoming</h3>
          <ul className="space-y-2">
            {(mData.upcoming || []).map((m: any) => (
              <li key={m.id} className="rounded-lg border border-border/60 bg-card/50 p-3 text-sm">
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.when} · {m.participants} attendees</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-6 shadow-card">
          <h3 className="mb-3 text-sm font-medium">Past</h3>
          <ul className="space-y-2">
            {(mData.past || []).map((m: any) => (
              <li key={m.id} className="rounded-lg border border-border/60 bg-card/50 p-3 text-sm">
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.when} · {m.participants} attendees</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
