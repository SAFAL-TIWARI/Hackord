import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SKILLS } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile-setup")({
  head: () => ({ meta: [{ title: "Complete your profile — HackDiscord" }] }),
  component: ProfileSetup,
});

function ProfileSetup() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(["React", "Node.js"]);

  const toggle = (s: string) =>
    setSelected((sel) => (sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s]));

  return (
    <div className="min-h-screen bg-background bg-mesh">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">HackDiscord</span>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-card animate-fade-in">
          <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Help teammates find you for the right hackathons.
          </p>

          <form
            className="mt-8 space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/dashboard" });
            }}
          >
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
              <Field label="Full name"><Input placeholder="Aarav Sharma" required /></Field>
              <Field label="Username"><Input placeholder="aarav" required /></Field>
              <Field label="College"><Input placeholder="IIT Bombay" /></Field>
              <Field label="City"><Input placeholder="Mumbai" /></Field>
              <Field label="Country"><Input placeholder="India" /></Field>
              <Field label="Experience level">
                <Select defaultValue="Intermediate">
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
              <Textarea rows={3} placeholder="One line about you and what you love building." />
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
              <Field label="GitHub"><Input placeholder="https://github.com/you" /></Field>
              <Field label="LinkedIn"><Input placeholder="https://linkedin.com/in/you" /></Field>
              <Field label="Portfolio"><Input placeholder="https://you.dev" /></Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Skip</Button>
              <Button type="submit" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
                Save & continue
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
