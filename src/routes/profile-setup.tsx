import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, Loader2, Plus, Trash2, Globe } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SKILLS } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { detectSocialPlatform, type CustomSocialLink } from "@/lib/socialLinkDetector";

export const Route = createFileRoute("/profile-setup")({
  head: () => ({ meta: [{ title: "Complete your profile — Hackord" }] }),
  component: ProfileSetup,
});

function ProfileSetup() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [selected, setSelected] = useState<string[]>(user?.skills || []);
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || (user?.email ? user.email.split("@")[0] : ""));
  const [college, setCollege] = useState(user?.college || "");
  const [city, setCity] = useState(user?.city || "");
  const [country, setCountry] = useState(user?.country || "");
  const [experience, setExperience] = useState<string>(user?.experience || "Beginner");
  const [bio, setBio] = useState(user?.bio || "");
  const [github, setGithub] = useState(user?.github || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [discord, setDiscord] = useState((user as any)?.discord || "");
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [customLinks, setCustomLinks] = useState<CustomSocialLink[]>((user as any)?.customLinks || []);
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.avatar) setAvatar(user.avatar);
      if (user.name) setName(user.name);
      if (user.username) setUsername(user.username);
      else if (user.email) setUsername(user.email.split("@")[0]);
      if (user.college) setCollege(user.college);
      if (user.city) setCity(user.city);
      if (user.country) setCountry(user.country);
      if (user.experience) setExperience(user.experience);
      if (user.bio) setBio(user.bio);
      if (user.skills && user.skills.length > 0) setSelected(user.skills);
      if (user.github) setGithub(user.github);
      if (user.linkedin) setLinkedin(user.linkedin);
      if ((user as any).discord) setDiscord((user as any).discord);
      if (user.portfolio) setPortfolio(user.portfolio);
      if ((user as any).customLinks && (user as any).customLinks.length > 0) {
        setCustomLinks((user as any).customLinks);
      }
    }
  }, [user]);

  const toggle = (s: string) =>
    setSelected((sel) => (sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s]));

  const addCustomLink = () => {
    setCustomLinks((prev) => [...prev, { platform: "website", title: "", url: "" }]);
  };

  const updateCustomLink = (index: number, field: "url" | "title", value: string) => {
    setCustomLinks((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: value };
      if (field === "url") {
        const detected = detectSocialPlatform(value);
        current.platform = detected.platform;
        if (!copy[index].title || copy[index].title === detectSocialPlatform(copy[index].url).title) {
          current.title = detected.title;
        }
      }
      copy[index] = current;
      return copy;
    });
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validCustomLinks = customLinks
        .filter((item) => item.url && item.url.trim() !== "")
        .map((item) => ({
          platform: item.platform || detectSocialPlatform(item.url).platform,
          title: item.title?.trim() || detectSocialPlatform(item.url).title,
          url: item.url.trim(),
        }));

      await updateProfile({
        avatar: avatar.trim() || undefined,
        name,
        username: username || (user?.email ? user.email.split("@")[0] : "user"),
        college,
        city,
        country,
        experience: experience as "Beginner" | "Intermediate" | "Advanced",
        bio,
        skills: selected,
        github,
        linkedin,
        discord,
        portfolio,
        customLinks: validCustomLinks,
      });
      toast.success("Profile updated successfully!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-mesh">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <BrandLogo size="md" />
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Help teammates find you for the right hackathons.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Skip for now
            </Button>
          </div>

          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            {/* Profile Avatar with Live Preview in Placeholder Circle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl border border-border/70 ">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 bg-gradient-brand-soft shadow-md ring-2 ring-primary/10">
                <img
                  src={
                    avatar.trim() ||
                    user?.avatar ||
                    `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(name || username || "user")}`
                  }
                  alt="Profile Avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(name || username || "user")}`;
                  }}
                />
              </div>
              <div className="flex-1 w-full space-y-1.5">
                <Label className="text-xs font-semibold">Profile Photo URL</Label>
                <Input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg or DiceBear link"
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste any direct image URL.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Username"><Input value={username} onChange={(e) => setUsername(e.target.value)} required /></Field>
              <Field label="College"><Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. IIT Bombay" /></Field>
              <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" /></Field>
              <Field label="Country"><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" /></Field>
              <Field label="Experience level">
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Bio">
              <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="One line about you and what you love building." />
            </Field>

            <div>
              <Label className="mb-3 block">Skills</Label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const on = selected.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggle(s)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition",
                        on
                          ? "border-transparent bg-gradient-brand text-white shadow-glow"
                          : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="block">Social & Links</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCustomLink}
                  className="h-7 text-xs gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Link</span>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="GitHub"><Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/you" /></Field>
                <Field label="LinkedIn"><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" /></Field>
                <Field label="Discord"><Input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="https://discord.com/users/id or username" /></Field>
                <Field label="Portfolio"><Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://you.dev" /></Field>
              </div>

              {/* Dynamic Additional Links with Real-Time Auto-Detection */}
              {customLinks.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Additional links (YouTube, LeetCode, Unstop, HackerRank, Devpost, Devfolio, Luma, X, Instagram & more):
                  </p>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {customLinks.map((item, idx) => {
                      const detected = detectSocialPlatform(item.url);
                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 rounded-xl border border-border/60 bg-card/50 p-2.5"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${detected.borderColor} ${detected.bgColor}`}>
                              {detected.renderIcon("h-4 w-4")}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground sm:hidden">
                              {detected.title}
                            </span>
                          </div>

                          <div className="flex-1 w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              placeholder="https://youtube.com/@channel or url"
                              value={item.url}
                              onChange={(e) => updateCustomLink(idx, "url", e.target.value)}
                              className="text-xs h-8"
                            />
                            <Input
                              placeholder={detected.title}
                              value={item.title || ""}
                              onChange={(e) => updateCustomLink(idx, "title", e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomLink(idx)}
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive cursor-pointer ml-auto sm:ml-0"
                            title="Remove Link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Skip</Button>
              <Button type="submit" className="bg-gradient-brand text-white shadow-glow hover:opacity-90" disabled={loading}>
                {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {loading ? "Saving…" : "Save & continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
