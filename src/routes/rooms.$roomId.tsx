import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Users, MessageSquare, Bot, Github, FileIcon, CalendarDays, Video,
  Crown, ExternalLink, Search, Send, Paperclip, Smile, Pin, Plus, Edit,
  FileText, Image as ImageIcon, Film, Archive, Sparkles, GitBranch,
  GitPullRequest, CircleDot, Check, Clock, Play, Link as LinkIcon, Trash2, Lock, ShieldAlert,
  Star, GitFork, RefreshCw, Unlink, AlertCircle, GitCommit,
  Linkedin, Globe, Trophy, GraduationCap,
  Mic, MicOff, Reply, MoreVertical, ChevronLeft, ChevronRight,
  Brain, ChevronDown, Share2, MoreHorizontal, ArrowUp, Copy, CornerDownRight,
  Presentation, Workflow, ShieldCheck, Layers, ListChecks, Network, Briefcase, Clapperboard, Rocket
} from "lucide-react";
import { fetchGithubWorkspaceData, parseGithubUrl, type GithubWorkspaceData } from "@/lib/github-api";
import { AgoraMeeting } from "@/components/AgoraMeeting";
import { AppShell } from "@/components/AppShell";
import { RoomSkeleton } from "@/components/RoomSkeleton";
import { UserProfileModal } from "@/components/UserProfileModal";
import { RenderSmartText } from "@/lib/chat-utils";
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
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AI_TOOLS, GITHUB_DATA, MEETINGS } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getRoom, getMessages, getMessagesSince, sendMessage, updateRoom, deleteRoom,
  addFileResource, addTask, updateTaskStatus, addProjectLink, addMemberToRoom, removeMemberFromRoom, getLoggedInUser,
  updateMessage, deleteMessage,
  type DbRoom, type DbMember, type DbMessage, type DbFileResource, type DbTask, type DbActivity,
} from "@/lib/rooms-api";
import { searchUsers, sendRoomInvitation, getUserById, type DbUser } from "@/lib/users-api";

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
    if (!room?.id) return;
    const fresh = await getRoom({ data: { roomId: room.id } });
    if (fresh) setRoom(fresh);
  };

  // Real-time automatic polling to sync room updates (members, tasks, files, details) live
  useEffect(() => {
    if (!room?.id) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await getRoom({ data: { roomId: room.id } });
        if (fresh) {
          setRoom((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(fresh)) {
              return fresh;
            }
            return prev;
          });
        }
      } catch {}
    }, 3500);
    return () => clearInterval(interval);
  }, [room?.id]);

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
        <section className="glass-strong rounded-2xl p-6 shadow-card ">
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
        <div className="sticky -top-7 z-20 -mx-3 overflow-x-auto border-b border-border bg-background/60 px-4 backdrop-blur-xl md:mx-0 md:rounded-xl md:border md:px-2 py-2">
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
          {tab === "chat" && (
            <ChatTab
              roomId={room.id}
              initialMessages={initialMessages}
              userName={currentUserName}
              userAvatar={currentUserAvatar}
              members={room.members || []}
            />
          )}
          {tab === "ai" && <AITab />}
          {tab === "github" && <GithubTab room={room} onRoomUpdate={refreshRoom} isOwnerOrAdmin={isOwnerOrAdmin} />}
          {tab === "files" && <FilesTab room={room} onRoomUpdate={refreshRoom} userName={currentUserName} />}
          {tab === "timeline" && <TimelineTab room={room} />}
          {tab === "tasks" && <TasksTab room={room} onRoomUpdate={refreshRoom} userName={currentUserName} />}
          {/* Keep Meetings tab always mounted so active calls stay connected in background */}
          <div className={cn(tab !== "meetings" && "hidden")}>
            <MeetingsTab
              room={room}
              userName={currentUserName}
              userAvatar={currentUserAvatar}
              isMemberOrAdmin={isMemberOrAdmin}
              isOwnerOrAdmin={isOwnerOrAdmin}
              roomMembersCount={(room.members || []).length}
            />
          </div>
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

  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);

  const handleViewProfile = async (userId: string) => {
    setLoadingProfileId(userId);
    try {
      const userDetails = await getUserById(userId);
      if (userDetails) {
        setSelectedUser(userDetails);
        setProfileModalOpen(true);
      } else {
        toast.error("Failed to load user profile");
      }
    } catch {
      toast.error("Error loading user profile");
    } finally {
      setLoadingProfileId(null);
    }
  };

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
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{m.role}</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleViewProfile(m.user_id)}
                    disabled={loadingProfileId !== null}
                    className="text-primary hover:underline font-medium focus:outline-none disabled:opacity-50 cursor-pointer animate-fade-in"
                  >
                    {loadingProfileId === m.user_id ? "Loading..." : "View Profile"}
                  </button>
                </div>
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
      <UserProfileModal
        user={selectedUser}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
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
          <DialogDescription>Search platform users by name, username, skill, github, linkedin, portfolio, college, bio, ID or hackathons to invite them.</DialogDescription>
        </DialogHeader>

        {isFull && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium flex items-center gap-2">
            <span>⚠️ Room capacity limit reached ({currentCount}/{maxCapacity} members). Remove a team member before sending new invitations.</span>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, @username, skill, github, linkedin, portfolio, college, bio, ID or hackathon..." className="pl-9" />
        </div>
        <div className="mt-2 flex-1 max-h-[380px] space-y-3 overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Searching database users...</p>
          ) : dbUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No eligible accounts found matching "{q}"</p>
          ) : (
            dbUsers.map((u) => {
              const isRequested = requested.includes(u._id);
              const qLower = q.trim().toLowerCase().replace(/^@/, "");
              
              // Calculate match badges for room invite modal
              const matchBadges: { label: string; color: string }[] = [];
              if (qLower) {
                if (u._id && u._id.toLowerCase().includes(qLower)) {
                  matchBadges.push({ label: `ID: ${u._id.slice(-6)}`, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" });
                }
                const mSkill = (u.skills || []).find((s) => s.toLowerCase().includes(qLower));
                if (mSkill) {
                  matchBadges.push({ label: `Skill: ${mSkill}`, color: "bg-primary/20 text-primary border-primary/30" });
                }
                if (u.github && u.github.toLowerCase().includes(qLower)) {
                  matchBadges.push({ label: `GitHub`, color: "bg-zinc-800 text-zinc-200 border-zinc-700" });
                }
                if (u.linkedin && u.linkedin.toLowerCase().includes(qLower)) {
                  matchBadges.push({ label: `LinkedIn`, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" });
                }
                if (u.portfolio && u.portfolio.toLowerCase().includes(qLower)) {
                  matchBadges.push({ label: `Portfolio`, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" });
                }
                if (u.college && u.college.toLowerCase().includes(qLower)) {
                  matchBadges.push({ label: `College: ${u.college}`, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" });
                }
                if (u.bio && u.bio.toLowerCase().includes(qLower)) {
                  matchBadges.push({ label: `Bio match`, color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" });
                }
                const mHackathon = (u.completedHackathons || []).find(
                  (h) => (h.name && h.name.toLowerCase().includes(qLower)) || (h.result && h.result.toLowerCase().includes(qLower))
                );
                if (mHackathon) {
                  matchBadges.push({ label: `Hackathon: ${mHackathon.name}`, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" });
                }
              }

              return (
                <div key={u._id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 hover:border-primary/40 transition">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      {u.username && <span className="text-xs text-muted-foreground">@{u.username}</span>}
                      {u.experience && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                          {u.experience}
                        </Badge>
                      )}
                    </div>

                    {/* Match Badges if query active */}
                    {matchBadges.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {matchBadges.map((mb, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${mb.color}`}
                          >
                            ✓ {mb.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* College */}
                    {u.college && (
                      <p className="truncate text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <GraduationCap className="h-3 w-3 text-primary/80 shrink-0" />
                        {u.college} {u.city ? `· ${u.city}` : ""}
                      </p>
                    )}

                    {/* Skills */}
                    {u.skills && u.skills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {u.skills.slice(0, 5).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-transparent">
                            {s}
                          </Badge>
                        ))}
                        {u.skills.length > 5 && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            +{u.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Social profiles & hackathons summary */}
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[10px] text-muted-foreground">
                      {u.github && (
                        <span className="flex items-center gap-0.5">
                          <Github className="h-3 w-3" />
                          <span className="truncate max-w-[90px]">{u.github.replace(/^https?:\/\//, "")}</span>
                        </span>
                      )}
                      {u.linkedin && (
                        <span className="flex items-center gap-0.5 text-blue-400">
                          <Linkedin className="h-3 w-3" />
                          <span className="truncate max-w-[90px]">{u.linkedin.replace(/^https?:\/\//, "")}</span>
                        </span>
                      )}
                      {u.portfolio && (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Globe className="h-3 w-3" />
                          <span className="truncate max-w-[90px]">{u.portfolio.replace(/^https?:\/\//, "")}</span>
                        </span>
                      )}
                      {u.completedHackathons && u.completedHackathons.length > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Trophy className="h-3 w-3" />
                          {u.completedHackathons.length} hackathon{u.completedHackathons.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 self-center">
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
function ChatTab({
  roomId, initialMessages, userName, userAvatar, members,
}: {
  roomId: string; initialMessages: DbMessage[]; userName: string; userAvatar: string; members: DbMember[];
}) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<DbMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [activeChat, setActiveChat] = useState<"general" | string>("general"); // "general" or member username
  const [searchQuery, setSearchQuery] = useState("");
  const [pinCycleIndex, setPinCycleIndex] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Desktop sidebar collapse & Mobile view layouts
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileViewChatActive, setMobileViewChatActive] = useState(false);

  // BroadcastChannel for instant multi-tab chat real-time sync
  const chatChannelRef = useRef<BroadcastChannel | null>(null);

  // Voice recording / Speech transcription
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef(""); // Track text before voice typing starts

  // Message contexts
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<DbMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DbMessage | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const latestTsRef = useRef<string>(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].created_at
      : new Date(0).toISOString()
  );

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN"; // English and Hinglish (Latin characters) mixed transcription

        rec.onresult = (event: any) => {
          let finalSessionTranscript = "";
          let interimSessionTranscript = "";

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalSessionTranscript += transcript;
            } else {
              interimSessionTranscript += transcript;
            }
          }

          const sessionTranscript = (finalSessionTranscript + interimSessionTranscript).trim();
          if (sessionTranscript) {
            const newText = baseTextRef.current
              ? `${baseTextRef.current} ${sessionTranscript}`
              : sessionTranscript;
            setText(newText);
          }
        };

        rec.onerror = (e: any) => {
          console.error("[SpeechRecognition Error]", e.error);
          if (e.error === "not-allowed") {
            toast.error("Microphone access blocked! Please enable microphone permission in your browser address bar.");
          } else if (e.error === "no-speech") {
            // Silence
          } else if (e.error === "network") {
            toast.error("Speech recognition network error! If you are using Brave browser, you must enable 'Google Services for Push Messaging and Web Speech API' in brave://settings/googleServices. Otherwise, check your internet connection.");
          } else {
            toast.error(`Voice typing error: ${e.error}`);
          }
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Real-time voice transcription is not supported in this browser. Try Google Chrome.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      baseTextRef.current = text;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening... Speak English or Hindi!", { duration: 2500 });
      } catch (err) {
        console.error("[SpeechRecognition]", err);
      }
    }
  };

  const handleSelectChat = (chatKey: "general" | string) => {
    setActiveChat(chatKey);
    setMobileViewChatActive(true);
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // Multi-Tab BroadcastChannel for instantaneous local tab sync
  useEffect(() => {
    if (typeof window === "undefined" || !roomId) return;
    const channel = new BroadcastChannel(`hackord_room_chat_${roomId}`);
    chatChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === "MSG_SENT") {
        const msg: DbMessage = data.payload;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else if (data?.type === "MSG_EDITED") {
        const updated: DbMessage = data.payload;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else if (data?.type === "MSG_DELETED") {
        const msgId: string = data.payload.msgId;
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      } else if (data?.type === "MSG_PINNED") {
        const updated: DbMessage = data.payload;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    };

    return () => {
      channel.close();
    };
  }, [roomId]);

  // Real-time full state polling (reconciling edits, pins, deletes, and new messages)
  useEffect(() => {
    const poll = async () => {
      try {
        const freshMsgs = await getMessages({ data: { roomId } });
        if (Array.isArray(freshMsgs)) {
          setMessages((prev) => {
            // Reconcile new incoming messages for toast notifications
            const prevIds = new Set(prev.map((m) => m.id));
            const brandNew = freshMsgs.filter((m) => !prevIds.has(m.id) && m.author_name !== userName);
            if (brandNew.length > 0) {
              brandNew.forEach((m) => {
                if (m.recipient_name) {
                  if (m.recipient_name === userName) {
                    toast.info(`New direct message from ${m.author_name}: "${m.text.slice(0, 30)}..."`, {
                      id: `dm_${m.id}`,
                      action: {
                        label: "Chat",
                        onClick: () => {
                          setActiveChat(m.author_name);
                          setMobileViewChatActive(true);
                        },
                      },
                    });
                  }
                } else {
                  toast.info(`New message in #general from ${m.author_name}: "${m.text.slice(0, 30)}..."`, {
                    id: `gen_${m.id}`,
                    action: {
                      label: "View",
                      onClick: () => {
                        setActiveChat("general");
                        setMobileViewChatActive(true);
                      },
                    },
                  });
                }
              });
            }

            // Check if any message properties changed (text edits, edited status, pins, count)
            const isDifferent =
              prev.length !== freshMsgs.length ||
              freshMsgs.some((m, idx) => {
                const p = prev[idx];
                return (
                  !p ||
                  p.id !== m.id ||
                  p.text !== m.text ||
                  Boolean(p.edited) !== Boolean(m.edited) ||
                  Boolean(p.pinned) !== Boolean(m.pinned)
                );
              });

            return isDifferent ? freshMsgs : prev;
          });
        }
      } catch {}
    };
    const timer = setInterval(poll, 2500);
    return () => clearInterval(timer);
  }, [roomId, userName]);

  // Filter messages for Search & active channel / DM privacy
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      // 1. Text Search Filter
      if (searchQuery.trim() && !m.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Chat DM Context Privacy Filter
      if (activeChat === "general") {
        return !m.recipient_name;
      } else {
        return (
          (m.author_name === userName && m.recipient_name === activeChat) ||
          (m.author_name === activeChat && m.recipient_name === userName)
        );
      }
    });
  }, [messages, activeChat, searchQuery, userName]);

  // Pinned list for cycling jump
  const activeChatPinnedMessages = useMemo(() => {
    return filteredMessages.filter((m) => m.pinned);
  }, [filteredMessages]);

  const handleCyclePinned = () => {
    if (activeChatPinnedMessages.length === 0) return;
    const targetIdx = pinCycleIndex % activeChatPinnedMessages.length;
    const targetMsg = activeChatPinnedMessages[targetIdx];
    setPinCycleIndex((prev) => prev + 1);

    const el = document.getElementById(`msg-${targetMsg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(targetMsg.id);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    }
  };

  const handleStartEdit = (msg: DbMessage) => {
    setEditingMessage(msg);
    setText(msg.text);
    setReplyingTo(null);
    setActiveMenuId(null);
  };

  const handleStartReply = (msg: DbMessage) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    setActiveMenuId(null);
  };

  // API Message Actions with BroadcastChannel real-time dispatch
  const handleTogglePin = async (msg: DbMessage) => {
    try {
      const updated = await updateMessage({
        roomId,
        messageId: msg.id,
        data: { pinned: !msg.pinned },
      });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
      chatChannelRef.current?.postMessage({ type: "MSG_PINNED", payload: updated });
      toast.success(msg.pinned ? "Message unpinned" : "Message pinned");
    } catch {
      toast.error("Failed to update message pin state");
    }
    setActiveMenuId(null);
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteMessage({ roomId, messageId: msgId });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      chatChannelRef.current?.postMessage({ type: "MSG_DELETED", payload: { msgId } });
      toast.success("Message deleted successfully");
    } catch {
      toast.error("Failed to delete message");
    }
    setActiveMenuId(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      if (editingMessage) {
        // Edit Message Flow
        const updated = await updateMessage({
          roomId,
          messageId: editingMessage.id,
          data: { text: text.trim() },
        });
        setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? updated : m)));
        chatChannelRef.current?.postMessage({ type: "MSG_EDITED", payload: updated });
        toast.success("Message updated");
        setEditingMessage(null);
      } else {
        // Send Message Flow
        const recipientName = activeChat === "general" ? null : activeChat;
        const replyTo = replyingTo ? `Replying to @${replyingTo.author_name}: "${replyingTo.text.slice(0, 35)}..."` : null;

        const msg = await sendMessage({
          data: {
            roomId,
            text: text.trim(),
            authorName: userName,
            authorAvatar: userAvatar,
            recipientName,
            replyTo,
          },
        });
        setMessages((prev) => {
          latestTsRef.current = msg.created_at;
          return [...prev, msg];
        });
        chatChannelRef.current?.postMessage({ type: "MSG_SENT", payload: msg });
        setReplyingTo(null);
      }
      if (isRecording && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsRecording(false);
      }
      setText("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    if (!activeMenuId) return;
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [activeMenuId]);

  // Date Separators formatting (like WhatsApp)
  const getMessageDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    }
  };

  const otherMembers = members.filter((m) => m.user_name !== userName);
  let previousDateLabel = "";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-0 glass rounded-3xl border border-border shadow-spatial overflow-hidden h-[620px] transition-all duration-300",
        isSidebarCollapsed ? "md:grid-cols-[70px_1fr]" : "md:grid-cols-[260px_1fr]"
      )}
    >
      
      {/* 1. Left Sidebar: Channels & Private DMs */}
      <div
        className={cn(
          "border-r border-border bg-sidebar/40 p-4 flex flex-col h-full overflow-hidden transition-all duration-300",
          isSidebarCollapsed && "md:p-2 items-center",
          mobileViewChatActive ? "hidden md:flex" : "flex"
        )}
      >
        <div className="flex items-center justify-between mb-3 w-full">
          {!isSidebarCollapsed && (
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Channels</h3>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden md:block p-1 hover:bg-sidebar-accent rounded-lg text-muted-foreground transition ml-auto shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          onClick={() => handleSelectChat("general")}
          className={cn(
            "w-full flex items-center transition mb-4",
            isSidebarCollapsed ? "justify-center p-2 rounded-xl" : "gap-2 px-3 py-2 rounded-xl text-sm font-medium",
            activeChat === "general"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          )}
          title={isSidebarCollapsed ? "General Channel" : ""}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          {!isSidebarCollapsed && <span className="ml-2 font-medium">#general</span>}
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
          {!isSidebarCollapsed && (
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Private Chats</h3>
          )}
          {otherMembers.length === 0 ? (
            !isSidebarCollapsed && <p className="text-[11px] text-muted-foreground italic px-2">No other members in room</p>
          ) : (
            <div className="space-y-1 w-full">
              {otherMembers.map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => handleSelectChat(m.user_name)}
                  className={cn(
                    "w-full flex items-center transition",
                    isSidebarCollapsed ? "justify-center p-1.5 rounded-xl" : "gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium",
                    activeChat === m.user_name
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
                  title={isSidebarCollapsed ? m.user_name : ""}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={m.user_avatar} />
                    <AvatarFallback className="bg-primary/20 text-[10px] text-primary">{m.user_name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {!isSidebarCollapsed && <span className="truncate">{m.user_name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Pane: Chat Window & Controls */}
      <div
        className={cn(
          "flex flex-col h-full bg-card/10 overflow-hidden relative transition-all duration-300",
          mobileViewChatActive ? "flex" : "hidden md:flex"
        )}
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border p-4 gap-3 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Back Button (WhatsApp style navigation) */}
            <button
              type="button"
              onClick={() => setMobileViewChatActive(false)}
              className="md:hidden p-1.5 hover:bg-sidebar-accent rounded-lg text-muted-foreground transition shrink-0"
              title="Back to conversation list"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-base truncate">
                {activeChat === "general" ? "#general" : `@${activeChat}`}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeChat === "general" ? "Public team workspace chat" : `Private conversation with ${activeChat}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input inside Chat */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="pl-8 pr-3 py-1 text-xs rounded-xl border border-border bg-background/50 outline-none w-32 sm:w-44 focus:border-primary/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pinned Cycling Badge */}
            {activeChatPinnedMessages.length > 0 && (
              <button
                onClick={handleCyclePinned}
                className="flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/30 px-2.5 py-1 text-[11px] font-semibold text-warning shadow-sm hover:bg-warning/20 transition cursor-pointer shrink-0"
                title="Click to jump to pinned messages (cycle)"
              >
                <Pin className="h-3 w-3 shrink-0" />
                <span>{activeChatPinnedMessages.length} Pinned</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Thread Box (Scrollable) */}
        <div
          ref={chatScrollContainerRef}
          className="flex-1 space-y-3.5 overflow-y-auto p-4 custom-scrollbar bg-slate-950/5 dark:bg-black/5"
        >
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <MessageSquare className="h-10 w-10 text-muted-foreground/35 mb-2.5" />
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "No messages matching search query." : "No messages here. Say hi 👋"}
              </p>
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isSelf = m.author_name === userName;
              const dateLabel = getMessageDateLabel(m.created_at);
              const showDate = dateLabel !== previousDateLabel;
              previousDateLabel = dateLabel;

              return (
                <div key={m.id} className="space-y-3">
                  {showDate && (
                    <div className="flex justify-center my-3 select-none">
                      <span className="rounded-full bg-card/80 border border-border px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-muted-foreground shadow-sm">
                        {dateLabel}
                      </span>
                    </div>
                  )}

                  <div className={cn("flex items-start gap-2 max-w-[88%] sm:max-w-[75%] group relative min-w-0", isSelf ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    
                    {/* Avatar (Left side only for others) */}
                    {!isSelf && (
                      <Avatar className="h-8.5 w-8.5 shrink-0 border border-border shadow-sm">
                        <AvatarImage src={m.author_avatar} />
                        <AvatarFallback className="bg-primary/20 text-[10px] text-primary">{m.author_name[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}

                    {/* Speech Bubble */}
                    <div
                      id={`msg-${m.id}`}
                      className={cn(
                        "relative p-3 rounded-2xl text-xs leading-relaxed shadow-sm transition-all duration-300 border min-w-0 overflow-hidden",
                        isSelf
                          ? "bg-primary text-white border-transparent rounded-tr-md rounded-bl-2xl rounded-br-2xl shadow-card"
                          : "bg-card border-border text-foreground rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl",
                        highlightedMsgId === m.id && "ring-2 ring-warning ring-offset-2 ring-offset-background scale-[1.02]"
                      )}
                    >
                      {/* Replying context text */}
                      {m.reply_to && (
                        <div className={cn(
                          "mb-1.5 rounded-lg border-l-2 p-1.5 text-[10px] font-mono leading-snug truncate",
                          isSelf ? "bg-white/10 border-white/50 text-white/90" : "bg-muted/40 border-primary/50 text-muted-foreground"
                        )}>
                          {m.reply_to}
                        </div>
                      )}

                      {/* Header (Author & Time) */}
                      <div className="flex items-center gap-2 mb-1 justify-between flex-wrap">
                        <span className={cn("font-bold text-[11px]", isSelf ? "text-white/90" : "text-primary")}>
                          {isSelf ? "You" : m.author_name}
                        </span>
                        <span className={cn("text-[9px]", isSelf ? "text-white/60" : "text-muted-foreground")}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Text */}
                      <RenderSmartText text={m.text} className="break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap font-medium block" />

                      {/* Bottom status badges */}
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        {m.edited && (
                          <span className={cn("text-[8px] font-semibold italic", isSelf ? "text-white/60" : "text-muted-foreground")}>
                            edited
                          </span>
                        )}
                        {m.pinned && (
                          <Pin className="h-2.5 w-2.5 text-warning shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Three-dots contextual dropdown (Always visible on mobile) */}
                    <div className={cn("sm:opacity-0 opacity-100 group-hover:opacity-100 transition duration-200 self-center shrink-0 relative", isSelf ? "mr-1" : "ml-1")}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === m.id ? null : m.id);
                        }}
                        className="p-1 hover:bg-sidebar-accent rounded-lg text-muted-foreground transition"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {activeMenuId === m.id && (
                        <div className={cn(
                          "absolute z-40 min-w-[125px] rounded-xl border border-border bg-popover/90 p-1 shadow-spatial backdrop-blur-md text-[11px]",
                          isSelf ? "right-6 top-0" : "left-6 top-0"
                        )}>
                          <button
                            onClick={() => handleStartReply(m)}
                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-foreground hover:bg-accent transition"
                          >
                            <Reply className="h-3.5 w-3.5 text-primary shrink-0" /> Reply
                          </button>
                          {isSelf && (
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-foreground hover:bg-accent transition"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary shrink-0" /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePin(m)}
                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-foreground hover:bg-accent transition"
                          >
                            <Pin className="h-3.5 w-3.5 text-warning shrink-0" /> {m.pinned ? "Unpin" : "Pin"}
                          </button>
                          {isSelf && (
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-destructive hover:bg-destructive/15 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive shrink-0" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply / Edit contextual banners */}
        {replyingTo && (
          <div className="flex items-center justify-between border-t border-border bg-sidebar-accent/70 px-4 py-2 text-[11px] backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-bold text-foreground">Replying to @{replyingTo.author_name}:</span>
              <span className="truncate italic">"{replyingTo.text}"</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {editingMessage && (
          <div className="flex items-center justify-between border-t border-border bg-sidebar-accent/70 px-4 py-2 text-[11px] backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Edit className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-bold text-foreground">Editing message:</span>
              <span className="truncate italic">"{editingMessage.text}"</span>
            </div>
            <button onClick={() => { setEditingMessage(null); setText(""); }} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {/* Input Form Controls */}
        <form className="flex items-center gap-2 border-t border-border p-3 bg-card/25 backdrop-blur-md" onSubmit={handleSend}>
          {/* Speech Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              "p-2.5 rounded-xl border transition shadow-sm shrink-0",
              isRecording
                ? "bg-red-500/15 border-red-500 text-red-500 animate-pulse shadow-md"
                : "bg-sidebar-accent/60 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
            )}
            title="Speech-to-Text Voice Typing (Hindi / English)"
          >
            {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              editingMessage
                ? "Edit message..."
                : activeChat === "general"
                  ? "Message #general"
                  : `Message @${activeChat}...`
            }
            disabled={sending}
            className="flex-1"
          />

          <Button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-gradient-brand text-white shadow-glow hover:opacity-90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
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

/* ------------------------ AI Workspace (ChatGPT / Gemini Style) ------------------------ */
interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  plugin?: string;
  structuredOutput?: string;
}

interface AIChat {
  id: string;
  title: string;
  pinned: boolean;
  activePlugin?: string;
  updatedAt: string;
  messages: AIChatMessage[];
}

const INITIAL_AI_CHATS: AIChat[] = [
  {
    id: "chat-1",
    title: "Link Monetization Process",
    pinned: true,
    updatedAt: "2 hours ago",
    messages: [
      { id: "m1", sender: "user", text: "How can we monetize external project links effectively?", timestamp: "10:30 AM" },
      { id: "m2", sender: "ai", text: "Here is a breakdown of link monetization strategies:\n\n1. **Affiliate Link Tracking**: Automatically append affiliate codes to vendor tools.\n2. **Sponsorship Banners**: Show sponsored tech stack logos alongside repository links.\n3. **Paywalled Micro-courses**: Gated deep-dives for project templates.", timestamp: "10:31 AM" },
    ],
  },
  {
    id: "chat-2",
    title: "Resume summary rewrite",
    pinned: true,
    updatedAt: "Yesterday",
    messages: [
      { id: "m3", sender: "user", text: "Rewrite my project summary for full-stack engineer role.", timestamp: "Yesterday" },
      { id: "m4", sender: "ai", text: "Here is a polished executive summary ready for top tech roles:\n\n> *Full-Stack Engineer with expertise in React, TypeScript, Node.js, and real-time collaboration apps. Proven track record building high-concurrency Agora audio/video integrations and AI-assisted developer tools.*", timestamp: "Yesterday" },
    ],
  },
  {
    id: "chat-3",
    title: "Web Dev Project Ideas",
    pinned: true,
    updatedAt: "2 days ago",
    messages: [
      { id: "m5", sender: "user", text: "Give me 3 innovative hackathon ideas combining AI + WebRTC.", timestamp: "2 days ago" },
      { id: "m6", sender: "ai", text: "1. **Real-time AI Interview Coach**: Analyzes speech tone, eye contact, and technical accuracy live during WebRTC calls.\n2. **Smart Meeting Summarizer**: Extracts action items, flowcharts, and task tickets live during hackathon syncs.\n3. **Peer-to-Peer Code Pair AI**: Live pair-programming bot that watches canvas state.", timestamp: "2 days ago" },
    ],
  },
  {
    id: "chat-4",
    title: "PromptWars Hack2Skill",
    pinned: true,
    updatedAt: "3 days ago",
    messages: [
      { id: "m7", sender: "user", text: "Help me structure prompt strategy for PromptWars competition.", timestamp: "3 days ago" },
      { id: "m8", sender: "ai", text: "Use system role-pinning, zero-shot chain of thought, and structured JSON output formats to ensure 99%+ consistency.", timestamp: "3 days ago" },
    ],
  },
  {
    id: "chat-5",
    title: "IIT Bombay Internship Guide",
    pinned: true,
    updatedAt: "4 days ago",
    messages: [
      { id: "m9", sender: "user", text: "What are key points to focus on for research internships?", timestamp: "4 days ago" },
      { id: "m10", sender: "ai", text: "Focus on published open-source contributions, clear statement of purpose (SOP), and demonstrating proficiency with PyTorch / system architecture.", timestamp: "4 days ago" },
    ],
  },
  {
    id: "chat-6",
    title: "Google Campus Ambassador...",
    pinned: true,
    updatedAt: "5 days ago",
    messages: [
      { id: "m11", sender: "user", text: "Draft application essay for campus ambassador program.", timestamp: "5 days ago" },
      { id: "m12", sender: "ai", text: "Here is a compelling draft highlighting community leadership, hackathon organizing experience, and technical outreach passion.", timestamp: "5 days ago" },
    ],
  },
  {
    id: "chat-7",
    title: "Hackord Project",
    pinned: false,
    updatedAt: "Today",
    messages: [
      { id: "m13", sender: "user", text: "What features are implemented in Hackord?", timestamp: "11:00 AM" },
      { id: "m14", sender: "ai", text: "Hackord includes Rooms, Live Agora Audio/Video meetings, Real-time Chat with Voice-to-Text, Task Management, GitHub Live Stats, and AI Workspace.", timestamp: "11:01 AM" },
    ],
  },
  {
    id: "chat-8",
    title: "Instagram Carousel Design",
    pinned: false,
    updatedAt: "Yesterday",
    messages: [
      { id: "m15", sender: "user", text: "Create slide outline for 5-slide tech tips carousel.", timestamp: "Yesterday" },
      { id: "m16", sender: "ai", text: "Slide 1: Hook Headline\nSlide 2: The Core Problem\nSlide 3: Step-by-Step Solution\nSlide 4: Code Snippet Example\nSlide 5: Call to Action (Follow & Save)", timestamp: "Yesterday" },
    ],
  },
  {
    id: "chat-9",
    title: "Face Swap Description",
    pinned: false,
    updatedAt: "3 days ago",
    messages: [
      { id: "m17", sender: "user", text: "Write technical explanation for face swap pipeline.", timestamp: "3 days ago" },
      { id: "m18", sender: "ai", text: "Uses InsightFace embeddings + GAN-based face alignment for zero-shot identity transfer.", timestamp: "3 days ago" },
    ],
  },
  {
    id: "chat-10",
    title: "Image Modification Request",
    pinned: false,
    updatedAt: "4 days ago",
    messages: [
      { id: "m19", sender: "user", text: "How to apply background blur dynamically in canvas?", timestamp: "4 days ago" },
      { id: "m20", sender: "ai", text: "Use HTML5 Canvas `ctx.filter = 'blur(10px)'` or WebGL shaders for hardware-accelerated real-time segmentation.", timestamp: "4 days ago" },
    ],
  },
  {
    id: "chat-11",
    title: "Improved Study Prompt",
    pinned: false,
    updatedAt: "5 days ago",
    messages: [
      { id: "m21", sender: "user", text: "Generate Feynman technique prompt for DSA algorithms.", timestamp: "5 days ago" },
      { id: "m22", sender: "ai", text: "Prompt created! 'Explain QuickSort as if I am 10 years old, using plain English and visual analogies.'", timestamp: "5 days ago" },
    ],
  },
  {
    id: "chat-12",
    title: "AI for SEO Automation",
    pinned: false,
    updatedAt: "6 days ago",
    messages: [
      { id: "m23", sender: "user", text: "How to automate meta descriptions with LLMs?", timestamp: "6 days ago" },
      { id: "m24", sender: "ai", text: "Extract page H1 + introductory paragraph -> Pass to Gemini API with strict 155-character constraints -> Write meta tag to head dynamically.", timestamp: "6 days ago" },
    ],
  },
  {
    id: "chat-13",
    title: "DSA Roadmap in Java",
    pinned: false,
    updatedAt: "1 week ago",
    messages: [
      { id: "m25", sender: "user", text: "What order should I learn Java data structures?", timestamp: "1 week ago" },
      { id: "m26", sender: "ai", text: "Arrays -> ArrayList -> LinkedList -> Stack/Queue -> HashMap/HashSet -> Trees (BST) -> Graphs -> Dynamic Programming.", timestamp: "1 week ago" },
    ],
  },
];

function AITab() {
  const [chats, setChats] = useState<AIChat[]>(INITIAL_AI_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>("chat-8"); // default selected chat
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const [recentsCollapsed, setRecentsCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileViewChatActive, setMobileViewChatActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Input state
  const [input, setInput] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [showPluginPicker, setShowPluginPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // File upload hidden ref & base text ref for speech dictation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === selectedChatId) || null;
  }, [chats, selectedChatId]);

  // Filtered chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chats, searchQuery]);

  const pinnedChats = useMemo(() => filteredChats.filter((c) => c.pinned), [filteredChats]);
  const recentChats = useMemo(() => filteredChats.filter((c) => !c.pinned), [filteredChats]);

  // Voice speech to text initialization (Exact non-duplicating logic from ChatTab)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN";

        rec.onresult = (event: any) => {
          let finalSessionTranscript = "";
          let interimSessionTranscript = "";

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalSessionTranscript += transcript;
            } else {
              interimSessionTranscript += transcript;
            }
          }

          const sessionTranscript = (finalSessionTranscript + interimSessionTranscript).trim();
          if (sessionTranscript) {
            const newText = baseTextRef.current
              ? `${baseTextRef.current} ${sessionTranscript}`
              : sessionTranscript;
            setInput(newText);
          }
        };

        rec.onerror = (e: any) => {
          console.error("[Voice typing error]", e.error);
          setIsRecording(false);
          toast.error(`Voice typing error: ${e.error}`);
        };

        rec.onend = () => setIsRecording(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }
    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
      toast.info("Voice typing stopped.");
    } else {
      baseTextRef.current = input;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening... Speak English or Hindi!", { duration: 2500 });
      } catch (err) {
        console.error(err);
        toast.error("Could not start microphone.");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.endsWith("/") || val.endsWith("@")) {
      setShowPluginPicker(true);
    } else if (showPluginPicker && !val.includes("/") && !val.includes("@")) {
      setShowPluginPicker(false);
    }
  };

  const handleSelectPlugin = (toolKey: string) => {
    const tool = AI_TOOLS.find((t) => t.key === toolKey);
    if (tool) {
      setSelectedPlugin(tool.title);
      setShowPluginPicker(false);
      setInput((prev) => prev.replace(/[/@]$/, ""));
      toast.success(`Plugin @${tool.title} attached!`);
    }
  };

  const handleCreateNewChat = (pluginTitle?: string) => {
    const newId = `chat-${Date.now()}`;
    const newChat: AIChat = {
      id: newId,
      title: pluginTitle ? `${pluginTitle} Workspace` : "New Conversation",
      pinned: false,
      activePlugin: pluginTitle,
      updatedAt: "Just now",
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          sender: "ai",
          text: pluginTitle
            ? `Welcome to **${pluginTitle}** mode! How can I assist you with your project today?`
            : "Hello! I am your AI Workspace assistant. Ask me anything, generate diagrams, PPTs, or READMEs.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          plugin: pluginTitle,
        },
      ],
    };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newId);
    setMobileViewChatActive(true);
    if (pluginTitle) setSelectedPlugin(pluginTitle);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMobileViewChatActive(true);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedPlugin) return;

    let targetChatId = selectedChatId;
    if (!targetChatId) {
      const newId = `chat-${Date.now()}`;
      const newChat: AIChat = {
        id: newId,
        title: input.trim().slice(0, 24) || "New Chat",
        pinned: false,
        activePlugin: selectedPlugin || undefined,
        updatedAt: "Just now",
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      targetChatId = newId;
      setSelectedChatId(newId);
      setMobileViewChatActive(true);
    }

    const userMsgText = input.trim();
    const currentPlugin = selectedPlugin;
    const userMsg: AIChatMessage = {
      id: `m-user-${Date.now()}`,
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      plugin: currentPlugin || undefined,
    };

    let aiResponseText = `Processing request for: "${userMsgText}"...\n\n`;
    if (currentPlugin === "Generate PPT") {
      aiResponseText += "### 📊 Presentation Deck Outline Generated\n\n1. **Slide 1: Executive Summary**\n   - Problem & Opportunity\n   - Market Gap\n2. **Slide 2: System Architecture**\n   - Real-time WebRTC + LLM orchestration\n3. **Slide 3: Roadmap & Financials**\n   - Go-to-market plan.";
    } else if (currentPlugin === "Workflow Diagram" || currentPlugin === "Architecture Diagram") {
      aiResponseText += "### 🌐 Mermaid System Flowchart\n\n```mermaid\ngraph TD\n  A[User Web Client] -->|WebSockets| B[Express API Gateway]\n  B -->|Webhooks| C[ViaSocket Automation]\n  C -->|Alerts| D[WhatsApp Business API]\n  B -->|AI Context| E[Gemini / LLM Service]\n```";
    } else {
      aiResponseText += `Here is the structured solution for your inquiry:\n\n- **Analysis**: Evaluated prompt input.\n- **Recommendation**: Deploy with modular service boundary.\n- **Status**: Completed successfully.`;
    }

    const aiMsg: AIChatMessage = {
      id: `m-ai-${Date.now()}`,
      sender: "ai",
      text: aiResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      plugin: currentPlugin || undefined,
    };

    setChats((prev) =>
      prev.map((c) => (c.id === targetChatId ? { ...c, updatedAt: "Just now", messages: [...c.messages, userMsg, aiMsg] } : c))
    );

    setInput("");
    setSelectedPlugin(null);
    setShowPluginPicker(false);
  };

  const handlePinChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c))
    );
    toast.success("Chat pin status updated");
  };

  const handleRenameChat = (chatId: string) => {
    const currentChat = chats.find((c) => c.id === chatId);
    const newTitle = window.prompt("Enter new title for conversation:", currentChat?.title);
    if (newTitle && newTitle.trim()) {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: newTitle.trim() } : c))
      );
      toast.success("Chat renamed");
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
      setMobileViewChatActive(false);
    }
    toast.success("Chat deleted");
  };

  const handleShareChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      navigator.clipboard.writeText(`${window.location.href}?chat=${chat.id}`);
      toast.success(`Share link for "${chat.title}" copied to clipboard!`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      setInput((prev) => `${prev} [Attached file: ${fileName}]`);
      toast.success(`File "${fileName}" attached as context.`);
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-0 glass rounded-3xl border border-border shadow-spatial overflow-hidden h-[620px] transition-all duration-300",
        isSidebarCollapsed ? "md:grid-cols-[70px_1fr]" : "md:grid-cols-[260px_1fr]"
      )}
    >
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      {/* ---------------- 1. LEFT SIDEBAR (MATCHES CHATTAB SIDEBAR THEME) ---------------- */}
      <div
        className={cn(
          "border-r border-border bg-sidebar/40 p-4 flex flex-col h-full overflow-hidden transition-all duration-300",
          isSidebarCollapsed ? "md:p-2 items-center w-full md:w-[70px]" : "w-full md:w-[260px]",
          mobileViewChatActive ? "hidden md:flex" : "flex"
        )}
      >
        {isSidebarCollapsed ? (
          /* COLLAPSED SIDEBAR TOOLBAR (Only +, Search, Pin, All Conversations icons) */
          <div className="flex flex-col items-center gap-3 py-1 w-full">
            {/* Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1.5 hover:bg-sidebar-accent rounded-lg text-muted-foreground hover:text-foreground transition mb-1"
              title="Expand Sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* New Chat (+) Button */}
            <button
              type="button"
              onClick={() => handleCreateNewChat()}
              className="h-10 w-10 grid place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition shadow-sm"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
              title="Search Conversations"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Pin Icon */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
              title="Pinned Conversations"
            >
              <Pin className="h-4.5 w-4.5 text-primary" />
            </button>

            {/* All Conversations Icon */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
              title="All Conversations"
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          /* EXPANDED SIDEBAR CONTENT */
          <>
            {/* Sidebar Header & Collapse Toggle */}
            <div className="flex items-center justify-between mb-3 w-full">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Workspaces</h3>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="hidden md:block p-1 hover:bg-sidebar-accent rounded-lg text-muted-foreground transition ml-auto shrink-0"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={() => handleCreateNewChat()}
              className="w-full flex items-center justify-between transition mb-3 rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20 px-3 py-2 text-xs font-medium"
              title="New Chat"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <Plus className="h-4 w-4 shrink-0 text-primary" />
                <span>New Chat</span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-primary/80" />
            </button>

            {/* Search Bar for Chats */}
            <div className="relative mb-3 w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-border bg-background/50 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sidebar Scroll Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar w-full space-y-4">
              {/* PINNED SECTION */}
              <div>
                <button
                  onClick={() => setPinnedCollapsed(!pinnedCollapsed)}
                  className="flex w-full items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground"
                >
                  <span className="flex items-center gap-1">
                    Pinned
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", pinnedCollapsed && "-rotate-90")} />
                  </span>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{pinnedChats.length}</span>
                </button>

                {!pinnedCollapsed && (
                  <div className="space-y-1 w-full">
                    {pinnedChats.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "group relative flex items-center justify-between transition cursor-pointer gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium",
                          selectedChatId === c.id
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm font-semibold"
                            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        )}
                        onClick={() => handleSelectChat(c.id)}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">{c.title}</span>
                        </div>

                        {/* 3 Dots Menu (Always visible on mobile!) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="h-6 w-6 rounded-md sm:opacity-0 opacity-100 group-hover:opacity-100 flex items-center justify-center hover:bg-sidebar-accent transition shrink-0">
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 z-50">
                            <DropdownMenuItem onClick={() => handleShareChat(c.id)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRenameChat(c.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePinChat(c.id)}>
                              <Pin className="mr-2 h-4 w-4" /> Unpin chat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteChat(c.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ALL CONVERSATIONS / RECENTS SECTION */}
              <div>
                <button
                  onClick={() => setRecentsCollapsed(!recentsCollapsed)}
                  className="flex w-full items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground"
                >
                  <span className="flex items-center gap-1">
                    All Conversations
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", recentsCollapsed && "-rotate-90")} />
                  </span>
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">{recentChats.length}</span>
                </button>

                {!recentsCollapsed && (
                  <div className="space-y-1 w-full">
                    {recentChats.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "group relative flex items-center justify-between transition cursor-pointer gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium",
                          selectedChatId === c.id
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm font-semibold"
                            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        )}
                        onClick={() => handleSelectChat(c.id)}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="truncate">{c.title}</span>
                        </div>

                        {/* 3 Dots Menu (Always visible on mobile!) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="h-6 w-6 rounded-md sm:opacity-0 opacity-100 group-hover:opacity-100 flex items-center justify-center hover:bg-sidebar-accent transition shrink-0">
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 z-50">
                            <DropdownMenuItem onClick={() => handleShareChat(c.id)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRenameChat(c.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePinChat(c.id)}>
                              <Pin className="mr-2 h-4 w-4" /> Pin chat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteChat(c.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ---------------- 2. RIGHT MAIN PANEL (MATCHES CHATTAB RIGHT PANE THEME) ---------------- */}
      <div
        className={cn(
          "flex flex-col h-full bg-card/10 overflow-hidden relative transition-all duration-300",
          mobileViewChatActive ? "flex" : "hidden md:flex"
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border p-4 gap-3 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Back Button (WhatsApp style navigation) */}
            <button
              type="button"
              onClick={() => {
                setMobileViewChatActive(false);
                setSelectedChatId(null);
              }}
              className="p-1.5 hover:bg-sidebar-accent rounded-lg text-muted-foreground transition shrink-0"
              title="Back to conversation list"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-base truncate flex items-center gap-2">
                {activeChat ? activeChat.title : "AI Workspace"}
                {activeChat?.activePlugin && (
                  <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs shrink-0">
                    @{activeChat.activePlugin}
                  </Badge>
                )}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeChat ? `AI Workspace conversation thread` : "Specialized AI automation & plugin tools"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateNewChat()}
              className="h-8 gap-1.5 text-xs border-border hover:bg-accent shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </div>

        {/* Message Thread Box / Tools Overview (Scrollable, identical background) */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-4 custom-scrollbar bg-slate-950/5 dark:bg-black/5">
          {!selectedChatId ? (
            /* TOOLS OVERVIEW & PURPOSE SECTION */
            <div className="space-y-5 max-w-4xl mx-auto py-2">
              {/* Purpose Header & New Chat Button */}
              <div className="glass rounded-2xl p-6 border border-border bg-card/30 text-center space-y-4 shadow-sm my-auto">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand-soft shadow-md">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                    AI Workspace & Plugin Suite
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    AI Workspace empowers your team with specialized AI plugins for generating presentation pitch decks, architecture flowcharts, automated READMEs, tech stack proposals, and structured project documentation.
                  </p>
                </div>

                <div>
                  <Button
                    onClick={() => handleCreateNewChat()}
                    className="bg-gradient-brand text-white shadow-glow hover:opacity-90 px-5 py-2.5 text-sm gap-2 rounded-xl font-semibold"
                  >
                    <Plus className="h-4 w-4" /> Start New Conversation
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT MESSAGES THREAD (MATCHES CHATTAB BUBBLES 1:1) */
            <div className="space-y-3.5 max-w-4xl mx-auto">
              {activeChat?.messages.map((m) => {
                const isSelf = m.sender === "user";
                return (
                  <div key={m.id} className={cn("flex items-start gap-2 max-w-[88%] sm:max-w-[75%] group relative min-w-0", isSelf ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    {/* AI Avatar */}
                    {!isSelf && (
                      <Avatar className="h-8.5 w-8.5 shrink-0 border border-border shadow-sm">
                        <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">AI</AvatarFallback>
                      </Avatar>
                    )}

                    {/* Speech Bubble (Identical to ChatTab) */}
                    <div
                      className={cn(
                        "relative p-3 rounded-2xl text-xs leading-relaxed shadow-sm transition-all duration-300 border min-w-0 overflow-hidden",
                        isSelf
                          ? "bg-primary text-white border-transparent rounded-tr-md rounded-bl-2xl rounded-br-2xl shadow-card"
                          : "bg-card border-border text-foreground rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                      )}
                    >
                      {/* Header (Author & Time) */}
                      <div className="flex items-center gap-2 mb-1 justify-between flex-wrap">
                        <span className={cn("font-bold text-[11px]", isSelf ? "text-white/90" : "text-primary")}>
                          {isSelf ? "You" : "Hackord AI Assistant"}
                        </span>
                        <span className={cn("text-[9px]", isSelf ? "text-white/60" : "text-muted-foreground")}>
                          {m.timestamp}
                        </span>
                      </div>

                      {/* Text */}
                      <div className="break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap font-medium">
                        {m.text}
                      </div>

                      {/* Copy Action */}
                      {!isSelf && (
                        <div className="flex items-center gap-2 pt-1.5 border-t border-border/30 mt-1.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(m.text);
                              toast.success("Response copied to clipboard!");
                            }}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
                          >
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ---------------- 3. INPUT FORM (MATCHES CHATTAB INPUT BAR THEME) ---------------- */}
        <form
          className="flex items-center gap-2 border-t border-border p-3 bg-card/25 backdrop-blur-md relative"
          onSubmit={handleSendMessage}
        >
          {/* Plugin Autocomplete Popover (Triggered by / or @) */}
          {showPluginPicker && (
            <div className="absolute bottom-full left-4 sm:left-6 mb-2 w-72 sm:w-80 rounded-xl border border-border bg-popover/95 p-2 shadow-spatial backdrop-blur-md z-50 space-y-1 text-xs">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Plugin Tool
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                {AI_TOOLS.map((tool) => (
                  <button
                    key={tool.key}
                    type="button"
                    onClick={() => handleSelectPlugin(tool.key)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-foreground hover:bg-accent transition text-left"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div>
                      <div className="font-medium">@{tool.title}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{tool.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plus / Attach Button Dropdown (Styled like ChatTab controls) */}
          <DropdownMenu open={showAttachMenu} onOpenChange={setShowAttachMenu}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2.5 rounded-xl border border-border bg-sidebar-accent/60 text-muted-foreground hover:border-primary/50 hover:text-primary transition shadow-sm shrink-0"
                title="Attach files or choose plugins"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56 z-50 space-y-0.5 text-xs">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" /> Add photos & files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPluginPicker(true)}>
                <Sparkles className="mr-2 h-4 w-4 text-primary" /> Plugins
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateNewChat()}>
                <Plus className="mr-2 h-4 w-4" /> New chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleRecording()}>
                <Mic className="mr-2 h-4 w-4" /> Dictate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => selectedChatId && handlePinChat(selectedChatId)}>
                <Pin className="mr-2 h-4 w-4" /> Pin chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Speech Mic Button (Identical to ChatTab) */}
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              "p-2.5 rounded-xl border transition shadow-sm shrink-0",
              isRecording
                ? "bg-red-500/15 border-red-500 text-red-500 animate-pulse shadow-md"
                : "bg-sidebar-accent/60 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
            )}
            title="Speech-to-Text Voice Typing (Hindi / English)"
          >
            {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>

          {/* Input Field (Identical to ChatTab) */}
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              selectedPlugin
                ? `Plugin @${selectedPlugin} active... enter prompt`
                : "Ask AI or type / or @ for plugins..."
            }
            className="flex-1 rounded-xl border border-border bg-background/50 text-xs sm:text-sm h-10 px-3 outline-none focus:border-primary/50 transition min-w-0"
          />

          {/* Send Button (Identical to ChatTab) */}
          <Button
            type="submit"
            disabled={!input.trim() && !selectedPlugin}
            className="bg-gradient-brand text-white shadow-glow hover:opacity-90 rounded-xl px-3.5 h-10 gap-1.5 text-xs font-semibold shrink-0"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------ GitHub Live Stats ------------------------ */
function GithubTab({
  room, onRoomUpdate, isOwnerOrAdmin = false,
}: {
  room: DbRoom; onRoomUpdate?: () => void; isOwnerOrAdmin?: boolean;
}) {
  const defaultGithubUrl = room.github_url || room.project_links?.find(l => l.url?.includes("github.com"))?.url || "https://github.com/SAFAL-TIWARI/Hackord";
  
  const [repoUrl, setRepoUrl] = useState<string>(defaultGithubUrl);
  const [data, setData] = useState<GithubWorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state for connecting/changing repo
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [connecting, setConnecting] = useState<boolean>(false);

  const parsedCurrent = useMemo(() => parseGithubUrl(repoUrl), [repoUrl]);

  // Determine Live Demo Website URL (from GitHub homepage or room project links)
  const liveDemoUrl = useMemo(() => {
    if (data?.repoInfo.homepage) return data.repoInfo.homepage;
    const roomDemoLink = room.project_links?.find(l => 
      l.label?.toLowerCase().includes("demo") || 
      l.label?.toLowerCase().includes("live") || 
      l.url?.includes("vercel.app") || 
      l.url?.includes("netlify.app") || 
      l.url?.includes("render.com")
    );
    return roomDemoLink ? roomDemoLink.url : null;
  }, [data?.repoInfo.homepage, room.project_links]);

  const loadData = async (targetUrl: string, forceRefresh = false) => {
    if (!parseGithubUrl(targetUrl)) {
      setData(null);
      setError("No valid GitHub repository connected yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGithubWorkspaceData(targetUrl, forceRefresh);
      setData(res);
    } catch (err: any) {
      console.error("[GithubTab]", err);
      setError(err.message || "Failed to load live GitHub repository stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (defaultGithubUrl) {
      setRepoUrl(defaultGithubUrl);
      loadData(defaultGithubUrl);
    }
  }, [room.github_url]);

  const handleSaveRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error("Only the Room Owner or Admin can change the connected repository.");
      return;
    }
    const parsed = parseGithubUrl(inputUrl);
    if (!parsed) {
      toast.error("Please enter a valid GitHub URL or owner/repo format (e.g. SAFAL-TIWARI/Hackord)");
      return;
    }
    setConnecting(true);
    try {
      const fullUrl = parsed.repoUrl;
      await updateRoom({
        roomId: room.id,
        data: {
          github_url: fullUrl,
        },
      });
      setRepoUrl(fullUrl);
      toast.success(`Connected repository: ${parsed.fullRepoName}`);
      setOpenModal(false);
      if (onRoomUpdate) onRoomUpdate();
      await loadData(fullUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect repository");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isOwnerOrAdmin) {
      toast.error("Only the Room Owner or Admin can disconnect the repository.");
      return;
    }
    try {
      await updateRoom({
        roomId: room.id,
        data: {
          github_url: "",
        },
      });
      setRepoUrl("");
      setData(null);
      setError("No GitHub repository connected.");
      toast.success("Disconnected repository");
      if (onRoomUpdate) onRoomUpdate();
    } catch (err: any) {
      toast.error("Failed to disconnect repository");
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return "just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* GitHub Repository Header Card */}
      <section className="glass rounded-2xl p-4 sm:p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-gradient-brand-soft border border-primary/20 shrink-0">
              <Github className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate max-w-full">
                  {data?.repoInfo.full_name || parsedCurrent?.fullRepoName || "Repository"}
                </h2>
                {data?.isRateLimited ? (
                  <Badge variant="outline" className="gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] sm:text-[11px] font-medium">
                    <Clock className="h-3 w-3 text-amber-400" /> Cached (API Paused)
                  </Badge>
                ) : data ? (
                  <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] sm:text-[11px] font-medium">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Synced
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px] sm:text-[11px]">
                    Not connected
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 max-w-xl">
                {data?.repoInfo.description || (parsedCurrent ? `Live repository stats for ${parsedCurrent.fullRepoName}` : "Connect a GitHub repository to track real-time commits, open PRs, issues, and team contributors.")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {parsedCurrent && (
              <Button size="sm" variant="outline" onClick={() => loadData(repoUrl, true)} disabled={loading} className="gap-1.5 h-8 sm:h-9 text-xs">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> {loading ? "Syncing..." : "Refresh"}
              </Button>
            )}
            
            {/* Owner & Admin Only Controls */}
            {isOwnerOrAdmin && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setInputUrl(repoUrl || "https://github.com/SAFAL-TIWARI/Hackord");
                    setOpenModal(true);
                  }}
                  className="bg-gradient-brand text-white shadow-glow hover:opacity-90 gap-1.5 h-8 sm:h-9 text-xs"
                >
                  <GitBranch className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {parsedCurrent ? "Change Repo" : "Connect Repository"}
                </Button>
                {parsedCurrent && (
                  <Button size="sm" variant="ghost" onClick={handleDisconnect} title="Disconnect Repository" className="text-xs text-muted-foreground hover:text-destructive h-8 sm:h-9 px-2">
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Repository Key Metrics Bar */}
        {data?.repoInfo && (
          <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 pt-4 border-t border-border/50">
            <div className="rounded-xl border border-border/60 bg-card/40 p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" /> Stars
              </p>
              <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-bold">{data.repoInfo.stargazers_count}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <GitFork className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" /> Forks
              </p>
              <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-bold">{data.repoInfo.forks_count}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <CircleDot className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-warning" /> Open Issues
              </p>
              <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-bold">{data.repoInfo.open_issues_count}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <GitBranch className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" /> Default Branch
              </p>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold truncate">{data.repoInfo.default_branch}</p>
            </div>
          </div>
        )}
      </section>

      {/* Main Responsive Grid: Commits vs Side Cards */}
      {loading ? (
        <div className="glass rounded-2xl p-8 sm:p-12 text-center shadow-card space-y-3">
          <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8 text-primary animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Fetching real-time GitHub data for {parsedCurrent?.fullRepoName}...</p>
        </div>
      ) : error || !data ? (
        <div className="glass rounded-2xl p-6 sm:p-10 text-center shadow-card space-y-4 max-w-2xl mx-auto">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">{error || "No GitHub Repository Connected"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect a public GitHub repository (e.g. <code>https://github.com/SAFAL-TIWARI/Hackord</code>) to view real commit activity, open PRs, issues, and contributors.
            </p>
          </div>
          {isOwnerOrAdmin && (
            <Button
              onClick={() => {
                setInputUrl("https://github.com/SAFAL-TIWARI/Hackord");
                setOpenModal(true);
              }}
              className="bg-gradient-brand text-white shadow-glow text-xs sm:text-sm"
            >
              <GitBranch className="h-4 w-4 mr-2" /> Connect Repo Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left Column: Commit Graph & Latest Commits */}
          <section className="glass rounded-2xl p-4 sm:p-6 shadow-card lg:col-span-2 space-y-6">
            {/* Interactive Responsive Commit Graph */}
            <div className="rounded-xl border border-border/60 bg-card/50 p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <GitCommit className="h-4 w-4 text-primary" /> Recent Commit Activity
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Frequency of commits over the last 28 activity days</p>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs w-fit">{data.commits.length} recent commits</Badge>
              </div>

              <div className="w-full overflow-x-auto custom-scrollbar pt-6 pb-1">
                <div className="flex h-24 sm:h-28 items-end gap-1 sm:gap-1.5 pt-6 min-w-[260px] px-1 relative">
                  {data.commitGraph.map((bar, i) => (
                    <div key={i} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                      {/* Floating hover tooltip showing Date & total commits */}
                      <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md bg-popover px-2.5 py-1 text-[10px] font-medium text-popover-foreground shadow-xl border border-border/80 whitespace-nowrap flex items-center gap-1.5">
                        <span className="font-semibold text-primary">{bar.dateLabel || bar.dayLabel}:</span>
                        <span>{bar.count} commit{bar.count === 1 ? "" : "s"}</span>
                      </div>
                      <div
                        className={cn(
                          "w-full rounded-t transition-all duration-300 cursor-pointer",
                          bar.count > 0 ? "bg-gradient-brand group-hover:brightness-125 group-hover:shadow-glow" : "bg-muted/40 hover:bg-muted/70",
                        )}
                        style={{ height: `${bar.heightPercent}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Latest Commits List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-primary" /> Latest Commits ({data.commits.length})
                </h3>
                <a href={`${data.repoInfo.html_url}/commits`} target="_blank" rel="noreferrer" className="text-[11px] sm:text-xs text-primary hover:underline flex items-center gap-1">
                  View all on GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {data.commits.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No recent commits found.</p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {data.commits.map((c) => (
                    <li key={c.sha} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/60 bg-card/50 p-2.5 sm:p-3 text-xs sm:text-sm hover:border-border transition gap-2">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <Avatar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0">
                          <AvatarImage src={c.authorAvatar} />
                          <AvatarFallback>{c.authorName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-xs text-foreground">{c.message}</p>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">
                            by <span className="text-foreground font-medium">{c.authorName}</span> {c.authorLogin ? `(@${c.authorLogin})` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">{timeAgo(c.date)}</span>
                        <a
                          href={c.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] sm:text-[11px] hover:bg-primary/20 hover:text-primary transition flex items-center gap-1"
                        >
                          {c.shortSha} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Right Column: About, Open PRs, Issues, and Contributors */}
          <div className="space-y-6">
            {/* About & Live Demo URL Section */}
            <section className="glass rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">About</h3>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => {
                      setInputUrl(repoUrl || "https://github.com/SAFAL-TIWARI/Hackord");
                      setOpenModal(true);
                    }}
                    className="text-muted-foreground hover:text-foreground transition"
                    title="Manage repository settings"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {data.repoInfo.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data.repoInfo.description}
                </p>
              )}

              {liveDemoUrl ? (
                <div className="flex items-center gap-2 pt-1">
                  <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={liveDemoUrl.startsWith("http") ? liveDemoUrl : `https://${liveDemoUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary hover:underline truncate"
                  >
                    {liveDemoUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}
                  </a>
                </div>
              ) : (
                isOwnerOrAdmin && (
                  <div className="text-[11px] text-muted-foreground italic flex items-center gap-1.5 pt-1">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span>No live demo URL configured</span>
                  </div>
                )
              )}

              {data.repoInfo.topics && data.repoInfo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {data.repoInfo.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Open PRs */}
            <section className="glass rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-primary" /> Open PRs ({data.prs.length})
                </h3>
                <a href={`${data.repoInfo.html_url}/pulls`} target="_blank" rel="noreferrer" className="text-[11px] sm:text-xs text-muted-foreground hover:text-primary">
                  View all
                </a>
              </div>
              {data.prs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-3.5 text-center">
                  <p className="text-xs text-muted-foreground">No open pull requests</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {data.prs.map((p) => (
                    <li key={p.id} className="rounded-lg border border-border/60 bg-card/50 p-2.5 text-xs hover:border-primary/40 transition">
                      <a href={p.htmlUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 group">
                        <GitPullRequest className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium group-hover:text-primary transition line-clamp-1">
                            #{p.number} {p.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            by @{p.authorLogin} · {timeAgo(p.createdAt)}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Open Issues */}
            <section className="glass rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-warning" /> Open Issues ({data.issues.length})
                </h3>
                <a href={`${data.repoInfo.html_url}/issues`} target="_blank" rel="noreferrer" className="text-[11px] sm:text-xs text-muted-foreground hover:text-primary">
                  View all
                </a>
              </div>
              {data.issues.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-3.5 text-center">
                  <p className="text-xs text-muted-foreground">No open issues found</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {data.issues.map((i) => (
                    <li key={i.id} className="rounded-lg border border-border/60 bg-card/50 p-2.5 text-xs hover:border-warning/40 transition">
                      <a href={i.htmlUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 group">
                        <CircleDot className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium group-hover:text-warning transition line-clamp-1">
                            #{i.number} {i.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            by @{i.authorLogin} · {i.commentsCount} comment{i.commentsCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Contributors */}
            <section className="glass rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" /> Contributors ({data.contributors.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                {data.contributors.map((ct) => (
                  <a
                    key={ct.id}
                    href={ct.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 p-2 hover:bg-card hover:border-primary/30 transition group"
                  >
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 border border-border">
                      <AvatarImage src={ct.avatarUrl} />
                      <AvatarFallback>{ct.login[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium group-hover:text-primary transition">@{ct.login}</p>
                      <p className="text-[10px] text-muted-foreground">{ct.contributions} commit{ct.contributions === 1 ? "" : "s"}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Connect Repository Modal (Owner / Admin Only) */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5 text-primary" /> Connect GitHub Repository
            </DialogTitle>
            <DialogDescription>
              Enter the full GitHub repository URL or <code>owner/repo</code> name to sync live stats.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRepo} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>GitHub Repository URL or Path</Label>
              <Input
                placeholder="e.g. https://github.com/SAFAL-TIWARI/Hackord or owner/repository"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Example: <code>https://github.com/SAFAL-TIWARI/Hackord</code>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={connecting} className="bg-gradient-brand text-white shadow-glow">
                {connecting ? "Connecting..." : "Connect Repository"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------ Meetings (Agora Video & Voice) ------------------------ */
function MeetingsTab({
  room, userName, userAvatar, isMemberOrAdmin = true, isOwnerOrAdmin = false, roomMembersCount,
}: {
  room: DbRoom; userName: string; userAvatar: string; isMemberOrAdmin?: boolean; isOwnerOrAdmin?: boolean; roomMembersCount?: number;
}) {
  return (
    <AgoraMeeting
      roomId={room.id}
      roomName={room.name}
      userName={userName}
      userAvatar={userAvatar}
      existingMeetingCode={room.meeting_code}
      isMemberOrAdmin={isMemberOrAdmin}
      isOwnerOrAdmin={isOwnerOrAdmin}
      roomMembersCount={roomMembersCount}
    />
  );
}
