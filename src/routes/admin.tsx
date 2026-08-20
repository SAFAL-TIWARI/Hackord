import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Search,
  GraduationCap,
  MapPin,
  Mail,
  Clock,
  Sparkles,
  Layers3,
  ExternalLink,
  Crown,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle2,
  FileText,
  Check,
  X,
  Bot,
  Globe,
  Tag,
  Trophy,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle } from "@/components/ViewToggle";
import { useAuth, type AuthUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { getRooms, deleteRoom, type DbRoom } from "@/lib/rooms-api";
import {
  getScrapedFileStatus,
  triggerHackathonScrape,
  feedScrapedHackathonsToDb,
  rejectScrapedHackathon,
  getHostRequests,
  approveHostRequest,
  deleteHostRequest,
  getContactMessages,
  deleteContactMessage,
  type ScrapedFileStatus,
  type HostRequestSubmission,
  type ContactMessageItem,
} from "@/lib/hackathons-api";
import { formatDateNumeric, formatDateTime } from "@/lib/date-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Hackord" }] }),
  component: AdminPage,
});

type AdminStats = {
  totalUsers: number;
  totalAdmins: number;
  recentSignups: number;
  todaySignups: number;
  topSkills: { skill: string; count: number }[];
  experienceDistribution: { level: string; count: number }[];
};

