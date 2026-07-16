import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users, MessageSquare, Bot, Github, FileIcon, CalendarDays, Video,
  Crown, ExternalLink, Search, Send, Paperclip, Smile, Pin, Plus,
  FileText, Image as ImageIcon, Film, Archive, Sparkles, GitBranch,
  GitPullRequest, CircleDot, Check, Clock, Play,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
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
  ROOMS, DISCOVER_USERS, MESSAGES, MEMBERS, FILES, TASKS,
  AI_TOOLS, TIMELINE, MEETINGS, GITHUB_DATA, type Member,
} from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms/$roomId")({
  head: ({ params }) => ({
    meta: [{ title: `Room — HackDiscord` }],
  }),
  loader: ({ params }) => {
    const room = ROOMS.find((r) => r.id === params.roomId);
    if (!room) throw notFound();
    return { room };
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

function RoomPage() {
  const { room } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("overview");

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
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{room.problem}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {room.members.length}/{room.maxSize}</Badge>
              <Badge className="bg-gradient-brand text-white border-transparent">{room.status}</Badge>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries({
              Registration: room.deadlines.registration,
              PPT: room.deadlines.ppt,
              Prototype: room.deadlines.prototype,
              Final: room.deadlines.final,
              Result: room.deadlines.result,
            }).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border/60 bg-card/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className="mt-1 text-sm font-medium">{new Date(v).toDateString().slice(4)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-border bg-background/60 px-4 backdrop-blur-xl md:mx-0 md:rounded-xl md:border md:px-2">
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
          {tab === "overview" && <OverviewTab room={room} />}
          {tab === "members" && <MembersTab members={room.members} />}
          {tab === "chat" && <ChatTab />}
          {tab === "ai" && <AITab />}
          {tab === "github" && <GithubTab />}
          {tab === "files" && <FilesTab />}
          {tab === "timeline" && <TimelineTab />}
          {tab === "tasks" && <TasksTab />}
          {tab === "meetings" && <MeetingsTab />}
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------ Overview ------------------------ */
function OverviewTab({ room }: { room: (typeof ROOMS)[number] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold">About this hackathon</h2>
          <p className="mt-2 text-sm text-muted-foreground">{room.description}</p>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{room.progress}%</span>
            </div>
            <Progress value={room.progress} />
          </div>
        </section>
        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
          <ul className="space-y-3">
            {[
              { who: "Priya", what: "uploaded Pitch-Deck-v2.pptx", when: "1h ago" },
              { who: "Rohan", what: "opened PR #24", when: "3h ago" },
              { who: "Ishita", what: "moved 'CI/CD' → In Progress", when: "6h ago" },
            ].map((a, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand-soft text-xs font-semibold text-primary">{a.who[0]}</div>
                <div className="flex-1 text-sm"><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                <span className="text-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="space-y-6">
        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Important deadlines</h2>
          <ul className="space-y-3 text-sm">
            {Object.entries(room.deadlines).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="capitalize text-muted-foreground">{k}</span>
                <span className="font-medium">{new Date(v).toDateString().slice(4)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Project links</h2>
          <ul className="space-y-2 text-sm">
            {[
              { label: "GitHub Repo", href: GITHUB_DATA.url },
              { label: "Figma", href: "#" },
              { label: "Demo", href: "#" },
              { label: "Notion", href: "#" },
            ].map((l) => (
              <li key={l.label}>
                <a href={l.href} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3 w-3" /> {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ------------------------ Members + Add ------------------------ */
function MembersTab({ members }: { members: Member[] }) {
  const [openAdd, setOpenAdd] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team members</h2>
        <Button onClick={() => setOpenAdd(true)} className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m, i) => (
          <div key={m.id} className="glass rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={m.avatar} />
                <AvatarFallback>{m.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{m.name}</p>
                  {i === 0 && <Crown className="h-3.5 w-3.5 text-warning" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{m.college}</p>
              </div>
              <span className={cn(
                "ml-auto h-2 w-2 shrink-0 rounded-full",
                m.status === "Online" ? "bg-success" : m.status === "Away" ? "bg-warning" : "bg-muted-foreground/50",
              )} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <a href={m.github} className="hover:text-foreground">GitHub</a>
                <a href={m.linkedin} className="hover:text-foreground">LinkedIn</a>
              </div>
              <Badge variant="outline">{i === 0 ? "Owner" : m.role}</Badge>
            </div>
          </div>
        ))}
      </div>
      <AddMemberDialog open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  );
}

function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [requested, setRequested] = useState<string[]>([]);
  const [noteFor, setNoteFor] = useState<Member | null>(null);
  const [note, setNote] = useState("Hi! We'd love to have you on our hackathon team.");

  const results = DISCOVER_USERS.filter((u) => {
    const s = q.toLowerCase();
    return !s || u.name.toLowerCase().includes(s) || u.college.toLowerCase().includes(s) ||
      u.skills.join(" ").toLowerCase().includes(s) || (u.city ?? "").toLowerCase().includes(s);
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add members</DialogTitle>
            <DialogDescription>Search by skill, college, city or experience.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. React, IIT, Bangalore, Advanced" className="pl-9" />
          </div>
          <div className="mt-2 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {results.map((u) => {
              const isRequested = requested.includes(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.college} · {u.experience}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.skills.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  {isRequested ? (
                    <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
                  ) : (
                    <Button size="sm" onClick={() => setNoteFor(u)}>Request</Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!noteFor} onOpenChange={(v) => !v && setNoteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send request to {noteFor?.name}</DialogTitle>
            <DialogDescription>Add a short note so they know why you're inviting them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteFor(null)}>Cancel</Button>
            <Button
              className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
              onClick={() => {
                if (noteFor) setRequested((r) => [...r, noteFor.id]);
                setNoteFor(null);
                toast.success("Invitation sent");
              }}
            >
              <Send className="h-4 w-4" /> Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------ Chat ------------------------ */
function ChatTab() {
  const [text, setText] = useState("");
  const findMember = (id: string) => MEMBERS.find((m) => m.id === id)!;
  return (
    <div className="glass rounded-2xl shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="font-semibold">#general</h2>
          <p className="text-xs text-muted-foreground">Priya is typing…</p>
        </div>
        <Badge variant="secondary" className="gap-1"><Pin className="h-3 w-3" /> 1 pinned</Badge>
      </div>
      <div className="max-h-[520px] space-y-4 overflow-y-auto p-6">
        {MESSAGES.map((m) => {
          const u = findMember(m.authorId);
          return (
            <div key={m.id} className="flex items-start gap-3">
              <Avatar className="h-9 w-9"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name[0]}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                  {m.pinned && <Pin className="h-3 w-3 text-warning" />}
                </div>
                <p className="mt-1 text-sm">{m.text}</p>
                {m.code && (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-xs">
                    <code>{m.code}</code>
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; toast("Message sent (demo)"); setText(""); }}
      >
        <Button type="button" variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon"><Smile className="h-4 w-4" /></Button>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message #general" />
        <Button type="submit" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

/* ------------------------ AI Workspace ------------------------ */
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

/* ------------------------ GitHub ------------------------ */
function GithubTab() {
  const g = GITHUB_DATA;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Repository</h2>
            <a href={g.url} className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Github className="h-4 w-4" /> {g.repo}
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
            {g.commits.map((c) => (
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
            {g.prs.map((p) => (
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
            {g.issues.map((i) => (
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
            {MEMBERS.map((m) => (
              <Avatar key={m.id} className="h-8 w-8"><AvatarImage src={m.avatar} /><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------ Files ------------------------ */
function FilesTab() {
  const iconFor = (t: string) =>
    t === "pdf" ? FileText : t === "ppt" ? FileText : t === "image" ? ImageIcon :
    t === "video" ? Film : t === "zip" ? Archive : FileIcon;
  return (
    <div className="space-y-6">
      <div className="glass-strong flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft">
          <Paperclip className="h-5 w-5 text-primary" />
        </div>
        <p className="font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground">PDF, PPT, ZIP, images, video, docs · up to 200MB</p>
        <Button className="mt-2 bg-gradient-brand text-white shadow-glow hover:opacity-90">Upload</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FILES.map((f) => {
          const Icon = iconFor(f.type);
          return (
            <div key={f.id} className="glass rounded-2xl p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand-soft">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.size} · by {f.uploadedBy} · {f.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------ Timeline ------------------------ */
function TimelineTab() {
  return (
    <div className="glass rounded-2xl p-6 shadow-card">
      <h2 className="mb-6 text-lg font-semibold">Milestones</h2>
      <ol className="relative border-l border-border pl-6">
        {TIMELINE.map((s) => (
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
              <span className="text-xs text-muted-foreground">{s.date}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.status === "done" ? "Completed" : s.status === "current" ? "In progress" : "Upcoming"}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------ Tasks (Kanban) ------------------------ */
function TasksTab() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(["Todo", "In Progress", "Completed"] as const).map((col) => (
        <div key={col} className="glass rounded-2xl p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{col}</h3>
            <Badge variant="secondary">{TASKS.filter((t) => t.status === col).length}</Badge>
          </div>
          <div className="space-y-2">
            {TASKS.filter((t) => t.status === col).map((t) => (
              <div key={t.id} className="rounded-xl border border-border/60 bg-card/50 p-3">
                <p className="text-sm font-medium">{t.title}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.assignee}</span>
                  <span>{t.deadline}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------ Meetings ------------------------ */
function MeetingsTab() {
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
            {MEETINGS.upcoming.map((m) => (
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
            {MEETINGS.past.map((m) => (
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
