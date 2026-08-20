import { useState } from "react";
import {
  Calendar,
  CalendarPlus,
  ExternalLink,
  Download,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDateWord } from "@/lib/date-utils";
import {
  getRoomGoogleCalendarUrl,
  getMilestoneGoogleCalendarUrl,
  downloadRoomIcsFile,
} from "@/lib/calendar-utils";
import type { DbRoom } from "@/lib/rooms-api";
import { cn } from "@/lib/utils";

interface AddToCalendarMenuProps {
  room: DbRoom;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function GoogleCalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4H19ZM19 20H5V9H19V20ZM19 7H5V6H19V7Z"
        fill="currentColor"
      />
      <rect x="7" y="11" width="3" height="3" rx="0.5" fill="#4285F4" />
      <rect x="11" y="11" width="3" height="3" rx="0.5" fill="#EA4335" />
      <rect x="15" y="11" width="3" height="3" rx="0.5" fill="#FBBC04" />
      <rect x="7" y="15" width="3" height="3" rx="0.5" fill="#34A853" />
      <rect x="11" y="15" width="3" height="3" rx="0.5" fill="#4285F4" />
      <rect x="15" y="15" width="3" height="3" rx="0.5" fill="#EA4335" />
    </svg>
  );
}

export function AddToCalendarMenu({
  room,
  variant = "outline",
  size = "sm",
  className,
  showText = true,
}: AddToCalendarMenuProps) {
  const [open, setOpen] = useState(false);

  const rawMilestones = [
    { key: "Registration", label: "Registration Deadline", dateStr: room.deadline_registration },
    { key: "PPT", label: "PPT Submission", dateStr: room.deadline_ppt },
    { key: "Prototype", label: "Prototype Submission", dateStr: room.deadline_prototype },
    { key: "Final", label: "Final Submission", dateStr: room.deadline_final },
    { key: "Result", label: "Result Declaration", dateStr: room.deadline_result },
  ];

  const availableMilestones = rawMilestones.filter((m) => Boolean(m.dateStr));

  const handleAddFullSchedule = () => {
    const url = getRoomGoogleCalendarUrl(room);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening Google Calendar in a new tab...", {
      description: `Auto-filling schedule for ${room.hackathon}`,
      icon: <CalendarCheck className="h-4 w-4 text-emerald-500" />,
    });
    setOpen(false);
  };

  const handleAddMilestone = (label: string, dateStr: string) => {
    const url = getMilestoneGoogleCalendarUrl(room, label, dateStr);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opening Google Calendar for ${label}...`, {
      description: `Due date: ${formatDateWord(dateStr)}`,
      icon: <CalendarCheck className="h-4 w-4 text-emerald-500" />,
    });
    setOpen(false);
  };

  const handleDownloadIcs = () => {
    try {
      downloadRoomIcsFile(room);
      toast.success("Downloaded calendar (.ics) file", {
        description: "You can import it into Google Calendar, Apple Calendar, or Outlook.",
      });
      setOpen(false);
    } catch {
      toast.error("Failed to generate calendar file");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "gap-1.5 h-8 font-medium transition-all duration-200 border-border/80 hover:border-primary/50 hover:bg-primary/5 text-foreground hover:text-primary",
            className
          )}
          title="Add hackathon deadlines to Google Calendar"
        >
          <CalendarPlus className="h-3.5 w-3.5 text-primary" />
         
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 p-1.5 shadow-2xl border-border/80 bg-background/95 backdrop-blur-xl animate-in fade-in-50 zoom-in-95"
      >
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <GoogleCalendarIcon className="h-4 w-4" />
              Google Calendar Sync
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              Auto Fill
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {room.hackathon || "Hackathon Schedule"}
          </p>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleAddFullSchedule}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors focus:bg-primary/10 group"
          >
            <div className="mt-0.5 p-1 rounded-md bg-primary/15 text-primary group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Add Full Hackathon Event</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Complete timeline & all milestones in one event
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {availableMilestones.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Add Specific Milestones
            </DropdownMenuLabel>
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
              {availableMilestones.map((m) => (
                <DropdownMenuItem
                  key={m.key}
                  onClick={() => handleAddMilestone(m.label, m.dateStr)}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-md cursor-pointer text-xs focus:bg-accent group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <span className="truncate font-medium">{m.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 pl-2">
                    {formatDateWord(m.dateStr, { includeYear: false })}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={handleDownloadIcs}
          className="flex items-center gap-2 py-1.5 px-2.5 rounded-md cursor-pointer text-xs text-muted-foreground hover:text-foreground focus:bg-accent"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Download .ICS (All Calendars)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
