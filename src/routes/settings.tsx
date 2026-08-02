import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getUserSettings, updateUserSettings, deleteUserAccount, type UserSettings } from "@/lib/users-api";
import { Bell, Mail, MessageSquare, PhoneCall, Shield, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Hackord" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    emailEnabled: true,
    whatsappEnabled: true,
    roomInvites: true,
    deadlines: true,
    chatMessages: true,
    reminders: false,
  });
  const [privacyPrefs, setPrivacyPrefs] = useState({
    discoverable: true,
    allowInvites: true,
    showEmail: true,
    showPhone: true,
    activityStatus: true,
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await getUserSettings({
          userId: user?._id,
          email: user?.email,
        });
        if (data) {
          setWhatsappNumber(data.whatsappNumber || "");
          setNotifPrefs(data.notificationPreferences || notifPrefs);
          setPrivacyPrefs(data.privacySettings || privacyPrefs);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  const saveSettings = async (
    newNotif?: typeof notifPrefs,
    newPrivacy?: typeof privacyPrefs,
    newPhone?: string
  ) => {
    setSaving(true);
    try {
      const payload = {
        userId: user?._id,
        email: user?.email,
        whatsappNumber: newPhone !== undefined ? newPhone : whatsappNumber,
        notificationPreferences: newNotif || notifPrefs,
        privacySettings: newPrivacy || privacyPrefs,
      };
      await updateUserSettings(payload);
      toast.success("Settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    saveSettings(updated, privacyPrefs);
  };

  const togglePrivacy = (key: keyof typeof privacyPrefs, value: boolean) => {
    const updated = { ...privacyPrefs, [key]: value };
    setPrivacyPrefs(updated);
    saveSettings(notifPrefs, updated);
  };

  const handleWhatsappSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (whatsappNumber && whatsappNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    saveSettings(notifPrefs, privacyPrefs, whatsappNumber);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteUserAccount({ userId: user?._id, email: user?.email });
      toast.success("Your account has been permanently deleted from database.");
      logout();
      navigate({ to: "/auth" as any });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account notification channels, WhatsApp alerts, privacy options, and security.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-card/40 animate-pulse" />
            <div className="h-48 rounded-2xl bg-card/40 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Notification Preferences (Email & WhatsApp) */}
            <Section title="Notification preferences" icon={Bell}>
              <div className="space-y-6">
                {/* Master Channels */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Email Alerts (Gmail)</span>
                      </div>
                      <Switch
                        checked={notifPrefs.emailEnabled}
                        onCheckedChange={(val) => toggleNotif("emailEnabled", val)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Receive invitations, room activities, and deadline updates via Email.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">WhatsApp Alerts</span>
                      </div>
                      <Switch
                        checked={notifPrefs.whatsappEnabled}
                        onCheckedChange={(val) => toggleNotif("whatsappEnabled", val)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Receive instant message alerts directly on WhatsApp.
                    </p>
                  </div>
                </div>

                {/* WhatsApp Phone Number Config */}
                <form onSubmit={handleWhatsappSave} className="rounded-xl border border-border/70 bg-card/40 p-4 space-y-3">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    WhatsApp Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      maxLength={10}
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter 10-digit WhatsApp number"
                      className="text-xs bg-background/50 h-9"
                    />
                    <Button type="submit" size="sm" disabled={saving} className="bg-gradient-brand text-white text-xs h-9">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Number"}
                    </Button>
                  </div>
                </form>

                <Separator />

                {/* Event Alert Toggles */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Event Alert Preferences</h3>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Room & Team Invitations</p>
                      <p className="text-xs text-muted-foreground">Notify when someone invites you to join their hackathon team.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.roomInvites}
                      onCheckedChange={(val) => toggleNotif("roomInvites", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Upcoming Hackathon Deadlines</p>
                      <p className="text-xs text-muted-foreground">Receive reminders before PPT, prototype, and final submission deadlines.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.deadlines}
                      onCheckedChange={(val) => toggleNotif("deadlines", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">New Chat Messages & Mentions</p>
                      <p className="text-xs text-muted-foreground">Notify when team members send messages in room channels.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.chatMessages}
                      onCheckedChange={(val) => toggleNotif("chatMessages", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Meeting & Audio Reminders</p>
                      <p className="text-xs text-muted-foreground">Alerts when a team huddle or video call starts.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.reminders}
                      onCheckedChange={(val) => toggleNotif("reminders", val)}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Privacy Settings */}
            <Section title="Privacy & Security" icon={Shield}>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Make profile discoverable</p>
                    <p className="text-xs text-muted-foreground">Allow other hackers to search and find your profile by skills/name.</p>
                  </div>
                  <Switch
                    checked={privacyPrefs.discoverable}
                    onCheckedChange={(val) => togglePrivacy("discoverable", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Allow team invites from anyone</p>
                    <p className="text-xs text-muted-foreground">Enable non-teammates to send you room collaboration requests.</p>
                  </div>
                  <Switch
                    checked={privacyPrefs.allowInvites}
                    onCheckedChange={(val) => togglePrivacy("allowInvites", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Show email address</p>
                    <p className="text-xs text-muted-foreground">Display email address to teammates inside shared rooms.</p>
                  </div>
                  <Switch
                    checked={privacyPrefs.showEmail}
                    onCheckedChange={(val) => togglePrivacy("showEmail", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Show active / online status</p>
                    <p className="text-xs text-muted-foreground">Let team members see when you are currently online in workspace.</p>
                  </div>
                  <Switch
                    checked={privacyPrefs.activityStatus}
                    onCheckedChange={(val) => togglePrivacy("activityStatus", val)}
                  />
                </div>
              </div>
            </Section>

            {/* Danger Zone / Delete Account */}
            <Section title="Danger Zone" tone="danger" icon={AlertTriangle}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Delete account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your user account, profile, notes, and pending invitations from database.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete account
                </Button>
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-lg font-bold">Delete Account Permanently?</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete your account <strong>({user?.email || "your account"})</strong>?
              This action cannot be undone. All user data will be removed from MongoDB.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Section({
  title,
  children,
  tone,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "danger";
  icon?: React.ElementType;
}) {
  return (
    <section className={`glass rounded-2xl p-6 shadow-card ${tone === "danger" ? "border-destructive/40" : ""}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-5 w-5 ${tone === "danger" ? "text-destructive" : "text-primary"}`} />}
        <h2 className={`text-lg font-semibold ${tone === "danger" ? "text-destructive" : ""}`}>{title}</h2>
      </div>
      <Separator className="my-4" />
      {children}
    </section>
  );
}
