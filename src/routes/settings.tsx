import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — HackDiscord" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

        <Section title="Change password">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password"><Input type="password" /></Field>
            <Field label="New password"><Input type="password" /></Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className="bg-gradient-brand text-white shadow-glow hover:opacity-90">Update password</Button>
          </div>
        </Section>

        <Section title="Notification preferences">
          {[
            "Email me when I get invited to a room",
            "Email me about upcoming deadlines",
            "Notify me about new chat messages",
            "Notify me about meeting reminders",
          ].map((label, i) => (
            <div key={label} className="flex items-center justify-between py-2">
              <span className="text-sm">{label}</span>
              <Switch defaultChecked={i < 3} />
            </div>
          ))}
        </Section>

        <Section title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">HackDiscord is optimized for dark mode.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </Section>

        <Section title="Connected accounts">
          {[
            { name: "GitHub", connected: true },
            { name: "Google", connected: true },
            { name: "LinkedIn", connected: false },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between py-2">
              <span className="text-sm">{a.name}</span>
              <Button variant={a.connected ? "outline" : "default"} size="sm">
                {a.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </Section>

        <Section title="Privacy">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Make my profile discoverable</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Allow team invites from anyone</span>
            <Switch defaultChecked />
          </div>
        </Section>

        <Section title="Danger zone" tone="danger">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">This permanently removes your workspace and data.</p>
            </div>
            <Button variant="destructive">Delete account</Button>
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
