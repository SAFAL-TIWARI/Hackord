import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GraduationCap,
  MapPin,
  Github,
  Linkedin,
  Globe,
  UserPlus,
  Briefcase,
  Check,
  Building2,
  ExternalLink,
  Trophy,
  Copy,
  Hash,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type DbUser, sendRoomInvitation } from "@/lib/users-api";
import { getRooms, type DbRoom } from "@/lib/rooms-api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { detectSocialPlatform } from "@/lib/socialLinkDetector";

interface UserProfileModalProps {
  user: DbUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({
  user: userProp,
  open,
  onOpenChange,
}: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [inviteNote, setInviteNote] = useState<string>("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (open) {
      setInviteSent(false);
      setShowInviteDialog(false);
      getRooms().then((r) => {
        const ownedRooms = (r || []).filter((room) => {
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
        setRooms(ownedRooms);
        if (ownedRooms.length > 0) setSelectedRoomId(ownedRooms[0].id);
        else setSelectedRoomId("");
      });
    }
  }, [open, currentUser]);

  if (!userProp) return null;

  const sanitizeUrl = (url?: string) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error("Please select a room you own to send an invite.");
      return;
    }
    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
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
        recipientId: userProp._id,
        roomId: selectedRoomId,
        message:
          inviteNote.trim() ||
          `Hey ${userProp.name.split(" ")[0]}! We'd love for you to join ${selectedRoom?.name || "our team room"}.`,
        senderId: currentUser?._id || "u_me",
        senderName: currentUser?.name || "Team Lead",
        senderAvatar: currentUser?.avatar || "",
      });

      toast.success(`Invitation sent to ${userProp.name}!`);
      setInviteSent(true);
      setShowInviteDialog(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 sm:rounded-2xl">
          {/* Header banner */}
          <div className="relative h-32 bg-gradient-to-r from-primary/30 via-purple-600/20 to-blue-600/30 p-4">
            <DialogHeader className="sr-only">
              <DialogTitle>{userProp.name}'s Profile</DialogTitle>
              <DialogDescription>Full profile details for user search result</DialogDescription>
            </DialogHeader>
          </div>

          {/* Profile overview body */}
          <div className="relative px-6 pb-6 pt-0">
            {/* Avatar & Action Button */}
            <div className="flex flex-wrap items-end justify-between -mt-14 mb-4 gap-3">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={userProp.avatar} alt={userProp.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-brand text-white">
                  {userProp.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2 -mx-4">
                <Button
                  type="button"
                  onClick={() => {
                    if (userProp.privacySettings?.allowDirectMessages === false) {
                      toast.error(`You can't message ${userProp.name}.`);
                      return;
                    }
                    onOpenChange(false);
                    navigate({ to: "/chat", search: { userId: userProp._id } });
                  }}
                  variant="outline"
                  className="h-9 px-4 gap-2 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    navigate({ to: `/profile/${userProp.username || userProp._id}` });
                  }}
                  className="h-9 px-3.5 gap-1.5 text-sm hover:bg-card hover:border-primary/40 transition"
                  title="Open Full Profile Page"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Profile
                </Button>

                {inviteSent ? (
                  <Badge variant="outline" className="h-9 px-4 gap-1 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <Check className="h-4 w-4" /> Invited
                  </Badge>
                ) : (
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="bg-gradient-brand text-white shadow-glow hover:opacity-90 gap-2 h-9 px-4 text-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite to Room
                  </Button>
                )}
              </div>
            </div>

            {/* Name & Titles */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{userProp.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  @{userProp.username || userProp.name.toLowerCase().replace(/\s+/g, "")}
                </Badge>
                {userProp.experience && (
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                    <Briefcase className="mr-1 h-3 w-3 inline" />
                    {userProp.experience}
                  </Badge>
                )}
              </div>

              {/* Sub-info metadata */}
              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                {userProp.college && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    {userProp.college}
                  </span>
                )}
                {(userProp.city || userProp.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    {[userProp.city, userProp.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {userProp.bio && (
              <div className="mt-4 rounded-xl border border-border bg-card/45 backdrop-blur-md p-3 text-sm text-foreground/90 shadow-card">
                <p>{userProp.bio}</p>
              </div>
            )}

            {/* Skills */}
            {userProp.skills && userProp.skills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Skills & Expertise
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {userProp.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Social & Portfolio Handles */}
            <div className="mt-5 border-t border-border/60 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Social Profiles & Links
              </h4>
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                {userProp.github && (
                  <a
                    href={sanitizeUrl(userProp.github)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md px-3 py-2 text-xs font-medium hover:border-primary/50 hover:bg-card/75 shadow-sm transition"
                  >
                    <Github className="h-4 w-4 text-foreground" />
                    <span className="truncate max-w-[140px]">{userProp.github.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
                  </a>
                )}

                {userProp.linkedin && (
                  <a
                    href={sanitizeUrl(userProp.linkedin)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md px-3 py-2 text-xs font-medium text-blue-400 hover:border-blue-400/50 hover:bg-blue-500/10 shadow-sm transition"
                  >
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    <span className="truncate max-w-[140px]">{userProp.linkedin.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
                  </a>
                )}

                {(userProp as any).discord && (
                  <a
                    href={(userProp as any).discord.startsWith("http") ? (userProp as any).discord : `https://discord.com/users/${(userProp as any).discord}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md px-3 py-2 text-xs font-medium text-[#5865F2] hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10 shadow-sm transition"
                  >
                    <svg className="h-4 w-4 fill-current text-[#5865F2]" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span className="truncate max-w-[140px]">{(userProp as any).discord.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
                  </a>
                )}

                {userProp.portfolio && (
                  <a
                    href={sanitizeUrl(userProp.portfolio)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md px-3 py-2 text-xs font-medium text-emerald-400 hover:border-emerald-400/50 hover:bg-emerald-500/10 shadow-sm transition"
                  >
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <span className="truncate max-w-[140px]">{userProp.portfolio.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
                  </a>
                )}

                {/* Additional Auto-Detected Custom Links */}
                {(userProp as any).customLinks && (userProp as any).customLinks.map((item: any, idx: number) => {
                  if (!item.url) return null;
                  const detected = detectSocialPlatform(item.url);
                  const displayTitle = item.title?.trim() || detected.title;
                  const formattedUrl = item.url.startsWith("http") ? item.url : `https://${item.url}`;
                  return (
                    <a
                      key={idx}
                      href={formattedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 rounded-xl border ${detected.borderColor} ${detected.bgColor} px-3 py-2 text-xs font-medium shadow-sm transition hover:scale-105 group`}
                      title={displayTitle}
                    >
                      {detected.renderIcon("h-4 w-4 group-hover:scale-110 transition-transform")}
                      <span className="truncate max-w-[140px]">{displayTitle}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Completed Hackathons */}
            {userProp.completedHackathons && userProp.completedHackathons.length > 0 && (
              <div className="mt-4 border-t border-border/60 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  Completed Hackathons ({userProp.completedHackathons.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userProp.completedHackathons.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="font-medium">{h.name}</span>
                      {h.result && (
                        <Badge variant="outline" className="border-amber-400/40 text-[10px] py-0 px-1 text-amber-300">
                          {h.result}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialog for room invite */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite {userProp.name} to Your Room</DialogTitle>
            <DialogDescription>
              Select which hackathon room you own to invite this hacker.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Select Owned Room</label>
              {rooms.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  ⚠️ Only the <strong>Owner</strong> of a room (or Platform Admin) can send room invitations. You do not currently own any active rooms.
                </div>
              ) : (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.hackathon}) — [Owner]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {rooms.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Personal Message (Optional)</label>
                <Textarea
                  rows={3}
                  placeholder={`Hey ${userProp.name.split(" ")[0]}! Join our team to work together.`}
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
                disabled={sendingInvite || rooms.length === 0}
                className="bg-gradient-brand text-white shadow-glow"
              >
                {sendingInvite ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
