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
  Mail,
  Briefcase,
  Code2,
  Loader2,
  Lock,
  ShieldAlert,
  ArrowLeft,
  UserPlus,
  MessageSquare,
  Trophy,
  ExternalLink,
  Check,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getUserByUsername, sendRoomInvitation, type DbUser } from "@/lib/users-api";
import { getRooms, type DbRoom } from "@/lib/rooms-api";
import { formatDateNumeric } from "@/lib/date-utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile/$username")({
  head: () => ({ meta: [{ title: "User Profile — Hackord" }] }),
  component: PublicUserProfilePage,
});

function PublicUserProfilePage() {
  const { username: paramUsername } = Route.useParams();
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundOrPrivate, setNotFoundOrPrivate] = useState(false);
  const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);

  // Active rooms for the target user
  const [userRooms, setUserRooms] = useState<DbRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Room invitation dialog state
  const [ownedRooms, setOwnedRooms] = useState<DbRoom[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [inviteNote, setInviteNote] = useState<string>("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUserProfile() {
      if (!paramUsername) return;
      setLoading(true);
      setNotFoundOrPrivate(false);
      setIsPrivateRestricted(false);

      try {
        const data = await getUserByUsername(paramUsername);
        if (!isMounted) return;

        if (!data) {
          setNotFoundOrPrivate(true);
          return;
        }

        // Privacy Check:
        // If discoverable is false, only the user themselves or an admin can view the full profile.
        const isSelf =
          Boolean(currentUser && (currentUser._id === data._id || currentUser.email?.toLowerCase() === data.email?.toLowerCase()));
        const isRestricted = data.privacySettings?.discoverable === false;

        if (isRestricted && !isSelf && !isAdmin) {
          setIsPrivateRestricted(true);
          setTargetUser(data);
          return;
        }

        setTargetUser(data);

        // Load public rooms for this target user
        getRooms({ userId: data._id, email: data.email, userName: data.name })
          .then((r) => {
            if (isMounted) setUserRooms(r || []);
          })
          .catch(() => {
            if (isMounted) setUserRooms([]);
          })
          .finally(() => {
            if (isMounted) setRoomsLoading(false);
          });
      } catch (err) {
        if (isMounted) setNotFoundOrPrivate(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [paramUsername, currentUser, isAdmin]);

  // Load rooms owned by current viewer (for invite dialog)
  useEffect(() => {
    if (currentUser) {
      getRooms().then((r) => {
        const owned = (r || []).filter((room) => {
          if (currentUser?.role === "admin") return true;
          const userId = currentUser?._id;
          const userEmail = currentUser?.email?.toLowerCase();
          const isCreatorId = Boolean(userId && String(room.creator_id) === userId);
          const isCreatorEmail = Boolean(userEmail && room.creator_email?.toLowerCase() === userEmail);
          const isOwnerMember = room.members?.some(
            (m) =>
              (Boolean(userId && m.user_id === userId) || Boolean(userEmail && m.user_id?.toLowerCase() === userEmail)) &&
              (m.role === "Owner" || m.role === "Admin")
          );
          return isCreatorId || isCreatorEmail || isOwnerMember;
        });
        setOwnedRooms(owned);
        if (owned.length > 0) setSelectedRoomId(owned[0].id);
      });
    }
  }, [currentUser]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (!selectedRoomId) {
      toast.error("Please select a room you own to send an invite.");
      return;
    }
    const selectedRoom = ownedRooms.find((r) => r.id === selectedRoomId);
    if (selectedRoom) {
      const currentCount = selectedRoom.members?.length ?? 0;
      const maxCapacity = selectedRoom.max_size ?? 6;
      if (currentCount >= maxCapacity) {
        toast.error(`Room member limit reached (${currentCount}/${maxCapacity}). Cannot send invitation.`);
        return;
      }
    }

    setSendingInvite(true);
    try {
      await sendRoomInvitation({
        recipientId: targetUser._id,
        roomId: selectedRoomId,
        message:
          inviteNote.trim() ||
          `Hey ${targetUser.name.split(" ")[0]}! We'd love for you to join ${selectedRoom?.name || "our team room"}.`,
        senderId: currentUser?._id || "u_me",
        senderName: currentUser?.name || "Team Lead",
        senderAvatar: currentUser?.avatar || "",
      });

      toast.success(`Invitation sent to ${targetUser.name}!`);
      setInviteSent(true);
      setShowInviteDialog(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const sanitizeUrl = (url?: string) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const isSelf = Boolean(
    currentUser &&
      targetUser &&
      (currentUser._id === targetUser._id || currentUser.email?.toLowerCase() === targetUser.email?.toLowerCase())
  );

  // 1. Loading State
  if (loading || authLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-24" />
          </div>
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
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </section>
            <section className="glass rounded-2xl p-6 shadow-card space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
            </section>
          </div>
        </div>
      </AppShell>
    );
  }

  // 2. Private Profile State (Instagram / LinkedIn style)
  if (isPrivateRestricted) {
    const displayName = targetUser?.name || `@${paramUsername}`;
    const avatar = targetUser?.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(paramUsername)}`;

    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-12 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="glass-strong rounded-3xl border border-border/80 p-8 sm:p-12 text-center shadow-card relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-5">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-2 ring-border">
                  <AvatarImage src={avatar} alt={displayName} />
                  <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                    {displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1.5 shadow-md border border-border">
                  <Lock className="h-4 w-4 text-amber-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">@{paramUsername}</p>

              <div className="my-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                This Account is Private
              </div>

              <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-8">
                The owner of this profile has chosen to restrict visibility from public search and direct URL lookups.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="bg-gradient-brand text-white shadow-glow hover:opacity-90 px-5"
                >
                  Return to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/explore" })}
                  className="border-border/80 hover:bg-card px-5"
                >
                  Explore Hackathons
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // 3. User Not Found State (404)
  if (notFoundOrPrivate || !targetUser) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-12 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="glass rounded-3xl border border-border/80 p-8 sm:p-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">404 — Profile Not Found</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              We couldn't find a user profile matching <span className="font-semibold text-foreground">"@{paramUsername}"</span>.
              The account may not exist or may have been deleted.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => navigate({ to: "/dashboard" })}
                className="bg-gradient-brand text-white shadow-glow px-6"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // 4. Public Profile View
  const avatarSrc = targetUser.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(targetUser.name || paramUsername)}`;
  const initials = (targetUser.name || paramUsername)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showEmail =
    isSelf || isAdmin || Boolean(targetUser.privacySettings?.showEmail);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => history.length > 1 ? window.history.back() : navigate({ to: "/dashboard" })}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>

          {isAdmin && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin View
            </Badge>
          )}
        </div>

        {/* Profile Header Card */}
        <section className="glass-strong overflow-hidden rounded-2xl p-6 shadow-card sm:p-8 relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-glow ring-2 ring-primary/20">
                <AvatarImage src={avatarSrc} alt={targetUser.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-brand text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {targetUser.isOnline && (
                <span
                  className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm"
                  title="Online now"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight truncate">{targetUser.name}</h1>
                {targetUser.role === "admin" && (
                  <Badge variant="destructive" className="text-xs">
                    Admin
                  </Badge>
                )}
                {targetUser.experience && (
                  <Badge variant="secondary" className="text-xs">
                    <Briefcase className="mr-1 h-3 w-3 inline text-primary" />
                    {targetUser.experience}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                @{targetUser.username || paramUsername}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {showEmail && targetUser.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-primary" /> {targetUser.email}
                  </span>
                )}
                {targetUser.college && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary" /> {targetUser.college}
                  </span>
                )}
                {(targetUser.city || targetUser.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {[targetUser.city, targetUser.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-start sm:mt-1">
              {isSelf ? (
                <Button
                  onClick={() => navigate({ to: "/profile" })}
                  className="bg-gradient-brand text-white shadow-glow hover:opacity-90 gap-2 h-9 px-4 text-sm"
                >
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      if (targetUser.privacySettings?.allowDirectMessages === false) {
                        toast.error(`You can't message ${targetUser.name}.`);
                        return;
                      }
                      navigate({ to: "/chat", search: { userId: targetUser._id } });
                    }}
                    variant="outline"
                    className="h-9 px-4 gap-2 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Direct Chat
                  </Button>

                  {inviteSent ? (
                    <Badge variant="outline" className="h-9 px-4 gap-1 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      <Check className="h-4 w-4" /> Invited
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => {
                        if (targetUser.privacySettings?.allowInvites === false) {
                          toast.error(`${targetUser.name} does not accept room invitations.`);
                          return;
                        }
                        setShowInviteDialog(true);
                      }}
                      className="bg-gradient-brand text-white shadow-glow hover:opacity-90 gap-2 h-9 px-4 text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite to Room
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm text-muted-foreground leading-relaxed">
            {targetUser.bio || "No bio added yet."}
          </p>
        </section>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="glass rounded-2xl p-6 shadow-card lg:col-span-2 space-y-6">
            {/* Skills */}
            <div>
              <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" /> Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {targetUser.skills && targetUser.skills.length > 0 ? (
                  targetUser.skills.map((s) => (
                    <Badge
                      key={s}
                      className="border-transparent bg-gradient-brand-soft text-foreground text-xs py-1 px-3"
                    >
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed.</p>
                )}
              </div>
            </div>

            {/* Active Rooms */}
            <div>
              <h2 className="mb-3 text-lg font-semibold">Active Rooms</h2>
              {roomsLoading ? (
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                  <Skeleton className="h-16 w-48 shrink-0 rounded-xl" />
                  <Skeleton className="h-16 w-48 shrink-0 rounded-xl" />
                </div>
              ) : userRooms.length > 0 ? (
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
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 shrink-0 bg-primary/10 text-primary border-primary/20"
                        >
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

            {/* Completed Hackathons */}
            <div>
              <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" /> Completed Hackathons
              </h2>
              {targetUser.completedHackathons && targetUser.completedHackathons.length > 0 ? (
                <ul className="space-y-2.5 text-sm">
                  {targetUser.completedHackathons.map((h, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-medium">{h.name}</span>
                      </div>
                      {h.result && <Badge variant="secondary">{h.result}</Badge>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No completed hackathons listed.</p>
              )}
            </div>
          </section>

          {/* Social & Links Sidebar */}
          <section className="glass rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold">Social & Links</h2>
            <ul className="space-y-3.5 text-sm">
              {targetUser.github ? (
                <li>
                  <a
                    className="inline-flex items-center gap-2.5 hover:text-foreground text-muted-foreground transition group"
                    href={sanitizeUrl(targetUser.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="truncate max-w-[170px]">{targetUser.github.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </a>
                </li>
              ) : (
                <li className="text-xs text-muted-foreground flex items-center gap-2">
                  <Github className="h-4 w-4" /> GitHub not added
                </li>
              )}
              {targetUser.linkedin ? (
                <li>
                  <a
                    className="inline-flex items-center gap-2.5 hover:text-foreground text-muted-foreground transition group"
                    href={sanitizeUrl(targetUser.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate max-w-[170px]">{targetUser.linkedin.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </a>
                </li>
              ) : (
                <li className="text-xs text-muted-foreground flex items-center gap-2">
                  <Linkedin className="h-4 w-4" /> LinkedIn not added
                </li>
              )}
              {targetUser.portfolio ? (
                <li>
                  <a
                    className="inline-flex items-center gap-2.5 hover:text-foreground text-muted-foreground transition group"
                    href={sanitizeUrl(targetUser.portfolio)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate max-w-[170px]">{targetUser.portfolio.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
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

      {/* Room Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite {targetUser.name} to Your Room</DialogTitle>
            <DialogDescription>
              Select which hackathon room you own to invite this hacker.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Select Owned Room</label>
              {ownedRooms.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  ⚠️ Only the <strong>Owner</strong> of a room (or Platform Admin) can send room invitations. You do not currently own any active rooms.
                </div>
              ) : (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
                >
                  {ownedRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.hackathon}) — [Owner]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {ownedRooms.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Personal Message (Optional)</label>
                <Textarea
                  rows={3}
                  placeholder={`Hey ${targetUser.name.split(" ")[0]}! Join our team to work together.`}
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingInvite || ownedRooms.length === 0}
                className="bg-gradient-brand text-white shadow-glow"
              >
                {sendingInvite ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
