import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  X,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENT_USER, ROOMS, SKILLS } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

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

const DEFAULT_PROFILE: UserProfile = {
  id: CURRENT_USER.id,
  name: CURRENT_USER.name,
  username: CURRENT_USER.username,
  email: "aarav.sharma@iitb.ac.in", // Read only email
  avatar: CURRENT_USER.avatar,
  college: CURRENT_USER.college,
  city: CURRENT_USER.city || "Mumbai",
  country: CURRENT_USER.country || "India",
  skills: CURRENT_USER.skills || ["React", "Node.js", "UI/UX"],
  github: CURRENT_USER.github,
  linkedin: CURRENT_USER.linkedin,
  portfolio: "https://aarav.dev",
  bio: "Building useful things at hackathons. Focused on developer tooling, full-stack systems, and thoughtful UI.",
  experience: CURRENT_USER.experience || "Advanced",
  completedHackathons: [
    { name: "HackMIT 2025", result: "Top 10" },
    { name: "ETHIndia 2024", result: "Finalist" },
    { name: "Smart India 2024", result: "Winner" },
  ],
};

const STORAGE_KEY = "forge_focus_user_profile";

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (err) {
        console.error("[profile] Error reading profile from localStorage:", err);
      }
    }
    return DEFAULT_PROFILE;
  });

  const [editOpen, setEditOpen] = useState(false);

  // Edit modal state
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [newHackName, setNewHackName] = useState("");
  const [newHackResult, setNewHackResult] = useState("");

  const handleOpenEdit = () => {
    setEditForm(JSON.parse(JSON.stringify(profile)));
    setEditOpen(true);
  };

  const saveProfile = () => {
    setProfile(editForm);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(editForm));
      } catch (err) {
        console.error("[profile] Error saving profile to localStorage:", err);
      }
    }
    setEditOpen(false);
    toast.success("Profile updated successfully!");
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

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Profile Card Header */}
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 border-4 border-background shadow-glow">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{(profile.name || "A")[0]}</AvatarFallback>
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
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> {profile.college}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {profile.city}, {profile.country}
                </span>
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
            {profile.bio || "No bio added yet."}
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
                  <p className="text-sm text-muted-foreground">No skills selected.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Active Rooms</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROOMS.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border/60 bg-card/50 p-4 transition hover:bg-card">
                    <p className="text-xs text-muted-foreground">{r.hackathon}</p>
                    <p className="mt-1 font-medium text-sm">{r.name}</p>
                  </div>
                ))}
              </div>
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
              Update your profile details. All changes save to your local storage.
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
                  placeholder="Aarav Sharma"
                />
              </Field>
              <Field label="Username">
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="aarav"
                />
              </Field>
              <Field label="College / University">
                <Input
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  placeholder="IIT Bombay"
                />
              </Field>
              <Field label="City">
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </Field>
              <Field label="Country">
                <Input
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  placeholder="India"
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
                placeholder="https://api.dicebear.com/9.x/glass/svg?seed=Aarav"
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
                  placeholder="https://github.com/aarav"
                />
              </Field>
              <Field label="LinkedIn URL">
                <Input
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/aarav"
                />
              </Field>
              <Field label="Portfolio URL">
                <Input
                  value={editForm.portfolio}
                  onChange={(e) => setEditForm({ ...editForm, portfolio: e.target.value })}
                  placeholder="https://aarav.dev"
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
            >
              Save Changes
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
