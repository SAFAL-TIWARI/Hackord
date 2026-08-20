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
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickCreateRoomModal } from "@/components/QuickCreateRoomModal";
import { ALL_TAGS, type Hackathon } from "@/lib/hackathon-data";
import { getHackathons, createHackathon, deleteHackathon, triggerHackathonScrape } from "@/lib/hackathons-api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatDateWord } from "@/lib/date-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Global Hackathons & Project Ideas — Hackord" },
      {
        name: "description",
        content:
          "Discover top upcoming global hackathons, filter by tracks and prize pools, track submission deadlines, and connect with hackathon team members.",
      },
      { property: "og:title", content: "Explore Global Hackathons & Project Ideas — Hackord" },
      {
        property: "og:description",
        content:
          "Discover top upcoming global hackathons, filter by tracks and prize pools, track submission deadlines, and connect with hackathon team members.",
      },
    ],
  }),
  component: ExplorePage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "TBD";
  return formatDateWord(iso);
}

function daysUntil(iso: string) {
  if (!iso) return 999;
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
    const tagMatch = (h.tags || []).some((t) => q.includes(t.toLowerCase()));
    const onlineMatch = q.includes("online") && h.mode !== "Offline";
    const offlineMatch = q.includes("offline") && h.mode !== "Online";
    const weekMatch =
      (q.includes("this week") || q.includes("closing this week")) &&
      daysUntil(h.registrationDeadline) <= 7;
    const prizeMatch =
      (q.includes("5l") || q.includes("₹5l") || q.includes("5 lakh") || q.includes("500k")) &&
      (h.prizePoolUSD || 0) >= 6000;
    const bigPrize =
      (q.includes("big prize") || q.includes("large prize") || q.includes("high prize")) &&
      (h.prizePoolUSD || 0) >= 50000;
    const beginnerMatch = q.includes("beginner") && (h.tags || []).includes("Beginner-Friendly");
    const textMatch =
      (h.name || "").toLowerCase().includes(q) ||
      (h.organizer || "").toLowerCase().includes(q) ||
      (h.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (h.description || "").toLowerCase().includes(q);

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

  const events: CalEvent[] = hackathons.flatMap((h): CalEvent[] => [
    { date: h.registrationDeadline, label: "Reg. closes", hackathon: h, kind: "registration" },
    { date: h.submissionDeadline, label: "Submission", hackathon: h, kind: "submission" },
    { date: h.resultDate, label: "Results", hackathon: h, kind: "result" },
  ]).filter((ev) => Boolean(ev.date));

  events.sort((a, b) => a.date.localeCompare(b.date));

  const kindColor: Record<CalEvent["kind"], string> = {
    registration: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    submission: "bg-primary/20 text-primary border-primary/30",
    result: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  if (events.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center shadow-card">
        <p className="text-sm text-muted-foreground">No upcoming dates scheduled yet.</p>
      </div>
    );
  }

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
  isAdmin,
  onDelete,
}: {
  hackathon: Hackathon;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  onCreateRoom: (h: Hackathon) => void;
  isAdmin?: boolean;
  onDelete?: (id: string, name: string) => void;
}) {
  const regDays = daysUntil(hackathon.registrationDeadline);

  return (
    <div className="group glass rounded-2xl shadow-card flex flex-col overflow-hidden transition hover:-translate-y-0.5">
      {/* Banner */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/20 to-purple-900/40">
        <img
          src={hackathon.banner || "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80"}
          alt={hackathon.name}
          className="h-full w-full object-cover opacity-70 transition group-hover:opacity-90 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              className={cn(
                "text-[10px] font-medium backdrop-blur-sm border",
                hackathon.mode === "Online"
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : hackathon.mode === "Offline"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/30",
              )}
            >
              {hackathon.mode}
            </Badge>
            {hackathon.level && (
              <Badge
                className={cn(
                  "text-[10px] font-medium backdrop-blur-sm border",
                  hackathon.level === "State"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : hackathon.level === "National"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                )}
              >
                {hackathon.level} Level
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(hackathon.id, hackathon.name)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-muted-foreground backdrop-blur-md transition hover:bg-destructive hover:text-white"
                title="Delete Hackathon"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onBookmark(hackathon.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:scale-110"
            >
              {bookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-primary fill-primary" />
              ) : (
                <Bookmark className="h-3.5 w-3.5 text-white/80" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate max-w-[140px]">{hackathon.organizer}</span>
            {hackathon.platform && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                {hackathon.platform}
              </span>
            )}
          </div>
          <span className="font-semibold text-primary">{hackathon.prizePool}</span>
        </div>

        <div className="flex items-start justify-between gap-2 mt-1">
          <h3 className="text-base font-bold leading-snug group-hover:text-primary transition-colors">
            {hackathon.name}
          </h3>
          {hackathon.createdAt && (Date.now() - new Date(hackathon.createdAt).getTime() < 7 * 86400000) && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/30">
              <Sparkles className="h-2.5 w-2.5" /> New
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {hackathon.description}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {(hackathon.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border/60 bg-card/50 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Dates & Footer Actions */}
        <div className="mt-5 border-t border-border/40 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(hackathon.registrationDeadline)}</span>
          </div>

          <div className="flex items-center gap-2">
            {hackathon.platformUrl && (
              <a
                href={hackathon.platformUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Details
              </a>
            )}
            <button
              onClick={() => onCreateRoom(hackathon)}
              className="flex items-center gap-1 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:opacity-90"
            >
              <Zap className="h-3 w-3" />
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ExplorePage() {
  const { user, isAdmin } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("q") || localStorage.getItem("explore_query") || "";
    }
    return "";
  });
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [modeFilter, setModeFilter] = useState<"All" | "Online" | "Offline" | "Hybrid">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = (p.get("mode") || localStorage.getItem("explore_mode")) as any;
      if (["All", "Online", "Offline", "Hybrid"].includes(v)) return v;
    }
    return "All";
  });
  const [prizeFilter, setPrizeFilter] = useState<"All" | "50k+" | "100k+" | "500k+">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = (p.get("prize") || localStorage.getItem("explore_prize")) as any;
      if (["All", "50k+", "100k+", "500k+"].includes(v)) return v;
    }
    return "All";
  });
  const [deadlineFilter, setDeadlineFilter] = useState<"All" | "thisweek" | "thismonth">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = (p.get("deadline") || localStorage.getItem("explore_deadline")) as any;
      if (["All", "thisweek", "thismonth"].includes(v)) return v;
    }
    return "All";
  });
  const [viewMode, setViewMode] = useState<"grid" | "calendar">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = (p.get("view") || localStorage.getItem("explore_view")) as any;
      if (["grid", "calendar"].includes(v)) return v;
    }
    return "grid";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
        if (modeFilter !== "All") url.searchParams.set("mode", modeFilter); else url.searchParams.delete("mode");
        if (prizeFilter !== "All") url.searchParams.set("prize", prizeFilter); else url.searchParams.delete("prize");
        if (deadlineFilter !== "All") url.searchParams.set("deadline", deadlineFilter); else url.searchParams.delete("deadline");
        if (viewMode !== "grid") url.searchParams.set("view", viewMode); else url.searchParams.delete("view");
        window.history.replaceState({}, "", url.toString());

        localStorage.setItem("explore_query", query);
        localStorage.setItem("explore_mode", modeFilter);
        localStorage.setItem("explore_prize", prizeFilter);
        localStorage.setItem("explore_deadline", deadlineFilter);
        localStorage.setItem("explore_view", viewMode);
      } catch {
        // ignore
      }
    }
  }, [query, modeFilter, prizeFilter, deadlineFilter, viewMode]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [levelFilter, setLevelFilter] = useState<"All" | "State" | "National" | "Global">("All");
  const [platformFilter, setPlatformFilter] = useState<
    "All" | "Devpost" | "Unstop" | "MLH" | "Devfolio" | "Luma" | "GDG" | "Community Host" | "Hackord"
  >("All");
  const [syncingScraper, setSyncingScraper] = useState(false);

  const handleTriggerScrape = async () => {
    setSyncingScraper(true);
    try {
      const res = await triggerHackathonScrape();
      await loadData();
      toast.success(res.message || "Scraped valid hackathons to JSON file! Admin approval required on Admin Panel to feed DB.");
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger auto-feeding scraper");
    } finally {
      setSyncingScraper(false);
    }
  };
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

  // Quick-create room modal
  const [quickCreateHackathon, setQuickCreateHackathon] = useState<Hackathon | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Admin Add Hackathon Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submittingHackathon, setSubmittingHackathon] = useState(false);
  const [newHackathon, setNewHackathon] = useState({
    name: "",
    organizer: "",
    banner: "",
    prizePool: "₹1 Lakh",
    prizePoolUSD: 1200,
    mode: "Online" as "Online" | "Offline" | "Hybrid",
    registrationDeadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    resultDate: new Date(Date.now() + 35 * 86400000).toISOString().split("T")[0],
    teamMin: 1,
    teamMax: 4,
    tags: "AI, Web3",
    platform: "Hackord",
    platformUrl: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHackathons();
      setHackathons(data || []);
    } catch (err) {
      console.error("[ExplorePage] Error fetching hackathons:", err);
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddHackathonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHackathon.name.trim() || !newHackathon.organizer.trim() || !newHackathon.description.trim()) {
      toast.error("Please fill in all required fields (Name, Organizer, Description)");
      return;
    }

    setSubmittingHackathon(true);
    try {
      const created = await createHackathon({
        name: newHackathon.name.trim(),
        organizer: newHackathon.organizer.trim(),
        banner: newHackathon.banner.trim() || "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
        prizePool: newHackathon.prizePool,
        prizePoolUSD: Number(newHackathon.prizePoolUSD) || 0,
        mode: newHackathon.mode,
        registrationDeadline: newHackathon.registrationDeadline,
        submissionDeadline: newHackathon.submissionDeadline,
        resultDate: newHackathon.resultDate,
        teamSize: { min: Number(newHackathon.teamMin) || 1, max: Number(newHackathon.teamMax) || 4 },
        tags: newHackathon.tags.split(",").map((t) => t.trim()).filter(Boolean),
        platform: newHackathon.platform.trim() || "Hackord",
        platformUrl: newHackathon.platformUrl.trim(),
        description: newHackathon.description.trim(),
      });

      setHackathons((prev) => [created, ...prev]);
      toast.success(`Hackathon "${created.name}" created successfully!`);
      setAddModalOpen(false);
      setNewHackathon({
        name: "",
        organizer: "",
        banner: "",
        prizePool: "₹1 Lakh",
        prizePoolUSD: 1200,
        mode: "Online",
        registrationDeadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        resultDate: new Date(Date.now() + 35 * 86400000).toISOString().split("T")[0],
        teamMin: 1,
        teamMax: 4,
        tags: "AI, Web3",
        platform: "Hackord",
        platformUrl: "",
        description: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create hackathon");
    } finally {
      setSubmittingHackathon(false);
    }
  };

  const handleDeleteHackathon = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete hackathon "${name}"?`)) return;
    try {
      await deleteHackathon(id);
      setHackathons((prev) => prev.filter((h) => h.id !== id));
      toast.success(`Hackathon "${name}" deleted`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete hackathon");
    }
  };

  const filtered = useMemo(() => {
    let list = query.trim() ? nlSearch(query, hackathons) : hackathons;

    if (showBookmarks) list = list.filter((h) => bookmarks.has(h.id));
    if (modeFilter !== "All") list = list.filter((h) => h.mode === modeFilter);
    if (levelFilter !== "All") list = list.filter((h) => h.level === levelFilter);
    if (platformFilter !== "All") list = list.filter((h) => (h.platform || "").toLowerCase() === platformFilter.toLowerCase());

    if (prizeFilter !== "All") {
      const thresholds: Record<string, number> = { "50k+": 50000, "100k+": 100000, "500k+": 500000 };
      list = list.filter((h) => (h.prizePoolUSD || 0) >= thresholds[prizeFilter]);
    }

    if (deadlineFilter === "thisweek") {
      list = list.filter((h) => {
        const d = daysUntil(h.registrationDeadline);
        return d >= 0 && d <= 7;
      });
    } else if (deadlineFilter === "thismonth") {
      list = list.filter((h) => {
        const d = daysUntil(h.registrationDeadline);
        return d >= 0 && d <= 30;
      });
    }

    if (activeTags.length > 0) {
      list = list.filter((h) => activeTags.every((t) => (h.tags || []).includes(t)));
    }

    return list;
  }, [query, showBookmarks, bookmarks, modeFilter, levelFilter, platformFilter, prizeFilter, deadlineFilter, activeTags, hackathons]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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

  const openCount = hackathons.filter((h) => daysUntil(h.registrationDeadline) >= 0).length;
  const closingThisWeek = hackathons.filter((h) => {
    const d = daysUntil(h.registrationDeadline);
    return d >= 0 && d <= 7;
  }).length;

  const activeFilterCount =
    (modeFilter !== "All" ? 1 : 0) +
    (levelFilter !== "All" ? 1 : 0) +
    (platformFilter !== "All" ? 1 : 0) +
    (prizeFilter !== "All" ? 1 : 0) +
    (deadlineFilter !== "All" ? 1 : 0) +
    activeTags.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero Section & Admin Buttons */}
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Live Hackathon Registry</span>
              </div>

              {/* AUTO FEED / ADMIN ACTIONS (ADMIN ONLY) */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isAdmin && (
                  <>
                    <Button
                      onClick={() => setAddModalOpen(true)}
                      className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
                      size="sm"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add Hackathon
                    </Button>
                    <Button
                      variant="outline"
                      disabled={syncingScraper}
                      onClick={handleTriggerScrape}
                      className="glass text-xs border-primary/30 hover:border-primary text-primary"
                      size="sm"
                    >
                      {syncingScraper ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Bot className="mr-1.5 h-4 w-4 text-primary" />
                      )}
                      {syncingScraper ? "Scraping to File..." : "AI Auto-Feed"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Hackathon <span className="text-gradient-brand">Explorer</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Discover latest hackathons. Find an upcoming event you like and spin up a dedicated room for your team.
            </p>

            {/* Search Input */}
            <div className="relative mt-2 max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "AI hackathons" or "Web3"'
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
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                {openCount} open for registration
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                {closingThisWeek} closing this week
              </span>
              {/* <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {hackathons.length} hackathons indexed
              </span> */}
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggles */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs transition",
                  viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs transition",
                  viewMode === "calendar" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
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
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
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
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}

            {/* Level filters */}
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            {(["All", "National", "State", "Global"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs transition",
                  levelFilter === l
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {l === "All" ? "All Scope" : `${l}`}
              </button>
            ))}

            {/* More filters */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                "ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition",
                showFilters || activeFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
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

          {/* Expanded Filters */}
          {showFilters && (
            <div className="glass rounded-xl p-4 shadow-card">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Platform</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "All",
                        "Devpost",
                        "Unstop",
                        "MLH",
                        "Devfolio",
                        "Luma",
                        "GDG",
                        "Community Host",
                        "Hackord",
                      ] as const
                    ).map((plat) => (
                      <button
                        key={plat}
                        onClick={() => setPlatformFilter(plat)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                          platformFilter === plat
                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {plat === "All" ? "All Platforms" : plat}
                      </button>
                    ))}
                  </div>
                </div>

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
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {p === "All" ? "Any" : `$${p}`}
                      </button>
                    ))}
                  </div>
                </div>

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
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {v === "All" ? "Anytime" : v === "thisweek" ? "This week" : "This month"}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setActiveTags([]);
                        setModeFilter("All");
                        setLevelFilter("All");
                        setPlatformFilter("All");
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
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
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

        {/* Results Grid / Calendar */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 h-64 animate-pulse bg-card/30" />
            ))}
          </div>
        ) : viewMode === "calendar" ? (
          <CalendarView hackathons={filtered} onCreateRoom={openQuickCreate} />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length === hackathons.length
                  ? `${hackathons.length} hackathons`
                  : `${filtered.length} of ${hackathons.length} hackathons`}
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
                  {hackathons.length === 0
                    ? "No hackathons have been added yet. Admin can click 'Add Hackathon' to add real hackathons."
                    : "Try a different search or adjust your filters."}
                </p>
                {isAdmin && hackathons.length === 0 && (
                  <Button
                    onClick={() => setAddModalOpen(true)}
                    className="mt-4 bg-gradient-brand text-white shadow-glow"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Add First Hackathon
                  </Button>
                )}
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
                    isAdmin={isAdmin}
                    onDelete={handleDeleteHackathon}
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

      {/* Admin Add Hackathon Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" /> Add New Hackathon
            </DialogTitle>
            <DialogDescription>
              Fill in the hackathon overview and registration details to display on the platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddHackathonSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-name">Hackathon Name *</Label>
                <Input
                  id="h-name"
                  required
                  placeholder="e.g. Smart India Hackathon 2026"
                  value={newHackathon.name}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-organizer">Organizer *</Label>
                <Input
                  id="h-organizer"
                  required
                  placeholder="e.g. Ministry of Education"
                  value={newHackathon.organizer}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, organizer: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-prizepool">Prize Pool Text</Label>
                <Input
                  id="h-prizepool"
                  placeholder="e.g. ₹5 Lakhs or $50,000"
                  value={newHackathon.prizePool}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, prizePool: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-prizeusd">Prize Pool USD (for filter)</Label>
                <Input
                  id="h-prizeusd"
                  type="number"
                  placeholder="e.g. 6000"
                  value={newHackathon.prizePoolUSD}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, prizePoolUSD: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-mode">Mode</Label>
                <Select
                  value={newHackathon.mode}
                  onValueChange={(val: "Online" | "Offline" | "Hybrid") =>
                    setNewHackathon((prev) => ({ ...prev, mode: val }))
                  }
                >
                  <SelectTrigger id="h-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-minteam">Min Team Size</Label>
                <Input
                  id="h-minteam"
                  type="number"
                  min={1}
                  value={newHackathon.teamMin}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, teamMin: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-maxteam">Max Team Size</Label>
                <Input
                  id="h-maxteam"
                  type="number"
                  min={1}
                  value={newHackathon.teamMax}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, teamMax: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-regdate">Registration Deadline</Label>
                <Input
                  id="h-regdate"
                  type="date"
                  value={newHackathon.registrationDeadline}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-subdate">Submission Deadline</Label>
                <Input
                  id="h-subdate"
                  type="date"
                  value={newHackathon.submissionDeadline}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, submissionDeadline: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-resdate">Result Date</Label>
                <Input
                  id="h-resdate"
                  type="date"
                  value={newHackathon.resultDate}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, resultDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h-banner">Banner Image URL</Label>
              <Input
                id="h-banner"
                placeholder="https://images.unsplash.com/..."
                value={newHackathon.banner}
                onChange={(e) => setNewHackathon((prev) => ({ ...prev, banner: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-tags">Tags (comma separated)</Label>
                <Input
                  id="h-tags"
                  placeholder="AI, Web3, FinTech"
                  value={newHackathon.tags}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-platformurl">Platform Link URL</Label>
                <Input
                  id="h-platformurl"
                  placeholder="https://devfolio.co/hackathons/..."
                  value={newHackathon.platformUrl}
                  onChange={(e) => setNewHackathon((prev) => ({ ...prev, platformUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h-desc">Description *</Label>
              <Textarea
                id="h-desc"
                required
                rows={3}
                placeholder="Detailed overview of problem statements, eligibility, and tracks..."
                value={newHackathon.description}
                onChange={(e) => setNewHackathon((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingHackathon} className="bg-gradient-brand text-white shadow-glow">
                {submittingHackathon ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Create Hackathon"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
