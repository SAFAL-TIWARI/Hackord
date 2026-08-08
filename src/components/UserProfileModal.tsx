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
  Sparkles,
  Check,
  Building2,
  ExternalLink,
} from "lucide-react";
import { type DbUser, sendRoomInvitation } from "@/lib/users-api";
import { getRooms, type DbRoom } from "@/lib/rooms-api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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
          const isCreatorId = room.creator_id === currentUser?._id || room.creator_id === currentUser?.id;
          const isCreatorEmail = currentUser?.email && room.creator_email?.toLowerCase() === currentUser.email.toLowerCase();
          const isOwnerMember = room.members?.some(
            (m) =>
              (m.user_id === currentUser?._id || m.user_id === currentUser?.id || (currentUser?.email && m.user_id?.toLowerCase() === currentUser.email.toLowerCase())) &&
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

              <div className="flex items-center gap-2">
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
                    <Sparkles className="mr-1 h-3 w-3 inline" />
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
              <div className="mt-4 rounded-xl border border-border/60 bg-card/40 p-3 text-sm text-foreground/90">
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
              <div className="flex flex-wrap gap-2">
                {userProp.github && (
                  <a
                    href={sanitizeUrl(userProp.github)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium hover:border-primary/50 hover:bg-accent transition"
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
                    className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium text-blue-400 hover:border-blue-400/50 hover:bg-blue-500/10 transition"
                  >
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    <span className="truncate max-w-[140px]">{userProp.linkedin.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
                  </a>
                )}

                {userProp.portfolio && (
                  <a
                    href={sanitizeUrl(userProp.portfolio)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium text-emerald-400 hover:border-emerald-400/50 hover:bg-emerald-500/10 transition"
                  >
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <span className="truncate max-w-[140px]">{userProp.portfolio.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
                  </a>
                )}
              </div>
            </div>
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
