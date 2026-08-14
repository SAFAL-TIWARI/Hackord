import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Check,
  Mail,
  Sparkles,
  Loader2,
  X,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SKILLS } from "@/lib/dummy-data";
import { getRooms, type DbRoom } from "@/lib/rooms-api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Hackord" }] }),
  component: ProfilePage,
});

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  college: string;
  city: string;
  country: string;
  skills: string[];
  github: string;
  linkedin: string;
  portfolio: string;
  bio: string;
  experience: "Beginner" | "Intermediate" | "Advanced";
  completedHackathons: { name: string; result: string }[];
};

function ProfilePage() {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  const getProfileState = (): UserProfile => {
    if (!user) {
      return {
        id: "",
        name: "",
        username: "",
        email: "",
        avatar: "",
        college: "",
        city: "",
        country: "",
        skills: [],
        github: "",
        linkedin: "",
        portfolio: "",
        bio: "",
        experience: "Beginner",
        completedHackathons: [],
      };
    }
    return {
      id: user._id || "",
      name: user.name || "",
      username: user.username || (user.email ? user.email.split("@")[0] : ""),
      email: user.email || "",
      avatar: user.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${user.name || "user"}`,
      college: user.college || "",
      city: user.city || "",
      country: user.country || "",
      skills: user.skills || [],
      github: user.github || "",
      linkedin: user.linkedin || "",
      portfolio: user.portfolio || "",
      bio: user.bio || "",
      experience: (user.experience as any) || "Beginner",
      completedHackathons: user.completedHackathons || [],
    };
  };

  const profile = getProfileState();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [newHackName, setNewHackName] = useState("");
  const [newHackResult, setNewHackResult] = useState("");
  const [saving, setSaving] = useState(false);
  const [userRooms, setUserRooms] = useState<DbRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setEditForm(getProfileState());
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getRooms({ userId: user._id, email: user.email, userName: user.name })
        .then((data) => setUserRooms(data || []))
        .catch((err) => console.error("Failed to fetch profile rooms", err))
        .finally(() => setRoomsLoading(false));
    } else {
      setUserRooms([]);
      setRoomsLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!user) return null;

  const handleOpenEdit = () => {
    setEditForm(getProfileState());
    setEditOpen(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: editForm.name,
        username: editForm.username,
        avatar: editForm.avatar,
        college: editForm.college,
        city: editForm.city,
        country: editForm.country,
        bio: editForm.bio,
        experience: editForm.experience,
        skills: editForm.skills,
        github: editForm.github,
        linkedin: editForm.linkedin,
        portfolio: editForm.portfolio,
        completedHackathons: editForm.completedHackathons,
      });
      setEditOpen(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setEditForm((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  const addHackathon = () => {
    if (!newHackName.trim()) return;
    setEditForm((prev) => ({
      ...prev,
      completedHackathons: [
        ...prev.completedHackathons,
        { name: newHackName.trim(), result: newHackResult.trim() || "Participant" },
      ],
    }));
    setNewHackName("");
    setNewHackResult("");
  };

  const removeHackathon = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      completedHackathons: prev.completedHackathons.filter((_, i) => i !== index),
    }));
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8 space-y-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Skeleton className="h-24 w-24 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="mt-3 flex gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl" />
          </section>
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              </div>
            </section>
            <section className="glass rounded-2xl p-6 shadow-card space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
            </section>
          </div>
        </div>
      </AppShell>
    );
  }

  const avatarSrc = profile.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(profile.name)}`;
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Profile Card Header */}
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 border-4 border-background shadow-glow">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
                <Badge variant="secondary">{profile.experience}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-primary" /> {profile.email}
                </span>
                {profile.college && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" /> {profile.college}
                  </span>
                )}
                {(profile.city || profile.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={handleOpenEdit}
              className="bg-gradient-brand text-white shadow-glow hover:opacity-90 shrink-0"
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Edit Profile
            </Button>
          </div>
          <p className="mt-6 max-w-3xl text-sm text-muted-foreground leading-relaxed">
            {profile.bio || "No bio added yet. Click 'Edit Profile' to introduce yourself!"}
          </p>
        </section>

        {/* Content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2 space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((s) => (
                    <Badge key={s} className="border-transparent bg-gradient-brand-soft text-foreground text-xs py-1 px-3">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills selected yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Active Rooms</h2>
              {roomsLoading ? (
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                  <Skeleton className="h-16 w-48 shrink-0 rounded-xl" />
                  <Skeleton className="h-16 w-48 shrink-0 rounded-xl" />
                </div>
              ) : userRooms.length > 0 ? (
                /* Horizontal Scrollbar Container for Active Rooms */
                <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1">
                  {userRooms.map((r) => (
                    <Link
                      key={r.id}
                      to="/rooms/$roomId"
                      params={{ roomId: r.id }}
                      className="group flex-none min-w-[200px] max-w-[260px] rounded-xl border border-border/70 bg-card/60 p-3.5 transition hover:bg-card hover:border-primary/60 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-semibold text-sm group-hover:text-primary transition truncate">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.hackathon}</p>
                      </div>
                      {r.status && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 shrink-0 bg-primary/10 text-primary border-primary/20">
                          {r.status}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active rooms found.</p>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Completed Hackathons</h2>
              {profile.completedHackathons.length > 0 ? (
                <ul className="space-y-2.5 text-sm">
                  {profile.completedHackathons.map((h, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-3.5">
                      <span className="font-medium">{h.name}</span>
                      <Badge variant="secondary">{h.result}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No completed hackathons added.</p>
              )}
            </div>
          </section>

          <section className="glass rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold">Social & Links</h2>
            <ul className="space-y-3.5 text-sm">
              {profile.github ? (
                <li>
                  <a
                    className="inline-flex items-center gap-2.5 hover:text-foreground text-muted-foreground transition"
                    href={profile.github.startsWith("http") ? profile.github : `https://${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 text-primary" /> GitHub Profile
                  </a>
                </li>
              ) : (
                <li className="text-xs text-muted-foreground flex items-center gap-2">
                  <Github className="h-4 w-4" /> GitHub not added
                </li>
              )}
              {profile.linkedin ? (
                <li>
                  <a
                    className="inline-flex items-center gap-2.5 hover:text-foreground text-muted-foreground transition"
                    href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4 text-blue-400" /> LinkedIn Profile
                  </a>
                </li>
              ) : (
                <li className="text-xs text-muted-foreground flex items-center gap-2">
                  <Linkedin className="h-4 w-4" /> LinkedIn not added
                </li>
              )}
              {profile.portfolio ? (
                <li>
                  <a
                    className="inline-flex items-center gap-2.5 hover:text-foreground text-muted-foreground transition"
                    href={profile.portfolio.startsWith("http") ? profile.portfolio : `https://${profile.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4 text-emerald-400" /> Portfolio Website
                  </a>
                </li>
              ) : (
                <li className="text-xs text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Portfolio not added
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile details. Changes will save directly to MongoDB.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-3">
            {/* Email (READ ONLY) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Read Only</Badge>
              </div>
              <Input value={editForm.email} disabled className="bg-muted/50 cursor-not-allowed opacity-75" />
            </div>

            {/* Editable Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Full Name"
                />
              </Field>
              <Field label="Username">
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="username"
                />
              </Field>
              <Field label="College / University">
                <Input
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  placeholder="e.g. IIT Bombay"
                />
              </Field>
              <Field label="City">
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                />
              </Field>
              <Field label="Country">
                <Input
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  placeholder="e.g. India"
                />
              </Field>
              <Field label="Experience Level">
                <Select
                  value={editForm.experience}
                  onValueChange={(val: any) => setEditForm({ ...editForm, experience: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Avatar Image URL">
              <Input
                value={editForm.avatar}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                placeholder="https://api.dicebear.com/9.x/glass/svg?seed=User"
              />
            </Field>

            <Field label="Bio">
              <Textarea
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell teammates about yourself and what you love building."
              />
            </Field>

            {/* Skills selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Skills</Label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-border/60 bg-card/40">
                {SKILLS.map((s) => {
                  const active = editForm.skills.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition",
                        active
                          ? "bg-gradient-brand text-white shadow-glow font-medium"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Links */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="GitHub URL">
                <Input
                  value={editForm.github}
                  onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                  placeholder="https://github.com/you"
                />
              </Field>
              <Field label="LinkedIn URL">
                <Input
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/you"
                />
              </Field>
              <Field label="Portfolio URL">
                <Input
                  value={editForm.portfolio}
                  onChange={(e) => setEditForm({ ...editForm, portfolio: e.target.value })}
                  placeholder="https://you.dev"
                />
              </Field>
            </div>

            {/* Completed Hackathons Manager */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <Label className="text-xs font-semibold">Completed Hackathons</Label>
              <div className="space-y-2">
                {editForm.completedHackathons.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 p-2.5">
                    <span className="flex-1 text-sm font-medium">{h.name}</span>
                    <Badge variant="secondary" className="text-xs">{h.result}</Badge>
                    <button
                      type="button"
                      onClick={() => removeHackathon(i)}
                      className="p-1 text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center pt-1">
                <Input
                  placeholder="Hackathon name (e.g. HackMIT 2026)"
                  value={newHackName}
                  onChange={(e) => setNewHackName(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Input
                  placeholder="Result (e.g. Winner)"
                  value={newHackResult}
                  onChange={(e) => setNewHackResult(e.target.value)}
                  className="w-36 text-sm"
                />
                <Button type="button" size="sm" onClick={addHackathon} variant="outline">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveProfile}
              className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
