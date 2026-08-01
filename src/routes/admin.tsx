import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users2,
  UserPlus,
  ShieldCheck,
  TrendingUp,
  Search,
  GraduationCap,
  MapPin,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, type AuthUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
      const [usersRes, statsRes] = await Promise.all([
        apiFetch<{ users: AuthUser[] }>(`/admin/users?limit=100`),
        apiFetch<AdminStats>("/admin/stats"),
      ]);
      setUsers(usersRes.users);
      setStats(statsRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
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
        { label: "Today's Signups", value: stats.todaySignups, icon: UserPlus, color: "text-emerald-400" },
        { label: "This Week", value: stats.recentSignups, icon: TrendingUp, color: "text-amber-400" },
        { label: "Admins", value: stats.totalAdmins, icon: ShieldCheck, color: "text-rose-400" },
      ]
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="glass-strong rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage users and monitor platform activity
              </p>
            </div>
            <Badge className="bg-gradient-brand text-white px-3 py-1 text-xs self-start">
              Admin Access
            </Badge>
          </div>
        </section>

        {/* Stats */}
        {stats && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users Table */}
          <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Registered Users</h2>
              <div className="relative max-w-xs flex-1">
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
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                <Users2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "Try a different search term" : "No users have signed up yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
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
                        {u.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {u.city}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {u.skills && u.skills.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {u.skills.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-gradient-brand-soft px-2 py-0.5 text-[10px] text-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {u.skills.length > 5 && (
                            <span className="text-[10px] text-muted-foreground px-1">
                              +{u.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sidebar Stats */}
          <section className="space-y-6">
            {/* Top Skills */}
            {stats && stats.topSkills.length > 0 && (
              <div className="glass rounded-2xl p-6 shadow-card">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Top Skills
                </h2>
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

            {/* Experience Distribution */}
            {stats && stats.experienceDistribution.length > 0 && (
              <div className="glass rounded-2xl p-6 shadow-card">
                <h2 className="mb-4 text-lg font-semibold">Experience Levels</h2>
                <div className="space-y-3">
                  {stats.experienceDistribution.map((e) => {
                    const pct = stats.totalUsers > 0 ? Math.round((e.count / stats.totalUsers) * 100) : 0;
                    return (
                      <div key={e.level}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{e.level}</span>
                          <span className="text-xs text-muted-foreground">
                            {e.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-card overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
