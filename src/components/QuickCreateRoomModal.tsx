/**
 * QuickCreateRoomModal — one-click room creation pre-filled from a hackathon card.
 * The user only needs to provide their team name; everything else is pre-populated.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, CalendarDays, MapPin, Zap } from "lucide-react";
import { createRoom } from "@/lib/rooms-api";
import { useAuth } from "@/lib/auth";
import type { Hackathon } from "@/lib/hackathon-data";

interface QuickCreateRoomModalProps {
  hackathon: Hackathon | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function QuickCreateRoomModal({
  hackathon,
  open,
  onOpenChange,
}: QuickCreateRoomModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!hackathon) return null;

  async function handleCreate() {
    if (!hackathon) return;
    const name = teamName.trim() || `Team for ${hackathon.name}`;
    const id =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) +
      "-" +
      Date.now().toString(36);

    setLoading(true);
    try {
      await createRoom({
        data: {
          id,
          hackathon: hackathon.name,
          name,
          problem: "",
          description: `Organizer: ${hackathon.organizer}\nPrize Pool: ${hackathon.prizePool}\nMode: ${hackathon.mode}\n\n${hackathon.description}`,
          maxSize: hackathon.teamSize.max,
          deadlineRegistration: hackathon.registrationDeadline,
          deadlinePpt: "",
          deadlinePrototype: "",
          deadlineFinal: hackathon.submissionDeadline,
          deadlineResult: hackathon.resultDate,
          projectLinks: [
            { label: "Hackathon Page", url: hackathon.banner || "" },
          ],
          creatorId: user?._id,
          creatorEmail: user?.email,
          creatorName: user?.name,
          creatorAvatar: user?.avatar,
        },
      });

      onOpenChange(false);
      setTeamName("");
      toast.success(`Room "${name}" created!`);
      navigate({ to: "/rooms/$roomId", params: { roomId: id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create room. Is the database connected?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTeamName("");
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create team room</DialogTitle>
          <DialogDescription>
            Everything below is pre-filled from the hackathon. Just name your team and you're in.
          </DialogDescription>
        </DialogHeader>

        {/* Hackathon preview card */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
          <div className="relative h-28 overflow-hidden">
            <img
              src={hackathon.banner}
              alt={hackathon.name}
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-xs text-zinc-400">{hackathon.organizer}</p>
              <p className="text-sm font-semibold text-white leading-tight">{hackathon.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border/40 border-t border-border/40">
            {[
              { icon: Trophy, label: "Prize", value: hackathon.prizePool, color: "text-yellow-400" },
              { icon: MapPin, label: "Mode", value: hackathon.mode, color: "text-blue-400" },
              { icon: CalendarDays, label: "Reg. closes", value: formatDate(hackathon.registrationDeadline), color: "text-orange-400" },
              { icon: Users, label: "Team size", value: `${hackathon.teamSize.min}–${hackathon.teamSize.max}`, color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-card/40 px-3 py-2.5">
                <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {hackathon.tags.slice(0, 5).map((tag) => (
            <Badge key={tag} className="bg-primary/10 text-primary border-none text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Only thing user needs to fill */}
        <div className="space-y-2">
          <Label htmlFor="team-name" className="text-sm font-medium">
            Team name <span className="text-muted-foreground font-normal">(the only thing we need)</span>
          </Label>
          <Input
            id="team-name"
            placeholder="Team Nebula"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            {loading ? "Creating…" : "Create room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
