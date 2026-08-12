import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createPortal } from "react-dom";
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
import { Bell, Mail, MessageSquare, PhoneCall, Shield, AlertTriangle, Loader2, FileText } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Hackord" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    emailEnabled: true,
    roomInvites: true,
    deadlines: true,
    chatMessages: true,
    desktopNotifications: true,
    reminders: false,
  });
  const [privacyPrefs, setPrivacyPrefs] = useState({
    discoverable: true,
    allowInvites: true,
    allowDirectMessages: true,
    showEmail: true,
    showOnlineStatus: true,
    activityStatus: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (authLoading || !user) return;

    async function loadSettings() {
      setLoading(true);
      try {
        const data = await getUserSettings({
          userId: user?._id,
          email: user?.email,
        });
        if (data?.privacySettings) {
          setPrivacyPrefs({
            discoverable: data.privacySettings.discoverable !== false,
            allowInvites: data.privacySettings.allowInvites !== false,
            allowDirectMessages: data.privacySettings.allowDirectMessages !== false,
            showEmail: data.privacySettings.showEmail !== false,
            showOnlineStatus: data.privacySettings.showOnlineStatus !== false && data.privacySettings.activityStatus !== false,
            activityStatus: data.privacySettings.activityStatus !== false && data.privacySettings.showOnlineStatus !== false,
          });
        }
        if (data?.notificationPreferences) {
          setNotifPrefs({
            emailEnabled: data.notificationPreferences.emailEnabled !== false,
            roomInvites: data.notificationPreferences.roomInvites !== false,
            deadlines: data.notificationPreferences.deadlines !== false,
            chatMessages: data.notificationPreferences.chatMessages !== false,
            desktopNotifications: data.notificationPreferences.desktopNotifications !== false,
            reminders: Boolean(data.notificationPreferences.reminders),
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user, authLoading]);

  const saveSettings = async (
    newNotif?: typeof notifPrefs,
    newPrivacy?: typeof privacyPrefs
  ) => {
    setSaving(true);
    try {
      const payload = {
        userId: user?._id,
        email: user?.email,
        notificationPreferences: newNotif || notifPrefs,
        privacySettings: newPrivacy || privacyPrefs,
      };
      const res = await updateUserSettings(payload);
      if (res?.privacySettings) {
        setPrivacyPrefs((prev) => ({
          ...prev,
          discoverable: res.privacySettings.discoverable !== false,
          allowInvites: res.privacySettings.allowInvites !== false,
          allowDirectMessages: res.privacySettings.allowDirectMessages !== false,
          showEmail: res.privacySettings.showEmail !== false,
          showOnlineStatus: res.privacySettings.showOnlineStatus !== false && res.privacySettings.activityStatus !== false,
          activityStatus: res.privacySettings.activityStatus !== false && res.privacySettings.showOnlineStatus !== false,
        }));
      }
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
    if (key === "showOnlineStatus") {
      updated.activityStatus = value;
    }
    setPrivacyPrefs(updated);
    saveSettings(notifPrefs, updated);
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
            Manage your account notification channels, Gmail alerts, privacy options, and security.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-card/40 animate-pulse" />
            <div className="h-48 rounded-2xl bg-card/40 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Notification Preferences (Email / Gmail) */}
            <Section title="Notification preferences" icon={Bell}>
              <div className="space-y-6">
                {/* Master Channels */}
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
                      <p className="text-xs text-muted-foreground">Notify when team members send messages or tag you.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.chatMessages}
                      onCheckedChange={(val) => toggleNotif("chatMessages", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Browser System Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Deliver alerts directly to your Desktop Notification Center and Mobile Notification Panel.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.desktopNotifications}
                      onCheckedChange={async (val) => {
                        if (val) {
                          const { requestNotificationPermission } = await import("@/lib/system-notifications");
                          const granted = await requestNotificationPermission();
                          if (!granted) {
                            toast.error("Browser notification permission was denied in your browser settings.");
                          }
                        }
                        toggleNotif("desktopNotifications", val);
                      }}
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
                    <p className="text-sm font-medium">Allow direct messages from anyone</p>
                    <p className="text-xs text-muted-foreground">Allow other platform members to start 1-on-1 direct conversations with you.</p>
                  </div>
                  <Switch
                    checked={privacyPrefs.allowDirectMessages}
                    onCheckedChange={(val) => togglePrivacy("allowDirectMessages", val)}
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
                    <p className="text-xs text-muted-foreground">Let other hackers see when you are active on the platform in real time.</p>
                  </div>
                  <Switch
                    checked={privacyPrefs.showOnlineStatus}
                    onCheckedChange={(val) => {
                      togglePrivacy("showOnlineStatus", val);
                      togglePrivacy("activityStatus", val);
                    }}
                  />
                </div>
              </div>
            </Section>

            {/* Legal & Privacy Section */}
            <Section title="Legal & Policies" icon={FileText}>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Review Hackord platform policies, Google OAuth compliance disclosures, and terms of service.
                </p>
                <div className="flex flex-wrap gap-4 pt-1">
                  <Link
                    to="/privacy"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:bg-accent"
                  >
                    <Shield className="h-4 w-4 text-primary" />
                    Read Privacy Policy
                  </Link>
                  <Link
                    to="/terms"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:bg-accent"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    Read Terms of Service
                  </Link>
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
      {showDeleteModal && typeof document !== "undefined" && createPortal(
        <>
          {/* Dark translucent backdrop overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/70 animate-fade-in"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          {/* Centered Liquid Glass Modal Card */}
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-4">
            <div className="w-full rounded-2xl border border-destructive/40 bg-card/90 backdrop-blur-2xl p-6 shadow-spatial space-y-4 animate-fade-in text-card-foreground">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h2 className="text-lg font-bold">Delete Account Permanently?</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete your account <strong>({user?.email || "your account"})</strong>?
                This action cannot be undone. All user data will be removed from MongoDB.
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
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
        </>,
        document.body
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
