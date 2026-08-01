import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Hackord" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("forge_focus_settings");
        if (raw) return JSON.parse(raw);
      } catch (err) {
        console.error("Error reading settings", err);
      }
    }
    return {
      n1: true,
      n2: true,
      n3: true,
      n4: false,
      darkMode: true,
      discoverable: true,
      allowInvites: true,
      connected: { GitHub: true, Google: true, LinkedIn: false },
    };
  });

  const updateSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("forge_focus_settings", JSON.stringify(updated));
      } catch (err) {
        console.error("Error saving settings", err);
      }
    }
    toast.success("Settings saved!");
  };

  const toggleConnection = (name: string) => {
    const updated = {
      ...settings,
      connected: {
        ...settings.connected,
        [name]: !settings.connected[name as keyof typeof settings.connected],
      },
    };
    setSettings(updated);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("forge_focus_settings", JSON.stringify(updated));
      } catch (err) {
        console.error("Error saving settings", err);
      }
    }
    toast.success(`${name} ${updated.connected[name as keyof typeof updated.connected] ? "connected" : "disconnected"}`);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

        <Section title="Notification preferences">
          {[
            { key: "n1", label: "Email me when I get invited to a room" },
            { key: "n2", label: "Email me about upcoming deadlines" },
            { key: "n3", label: "Notify me about new chat messages" },
            { key: "n4", label: "Notify me about meeting reminders" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <span className="text-sm">{item.label}</span>
              <Switch
                checked={!!settings[item.key as keyof typeof settings]}
                onCheckedChange={(val) => updateSetting(item.key, val)}
              />
            </div>
          ))}
        </Section>

       



        <Section title="Privacy">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Make my profile discoverable</span>
            <Switch
              checked={settings.discoverable}
              onCheckedChange={(val) => updateSetting("discoverable", val)}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Allow team invites from anyone</span>
            <Switch
              checked={settings.allowInvites}
              onCheckedChange={(val) => updateSetting("allowInvites", val)}
            />
          </div>
        </Section>

        <Section title="Danger zone" tone="danger">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">This permanently removes your workspace and data.</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => toast.error("Account deletion is disabled in demo mode")}
            >
              Delete account
            </Button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "danger" }) {
  return (
    <section className={`glass rounded-2xl p-6 shadow-card ${tone === "danger" ? "border-destructive/40" : ""}`}>
      <h2 className={`text-lg font-semibold ${tone === "danger" ? "text-destructive" : ""}`}>{title}</h2>
      <Separator className="my-4" />
      {children}
    </section>
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
