import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Camera, Check, Loader2 } from "lucide-react";
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
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
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
      if (user.portfolio) setPortfolio(user.portfolio);
    }
  }, [user]);

  const toggle = (s: string) =>
    setSelected((sel) => (sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
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
        portfolio,
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
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-brand-soft border border-border">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <Button type="button" variant="outline" size="sm">Upload photo</Button>
                <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to 4MB</p>
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

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="GitHub"><Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/you" /></Field>
              <Field label="LinkedIn"><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" /></Field>
              <Field label="Portfolio"><Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://you.dev" /></Field>
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