function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Scraper File State
  const [scrapedStatus, setScrapedStatus] = useState<ScrapedFileStatus | null>(null);
  const [scraping, setScraping] = useState(false);
  const [feedingDb, setFeedingDb] = useState(false);

  // Search & View Mode States
  const [hostSearch, setHostSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [adminRoomViewMode, setAdminRoomViewMode] = useState<"grid" | "list">("list");

  // Host Requests State
  const [hostRequests, setHostRequests] = useState<HostRequestSubmission[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  // User Contact Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

  const filteredHostRequests = useMemo(() => {
    if (!hostSearch.trim()) return hostRequests;
    const q = hostSearch.toLowerCase();
    return hostRequests.filter(
      (r: HostRequestSubmission) =>
        r.name?.toLowerCase().includes(q) ||
        r.organizer?.toLowerCase().includes(q) ||
        r.contactEmail?.toLowerCase().includes(q) ||
        r.prizePool?.toLowerCase().includes(q) ||
        r.mode?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [hostRequests, hostSearch]);

  const filteredContactMessages = useMemo(() => {
    if (!messageSearch.trim()) return contactMessages;
    const q = messageSearch.toLowerCase();
    return contactMessages.filter(
      (m: ContactMessageItem) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
    );
  }, [contactMessages, messageSearch]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Access denied — admin only");
      navigate({ to: "/dashboard" });
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, roomsRes, scrapedRes, requestsRes, messagesRes] = await Promise.all([
        apiFetch<{ users: AuthUser[] }>(`/admin/users?limit=100`).catch(() => ({ users: [] })),
        apiFetch<AdminStats>("/admin/stats").catch(() => null),
        getRooms({ all: true }).catch(() => []),
        getScrapedFileStatus().catch(() => ({ exists: false, totalCount: 0, updatedAt: null, hackathons: [] })),
        getHostRequests().catch(() => []),
        getContactMessages().catch(() => []),
      ]);
      setUsers(usersRes?.users || []);
      setStats(statsRes);
      setRooms(roomsRes || []);
      setScrapedStatus(scrapedRes);
      setHostRequests(requestsRes || []);
      setContactMessages(messagesRes || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContactMessage = async (id: string, name: string) => {
    if (!confirm(`Delete message from "${name}"?`)) return;
    setDeletingMsgId(id);
    try {
      await deleteContactMessage(id);
      toast.success(`Message from "${name}" deleted`);
      setContactMessages((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact message");
    } finally {
      setDeletingMsgId(null);
    }
  };

  const handleTriggerScrape = async () => {
    setScraping(true);
    try {
      const res = await triggerHackathonScrape();
      toast.success(res.message || "Scraping complete! Data stored in JSON file.");
      if (res.fileStatus) {
        setScrapedStatus(res.fileStatus);
      } else {
        const updatedStatus = await getScrapedFileStatus();
        setScrapedStatus(updatedStatus);
      }
    } catch (err: any) {
      toast.error(err.message || "Scraping failed");
    } finally {
      setScraping(false);
    }
  };

  const handleFeedScrapedToDb = async () => {
    if (!scrapedStatus || scrapedStatus.totalCount === 0) {
      toast.error("No scraped data in file to merge");
      return;
    }
    setFeedingDb(true);
    try {
      const res = await feedScrapedHackathonsToDb();
      toast.success(res.message || "Scraped hackathons successfully merged into DB!");
      const updatedStatus = await getScrapedFileStatus();
      setScrapedStatus(updatedStatus);
    } catch (err: any) {
      toast.error(err.message || "Failed to feed scraped data to DB");
    } finally {
      setFeedingDb(false);
    }
  };

  const [rejectingScrapedId, setRejectingScrapedId] = useState<string | null>(null);

  const handleRejectScrapedHackathon = async (id: string, name?: string) => {
    if (!id) return;
    setRejectingScrapedId(id);
    try {
      const res = await rejectScrapedHackathon(id);
      toast.success(res.message || `Scraped hackathon "${name || "item"}" rejected & removed from file`);
      if (res.fileStatus) {
        setScrapedStatus(res.fileStatus);
      } else {
        const updatedStatus = await getScrapedFileStatus();
        setScrapedStatus(updatedStatus);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject scraped hackathon");
    } finally {
      setRejectingScrapedId(null);
    }
  };

  const handleApproveHostRequest = async (id: string, name: string) => {
    setActionId(id);
    try {
      const res = await approveHostRequest(id);
      toast.success(res.message || `Hackathon "${name}" approved & published!`);
      setHostRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: "approved" } : req))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to approve hackathon request");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteHostRequest = async (id: string, name: string) => {
    if (!confirm(`Reject submission for "${name}"?`)) return;
    setActionId(id);
    try {
      await deleteHostRequest(id);
      toast.success(`Submission for "${name}" rejected & removed`);
      setHostRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject submission");
    } finally {
      setActionId(null);
    }
  };

  const handleSearch = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ users: AuthUser[] }>(
        `/admin/users?limit=100&search=${encodeURIComponent(search)}`
      );
      setUsers(res.users);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`[ADMIN] Delete room "${roomName}"? This cannot be undone.`)) return;
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast.success(`Room "${roomName}" deleted successfully by admin.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete room");
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) return null;

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users2, color: "text-primary" },
        { label: "Platform Rooms", value: rooms.length, icon: Layers3, color: "text-blue-400" },
        { label: "User Messages", value: contactMessages.length, icon: MessageSquare, color: "text-purple-400" },
        { label: "Scraped JSON Items", value: scrapedStatus?.totalCount || 0, icon: Database, color: "text-amber-400" },
        { label: "Host Requests", value: hostRequests.filter((r: HostRequestSubmission) => r.status === "pending").length, icon: FileText, color: "text-emerald-400" },
      ]
    : [];

  const filteredRooms = rooms.filter((r) => {
    if (!roomSearch.trim()) return true;
    const q = roomSearch.toLowerCase();
    const creatorName = (r.creator_name || r.members?.[0]?.user_name || "").toLowerCase();
    const creatorEmail = (r.creator_email || "").toLowerCase();
    const roomName = (r.name || "").toLowerCase();
    const hackathon = (r.hackathon || "").toLowerCase();
    return (
      creatorName.includes(q) ||
      creatorEmail.includes(q) ||
      roomName.includes(q) ||
      hackathon.includes(q)
    );
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="glass-strong rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-semibold tracking-tight">Admin Control Center</h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage scraped hackathon files, grant DB permissions, approve community host submissions & monitor user profiles
              </p>
            </div>
            <Badge className="bg-gradient-brand text-white px-3 py-1 text-xs self-start">
              Admin Access
            </Badge>
          </div>
        </section>

        {/* Stats */}
        {loading ? (
          <section>
            {/* Desktop Skeleton Grid */}
            <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            {/* Mobile Horizontal Scrollable Skeletons */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="snap-start shrink-0 w-[220px] glass rounded-2xl p-4 shadow-card space-y-3 border border-border/70">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                  </div>
                  <Skeleton className="h-7 w-14" />
                </div>
              ))}
            </div>
          </section>
        ) : stats ? (
          <section>
            {/* Desktop Grid View */}
            <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((s) => (
                <div key={s.label} className="glass rounded-2xl p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand-soft">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-semibold">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Mobile Horizontal Scrollable View */}
            <div className="flex sm:hidden overflow-x-auto gap-3 pb-3 pt-1 px-1 -mx-1 snap-x snap-mandatory custom-scrollbar">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className="snap-start shrink-0 w-[220px] glass rounded-2xl p-4 shadow-card flex flex-col justify-between border border-border/70"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground truncate mr-2">{s.label}</span>
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand-soft shrink-0">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold">{s.value}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ─── 1. Scraped Hackathons File & Admin DB Feed Manager ─── */}
        <section className="glass rounded-2xl p-6 shadow-card border border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Database className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold">Scraped Hackathons File Storage</h2>
                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/20">
                  {scrapedStatus?.totalCount ?? 0} {scrapedStatus?.totalCount === 1 ? "Item" : "Items"}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                  Step 1: Save to File → Step 2: Feed DB
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Automated & manual scrapers store 200-OK validated hackathons into server file (`scraped_hackathons.json`). Click below to grant permission and merge to Explore page DB.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                disabled={scraping}
                onClick={handleTriggerScrape}
                size="sm"
                className="text-xs border-primary/30 hover:border-primary text-primary"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${scraping ? "animate-spin" : ""}`} />
                {scraping ? "Scraping Platforms..." : "Run Scraper Now (Save to File)"}
              </Button>
              <Button
                disabled={feedingDb || !scrapedStatus?.totalCount}
                onClick={handleFeedScrapedToDb}
                size="sm"
                className="bg-gradient-brand text-white shadow-glow hover:opacity-90 text-xs"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {feedingDb ? "Feeding to DB..." : `Feed / Merge ${scrapedStatus?.totalCount || 0} Hackathons to DB`}
              </Button>
            </div>
          </div>

          {/* Stored File Summary */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground bg-card/40 p-3 rounded-xl border border-border/40">
            <div className="flex items-center gap-4">
              <span>
                <strong>Stored File:</strong> `data/scraped_hackathons.json`
              </span>
              <span>
                <strong>Total Valid Items:</strong>{" "}
                <span className="text-primary font-bold">{scrapedStatus?.totalCount || 0}</span>
              </span>
              <span>
                <strong>Last Updated:</strong>{" "}
                {scrapedStatus?.updatedAt
                  ? formatDateTime(scrapedStatus.updatedAt)
                  : "Never"}
              </span>
            </div>
            <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 font-medium">
              ✓ 200-OK URL Verified (Zero 404 links)
            </span>
          </div>

          {/* Pending Scraped Preview Cards */}
          {scrapedStatus?.hackathons && scrapedStatus.hackathons.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Scraped Hackathons Preview ({scrapedStatus.hackathons.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {scrapedStatus.hackathons.map((h, idx) => {
                  const itemId = (h as any).id || h.platformUrl || `scraped-${idx}`;
                  return (
                    <div key={itemId} className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2 text-xs flex flex-col justify-between overflow-hidden">
                      <div>
                        {/* Banner Image Header */}
                        <div className="relative h-24 w-full overflow-hidden rounded-t-lg bg-black/40 -mx-3.5 -mt-3.5 mb-2.5">
                          <img
                            src={h.banner || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80"}
                            alt={h.name}
                            className="h-full w-full object-cover opacity-85"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-black/20 to-transparent" />
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px] font-bold text-white bg-black/60 border-white/20 backdrop-blur-md">
                              {h.platform || "Platform"}
                            </Badge>
                            <span className="text-[9px] text-emerald-400 font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-md">✓ 200 OK</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-sm truncate">{h.name}</p>
                          <p className="text-muted-foreground text-[11px] truncate">{h.organizer}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-primary font-semibold">{h.prizePool}</span>
                          <span className="text-muted-foreground">{h.mode}</span>
                        </div>

                        {/* Actions: Details & Reject */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {h.platformUrl ? (
                            <a
                              href={h.platformUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground transition"
                            >
                              <ExternalLink className="h-3 w-3 text-primary" /> Details
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No URL</span>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={rejectingScrapedId === itemId}
                            onClick={() => handleRejectScrapedHackathon(itemId, h.name)}
                            className="h-7 px-2.5 text-[11px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Reject & remove from JSON file"
                          >
                            <X className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ─── 2. Pending Community Host Hackathon Requests ─── */}
        <section className="glass rounded-2xl p-6 shadow-card border border-emerald-500/20">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold">Hosted Hackathon Submissions</h2>
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                  {filteredHostRequests.length} {filteredHostRequests.length === 1 ? "Submission" : "Submissions"}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {filteredHostRequests.filter((r: HostRequestSubmission) => r.status === "pending").length} Pending
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submissions sent via the "Host Your Hackathon" form on Contact page. One-click approve to publish to Explore registry.
              </p>
            </div>

            {/* Search Bar for Hosted Submissions */}
            <div className="relative max-w-xs w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search hosted submissions..."
                className="pl-9 h-9 text-xs bg-sidebar-accent/50 border-border/80 rounded-xl"
                value={hostSearch}
                onChange={(e) => setHostSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredHostRequests.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              {hostSearch ? `No hosted submissions matching "${hostSearch}"` : "No host requests submitted yet."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {filteredHostRequests.map((req: HostRequestSubmission) => (
                <div
                  key={req._id}
                  className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Hackathon Banner Image Header */}
                    <div className="relative h-28 w-full overflow-hidden rounded-t-xl bg-black/40 -mx-4 -mt-4 mb-3">
                      <img
                        src={req.banner || (req as any).bannerUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80"}
                        alt={req.name}
                        className="h-full w-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-black/20 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={
                            req.status === "approved"
                              ? "bg-green-500/90 text-white border-none text-[9px] font-bold backdrop-blur-md shadow-sm"
                              : "bg-amber-500/90 text-white border-none text-[9px] font-bold backdrop-blur-md shadow-sm"
                          }
                        >
                          {req.status === "approved" ? "✓ Published" : "Pending Review"}
                        </Badge>
                        <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md font-mono">
                          {formatDateNumeric(req.createdAt)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold truncate">{req.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">By: {req.organizer}</p>
                    <p className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" /> {req.contactEmail}
                    </p>
                    {req.platformUrl ? (
                      <a
                        href={req.platformUrl.startsWith("http") ? req.platformUrl : `https://${req.platformUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 mt-1 truncate max-w-full font-mono"
                        title={req.platformUrl}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{req.platformUrl}</span>
                      </a>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic mt-1 flex items-center gap-1">
                        <Globe className="h-3 w-3 shrink-0" /> No event URL provided
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                        {req.prizePool}
                      </span>
                      <span className="bg-card px-2 py-0.5 rounded border border-border">
                        {req.mode}
                      </span>
                      <span className="bg-card px-2 py-0.5 rounded border border-border">
                        {req.level} Level
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border/50 pt-3 mt-2 flex items-center justify-between">
                    {req.status === "pending" ? (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          size="sm"
                          disabled={actionId === req._id}
                          onClick={() => handleApproveHostRequest(req._id, req.name)}
                          className="flex-1 bg-gradient-brand text-white text-xs h-8"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve & Add to DB
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionId === req._id}
                          onClick={() => handleDeleteHostRequest(req._id, req.name)}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Live on Explore page
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── 3. User Messages & Queries ("Send us message") Section ─── */}
        <section className="glass rounded-2xl p-6 shadow-card border border-purple-500/20">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold">User Messages & Queries</h2>
                <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20">
                  {filteredContactMessages.length} {filteredContactMessages.length === 1 ? "Message" : "Messages"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inquiries, bug reports, and general feedbacks.
              </p>
            </div>

            {/* Search Bar for User Messages */}
            <div className="relative max-w-xs w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search user messages..."
                className="pl-9 h-9 text-xs bg-sidebar-accent/50 border-border/80 rounded-xl"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredContactMessages.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              {messageSearch ? `No user messages matching "${messageSearch}"` : "No user messages submitted yet."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
              {filteredContactMessages.map((msg: ContactMessageItem) => (
                <div
                  key={msg._id}
                  className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]"
                      >
                        {msg.category || "General Query"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateNumeric(msg.createdAt)}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold truncate text-foreground">{msg.name}</h3>
                    <p className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" /> {msg.email}
                    </p>

                    {msg.subject && (
                      <p className="text-xs font-medium text-purple-300 mt-1.5 truncate">
                        Subject: {msg.subject}
                      </p>
                    )}

                    <div className="mt-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-2.5 border border-border/40 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                      {msg.message}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-2.5 mt-2 flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingMsgId === msg._id}
                      onClick={() => handleDeleteContactMessage(msg._id, msg.name)}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── 4. Platform Rooms Stored by User Profile (Admin View) ─── */}
        <section className="glass rounded-2xl p-6 shadow-card">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Layers3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Platform Rooms Stored by User Creator</h2>
                <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/20">
                  {filteredRooms.length} {filteredRooms.length === 1 ? "Room" : "Rooms"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All rooms created across the platform stored and associated with specific user profiles
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <ViewToggle view={adminRoomViewMode} onViewChange={setAdminRoomViewMode} />
              <div className="relative max-w-xs w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by user, email or room..."
                  className="pl-9 h-9 text-xs"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-28" />
                  <div className="border-t border-border/50 pt-3 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              No rooms found matching "{roomSearch}"
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {adminRoomViewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRooms.map((r) => {
                    const owner = r.members?.[0];
                    const creatorName = r.creator_name || owner?.user_name || "Platform User";
                    const creatorAvatar =
                      owner?.user_avatar ||
                      `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(creatorName)}`;

                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              {r.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {r.members?.length || 0}/{r.max_size} members
                            </span>
                          </div>

                          <h3 className="mt-2 text-base font-semibold truncate">{r.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{r.hackathon}</p>
                        </div>

                        {/* Creator / Owner Info */}
                        <div className="border-t border-border/50 pt-3 mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8 border border-border shrink-0">
                              <AvatarImage src={creatorAvatar} />
                              <AvatarFallback>{creatorName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate flex items-center gap-1">
                                {creatorName}
                                <Crown className="h-3 w-3 text-warning shrink-0" />
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {r.creator_email || "Creator Account"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAdminRoom(r.id, r.name)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete Room (Admin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>

                            <Link to="/rooms/$roomId" params={{ roomId: r.id }}>
                              <Button size="sm" variant="outline" className="h-8 text-xs px-2.5">
                                Inspect
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2.5">
                  {filteredRooms.map((r) => {
                    const owner = r.members?.[0];
                    const creatorName = r.creator_name || owner?.user_name || "Platform User";
                    const creatorAvatar =
                      owner?.user_avatar ||
                      `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(creatorName)}`;

                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border/60 bg-card/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                              {r.status}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground truncate">{r.hackathon}</span>
                          </div>
                          <h4 className="font-semibold text-sm truncate text-foreground">{r.name}</h4>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 border border-border shrink-0">
                              <AvatarImage src={creatorAvatar} />
                              <AvatarFallback>{creatorName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 text-left">
                              <p className="font-medium text-[11px] truncate flex items-center gap-1">
                                {creatorName}
                                <Crown className="h-2.5 w-2.5 text-warning shrink-0" />
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {r.creator_email || "Creator"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {r.members?.length || 0}/{r.max_size}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAdminRoom(r.id, r.name)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete Room (Admin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>

                            <Link to="/rooms/$roomId" params={{ roomId: r.id }}>
                              <Button size="sm" variant="outline" className="h-7 text-[11px] px-2">
                                Inspect
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Registered User Profiles Table & Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users Table */}
          <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Users2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Registered User Profiles</h2>
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  {users.length} {users.length === 1 ? "Profile" : "Profiles"}
                </Badge>
              </div>
              <div className="relative max-w-xs w-full sm:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, college…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                <Users2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No users found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4 transition hover:bg-card"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{(u.name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        {u.role === "admin" && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Admin
                          </Badge>
                        )}
                        {u.experience && u.experience !== "Beginner" && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {u.experience}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </span>
                        {u.college && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" /> {u.college}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDateNumeric(u.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sidebar Stats */}
          <section className="space-y-6">
            {stats && stats.topSkills.length > 0 && (
              <div className="glass rounded-2xl p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Top Skills
                  </h2>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {stats.topSkills.length} {stats.topSkills.length === 1 ? "Skill" : "Skills"}
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {stats.topSkills.map((s) => (
                    <div key={s.skill} className="flex items-center justify-between text-sm">
                      <span>{s.skill}</span>
                      <Badge variant="secondary">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
