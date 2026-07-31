import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Users,
  Trophy,
  CalendarDays,
  MapPin,
  Filter,
  Calendar,
  LayoutGrid,
  Bot,
  X,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QuickCreateRoomModal } from "@/components/QuickCreateRoomModal";
import { HACKATHONS, AI_RECOMMENDATIONS, ALL_TAGS, type Hackathon } from "@/lib/hackathon-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Hackathon Explorer — Hackord" }] }),
  component: ExplorePage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function urgencyClass(days: number) {
  if (days <= 3) return "text-red-400";
  if (days <= 7) return "text-orange-400";
  return "text-muted-foreground";
}

// ─── Natural-language query parser ───────────────────────────────────────────

function nlSearch(query: string, hackathons: Hackathon[]): Hackathon[] {
  const q = query.toLowerCase();
  return hackathons.filter((h) => {
    const tagMatch = h.tags.some((t) => q.includes(t.toLowerCase()));
    const onlineMatch = q.includes("online") && h.mode !== "Offline";
    const offlineMatch = q.includes("offline") && h.mode !== "Online";
    const weekMatch =
      (q.includes("this week") || q.includes("closing this week")) &&
      daysUntil(h.registrationDeadline) <= 7;
    const prizeMatch =
      (q.includes("5l") || q.includes("₹5l") || q.includes("5 lakh") || q.includes("500k")) &&
      h.prizePoolUSD >= 6000;
    const bigPrize =
      (q.includes("big prize") || q.includes("large prize") || q.includes("high prize")) &&
      h.prizePoolUSD >= 50000;
    const beginnerMatch = q.includes("beginner") && h.tags.includes("Beginner-Friendly");
    const textMatch =
      h.name.toLowerCase().includes(q) ||
      h.organizer.toLowerCase().includes(q) ||
      h.tags.some((t) => t.toLowerCase().includes(q)) ||
      h.description.toLowerCase().includes(q);

    return tagMatch || onlineMatch || offlineMatch || weekMatch || prizeMatch || bigPrize || beginnerMatch || textMatch;
  });
}

// ─── Calendar view ─────────────────────────────────────────────────────────

function CalendarView({
  hackathons,
  onCreateRoom,
}: {
  hackathons: Hackathon[];
  onCreateRoom: (h: Hackathon) => void;
}) {
  type CalEvent = {
    date: string;
    label: string;
    hackathon: Hackathon;
    kind: "registration" | "submission" | "result";
  };

  const events: CalEvent[] = hackathons.flatMap((h) => [
    { date: h.registrationDeadline, label: "Reg. closes", hackathon: h, kind: "registration" },
    { date: h.submissionDeadline, label: "Submission", hackathon: h, kind: "submission" },
    { date: h.resultDate, label: "Results", hackathon: h, kind: "result" },
  ]);

  events.sort((a, b) => a.date.localeCompare(b.date));

  const kindColor: Record<CalEvent["kind"], string> = {
    registration: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    submission: "bg-primary/20 text-primary border-primary/30",
    result: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-card">
      <h2 className="mb-5 text-lg font-semibold">Upcoming deadlines</h2>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {events.map((ev, i) => {
          const days = daysUntil(ev.date);
          if (days < 0) return null;
          return (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/40 p-3"
            >
              <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-gradient-brand-soft p-2 text-center">
                <span className="text-xs font-medium text-primary">
                  {new Date(ev.date).toLocaleDateString("en-IN", { month: "short" })}
                </span>
                <span className="text-xl font-bold leading-none">
                  {new Date(ev.date).getDate()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ev.hackathon.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("text-xs rounded border px-1.5 py-0.5", kindColor[ev.kind])}>
                    {ev.label}
                  </span>
                  <span className={cn("text-xs", urgencyClass(days))}>
                    {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days`}
                  </span>
                </div>
              </div>
              {ev.kind === "registration" && (
                <button
                  onClick={() => onCreateRoom(ev.hackathon)}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-gradient-brand px-2.5 py-1.5 text-xs font-medium text-white shadow-glow transition hover:opacity-90"
                >
                  <Zap className="h-3 w-3" />
                  Room
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hackathon card ───────────────────────────────────────────────────────────

function HackathonCard({
  hackathon,
  bookmarked,
  onBookmark,
  onCreateRoom,
}: {
  hackathon: Hackathon;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  onCreateRoom: (h: Hackathon) => void;
}) {
  const regDays = daysUntil(hackathon.registrationDeadline);
  const isUrgent = regDays <= 7 && regDays >= 0;
  const isClosed = regDays < 0;

  return (
    <div className="group glass rounded-2xl shadow-card flex flex-col overflow-hidden transition hover:-translate-y-0.5">
      {/* Banner */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/20 to-purple-900/40">
        <img
          src={hackathon.banner}
          alt={hackathon.name}
          className="h-full w-full object-cover opacity-70 transition group-hover:opacity-90 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-start justify-between p-3">
          <Badge
            className={cn(
              "text-xs font-medium backdrop-blur-sm border",
              hackathon.mode === "Online"
                ? "bg-green-500/20 text-green-300 border-green-500/30"
                : hackathon.mode === "Offline"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-purple-500/20 text-purple-300 border-purple-500/30",
            )}
          >
            <MapPin className="mr-1 h-3 w-3" />
            {hackathon.mode}
          </Badge>
          {isUrgent && (
            <Badge className="bg-orange-500/90 text-white border-none text-xs backdrop-blur-sm animate-pulse">
              <Clock className="mr-1 h-3 w-3" />
              {regDays === 0 ? "Closes today!" : `${regDays}d left`}
            </Badge>
          )}
          {isClosed && (
            <Badge className="bg-zinc-700/80 text-zinc-300 border-none text-xs backdrop-blur-sm">
              Registration closed
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2 right-3">
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-zinc-300 backdrop-blur-sm">
            {hackathon.platform}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{hackathon.organizer}</p>
          <h3 className="mt-0.5 text-base font-semibold leading-tight">{hackathon.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-card/50 px-2 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
            <span className="text-xs font-medium truncate">{hackathon.prizePool}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-card/50 px-2 py-1.5">
            <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-muted-foreground">
              {hackathon.teamSize.min}–{hackathon.teamSize.max} members
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-card/50 px-2 py-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            <span className={cn("text-xs", isUrgent ? "text-orange-400 font-medium" : "text-muted-foreground")}>
              Reg: {isClosed ? "Closed" : formatDate(hackathon.registrationDeadline)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-card/50 px-2 py-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">
              Sub: {formatDate(hackathon.submissionDeadline)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {hackathon.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {tag}
            </span>
          ))}
          {hackathon.tags.length > 4 && (
            <span className="rounded-full bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
              +{hackathon.tags.length - 4}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground flex-1">
          {hackathon.description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <button
            onClick={() => onBookmark(hackathon.id)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition",
              bookmarked
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {bookmarked ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(hackathon.platformUrl).catch(() => { });
              toast.success("Link copied!");
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-card hover:text-foreground"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <a
            href={hackathon.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-card hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </a>
          <button
            onClick={() => onCreateRoom(hackathon)}
            className="ml-auto flex items-center gap-1 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-white shadow-glow transition hover:opacity-90"
          >
            <Zap className="h-3.5 w-3.5" />
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ExplorePage() {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [modeFilter, setModeFilter] = useState<"All" | "Online" | "Offline" | "Hybrid">("All");
  const [prizeFilter, setPrizeFilter] = useState<"All" | "50k+" | "100k+" | "500k+">("All");
  const [deadlineFilter, setDeadlineFilter] = useState<"All" | "thisweek" | "thismonth">("All");
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("forge_focus_bookmarks");
        if (raw) return new Set(JSON.parse(raw));
      } catch (err) {
        console.error("Error reading bookmarks from localStorage", err);
      }
    }
    return new Set();
  });
  const [showFilters, setShowFilters] = useState(false);

  // Quick-create modal state
  const [quickCreateHackathon, setQuickCreateHackathon] = useState<Hackathon | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = query.trim() ? nlSearch(query, HACKATHONS) : HACKATHONS;

    if (showBookmarks) list = list.filter((h) => bookmarks.has(h.id));
    if (modeFilter !== "All") list = list.filter((h) => h.mode === modeFilter);

    if (prizeFilter !== "All") {
      const thresholds: Record<string, number> = { "50k+": 50000, "100k+": 100000, "500k+": 500000 };
      list = list.filter((h) => h.prizePoolUSD >= thresholds[prizeFilter]);
    }

    if (deadlineFilter === "thisweek") {
      list = list.filter((h) => { const d = daysUntil(h.registrationDeadline); return d >= 0 && d <= 7; });
    } else if (deadlineFilter === "thismonth") {
      list = list.filter((h) => { const d = daysUntil(h.registrationDeadline); return d >= 0 && d <= 30; });
    }

    if (activeTags.length > 0) {
      list = list.filter((h) => activeTags.every((t) => h.tags.includes(t)));
    }

    return list;
  }, [query, showBookmarks, bookmarks, modeFilter, prizeFilter, deadlineFilter, activeTags]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removed from saved hackathons");
      } else {
        next.add(id);
        toast.success("Saved!");
      }
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("forge_focus_bookmarks", JSON.stringify(Array.from(next)));
        } catch (err) {
          console.error("Error saving bookmarks to localStorage", err);
        }
      }
      return next;
    });
  }

  function openQuickCreate(h: Hackathon) {
    setQuickCreateHackathon(h);
    setQuickCreateOpen(true);
  }

  const recommendedHackathons = AI_RECOMMENDATIONS.map((r) => ({
    ...r,
    hackathon: HACKATHONS.find((h) => h.id === r.hackathonId)!,
  })).filter((r) => r.hackathon);

  const openCount = HACKATHONS.filter((h) => daysUntil(h.registrationDeadline) >= 0).length;
  const closingThisWeek = HACKATHONS.filter((h) => {
    const d = daysUntil(h.registrationDeadline);
    return d >= 0 && d <= 7;
  }).length;

  const activeFilterCount =
    (modeFilter !== "All" ? 1 : 0) +
    (prizeFilter !== "All" ? 1 : 0) +
    (deadlineFilter !== "All" ? 1 : 0) +
    activeTags.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero */}
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Curated from Devfolio, Devpost, ETHGlobal, DoraHacks, MLH, Unstop, HackerEarth, Hack2Skill &amp; Luma
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Hackathon{" "}
              <span className="text-gradient-brand">Explorer</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Discover upcoming hackathons from 9 major platforms — all in one searchable hub. Find one you like, then create a team room in one click.
            </p>

            {/* Search */}
            <div className="relative mt-2 max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "AI hackathons closing this week" or "Web3 with big prize"'
                className="h-12 rounded-xl pl-12 pr-4 text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                {openCount} open for registration
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                {closingThisWeek} closing this week
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {HACKATHONS.length} hackathons indexed
              </span>
            </div>
          </div>
        </section>

        {/* Personalised picks */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold">Recommended for you</h2>
            <Badge variant="secondary" className="text-xs">Based on your GitHub &amp; profile</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {recommendedHackathons.map(({ hackathon, reason }) => (
              <div
                key={hackathon.id}
                className="glass rounded-2xl p-4 shadow-card ring-1 ring-primary/20 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={hackathon.banner}
                    alt={hackathon.name}
                    className="h-12 w-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{hackathon.organizer}</p>
                    <p className="text-sm font-semibold leading-tight">{hackathon.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-2 text-xs text-primary">
                  <Bot className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {reason}
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    <Trophy className="mr-1 h-3 w-3" />
                    {hackathon.prizePool}
                  </Badge>
                  <button
                    onClick={() => openQuickCreate(hackathon)}
                    className="ml-auto flex items-center gap-1 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-white shadow-glow transition hover:opacity-90"
                  >
                    <Zap className="h-3 w-3" />
                    Create Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter bar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggles */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs transition",
                  viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs transition",
                  viewMode === "calendar" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                Calendar
              </button>
            </div>

            {/* Bookmark filter */}
            <button
              onClick={() => setShowBookmarks((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition",
                showBookmarks
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              Saved ({bookmarks.size})
            </button>

            {/* Mode filters */}
            {(["All", "Online", "Offline", "Hybrid"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs transition",
                  modeFilter === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}

            {/* More filters */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                "ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition",
                showFilters || activeFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="glass rounded-xl p-4 shadow-card">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Prize pool */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Prize pool</p>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "50k+", "100k+", "500k+"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrizeFilter(p)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs transition",
                          prizeFilter === p
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {p === "All" ? "Any" : `$${p}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Registration closes</p>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "thisweek", "thismonth"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setDeadlineFilter(v)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs transition",
                          deadlineFilter === v
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {v === "All" ? "Anytime" : v === "thisweek" ? "This week" : "This month"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setActiveTags([]);
                        setModeFilter("All");
                        setPrizeFilter("All");
                        setDeadlineFilter("All");
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>

              {/* Tag cloud */}
              <div className="mt-4 border-t border-border/50 pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Filter by domain</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition",
                        activeTags.includes(tag)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {viewMode === "calendar" ? (
          <CalendarView hackathons={filtered} onCreateRoom={openQuickCreate} />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length === HACKATHONS.length
                  ? `${HACKATHONS.length} hackathons`
                  : `${filtered.length} of ${HACKATHONS.length} hackathons`}
                {query && (
                  <span className="ml-1">
                    for <span className="font-medium text-foreground">"{query}"</span>
                  </span>
                )}
              </p>
              {query && filtered.length === 0 && (
                <button onClick={() => setQuery("")} className="text-xs text-primary hover:underline">
                  Clear search
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center shadow-card">
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-base font-medium">No hackathons found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search or adjust your filters.
                </p>
                <button
                  onClick={() => {
                    setQuery("");
                    setActiveTags([]);
                    setModeFilter("All");
                    setPrizeFilter("All");
                    setDeadlineFilter("All");
                  }}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Show all hackathons
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((h) => (
                  <HackathonCard
                    key={h.id}
                    hackathon={h}
                    bookmarked={bookmarks.has(h.id)}
                    onBookmark={toggleBookmark}
                    onCreateRoom={openQuickCreate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* One-click room creation modal */}
      <QuickCreateRoomModal
        hackathon={quickCreateHackathon}
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
      />
    </AppShell>
  );
}
