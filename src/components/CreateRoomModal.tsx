import { useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Clock,
  MapPin,
  ListChecks,
  Calendar,
  Sparkles,
  Trophy,
} from "lucide-react";
import { createRoom } from "@/lib/rooms-api";
import { useAuth } from "@/lib/auth";

export interface RoomPrefill {
  hackathon?: string;
  name?: string;
  description?: string;
  maxSize?: number;
  hackathonType?: "Hackathon" | "Mini Hackathon";
  duration?: string;
  venue?: string;
  schedule?: string;
  submissionChecklist?: string[];
  deadlineRegistration?: string;
  deadlinePpt?: string;
  deadlinePrototype?: string;
  deadlineFinal?: string;
  deadlineResult?: string;
}

import {
  DEFAULT_MINI_HACKATHON_SCHEDULE,
  DEFAULT_MINI_HACKATHON_CHECKLIST,
  SINGLE_MINI_HACKATHON_PRESET,
} from "@/lib/mini-hackathon-presets";

export function CreateRoomModal({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill?: RoomPrefill;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [hackathonType, setHackathonType] = useState<"Hackathon" | "Mini Hackathon">(
    prefill?.hackathonType || "Hackathon"
  );
  const [hackathonName, setHackathonName] = useState(prefill?.hackathon || "");
  const [roomName, setRoomName] = useState(prefill?.name || "");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState(prefill?.description || "");
  const [duration, setDuration] = useState(prefill?.duration || "6 hours");
  const [venue, setVenue] = useState(prefill?.venue || "Online (Discord Stage & Zoom)");
  const [eventDate, setEventDate] = useState(prefill?.deadlineFinal || todayStr);
  const [schedule, setSchedule] = useState(prefill?.schedule || DEFAULT_MINI_HACKATHON_SCHEDULE);
  const [checklist, setChecklist] = useState(
    prefill?.submissionChecklist ? prefill.submissionChecklist.join("\n") : DEFAULT_MINI_HACKATHON_CHECKLIST
  );

  // Standard deadlines
  const [deadlineReg, setDeadlineReg] = useState(prefill?.deadlineRegistration || "");
  const [deadlinePpt, setDeadlinePpt] = useState(prefill?.deadlinePpt || "");
  const [deadlineProto, setDeadlineProto] = useState(prefill?.deadlinePrototype || "");
  const [deadlineFinal, setDeadlineFinal] = useState(prefill?.deadlineFinal || "");
  const [deadlineResult, setDeadlineResult] = useState(prefill?.deadlineResult || "");
  const [maxSize, setMaxSize] = useState<number>(prefill?.maxSize || 4);

  // Load single demo details for 1-day mini hackathon
  const loadSingleDemoDetails = () => {
    const preset = SINGLE_MINI_HACKATHON_PRESET;
    setHackathonName(preset.name);
    setRoomName(preset.roomName);
    setProblem(preset.problem);
    setDuration(preset.duration);
    setVenue(preset.venue);
    setSchedule(preset.schedule);
    setChecklist(preset.submissionChecklist.join("\n"));
    setDescription(preset.description);
    setEventDate(todayStr);
    setDeadlineReg(todayStr);
    setDeadlinePpt(todayStr);
    setDeadlineProto(todayStr);
    setDeadlineFinal(todayStr);
    setDeadlineResult(todayStr);
    setMaxSize(4);
  };

  // When prefill changes
  useEffect(() => {
    if (prefill) {
      if (prefill.hackathonType) setHackathonType(prefill.hackathonType);
      if (prefill.hackathon) setHackathonName(prefill.hackathon);
      if (prefill.name) setRoomName(prefill.name);
      if (prefill.description) setDescription(prefill.description);
      if (prefill.duration) setDuration(prefill.duration);
      if (prefill.venue) setVenue(prefill.venue);
      if (prefill.schedule) setSchedule(prefill.schedule);
      if (prefill.submissionChecklist) setChecklist(prefill.submissionChecklist.join("\n"));
      if (prefill.deadlineRegistration) setDeadlineReg(prefill.deadlineRegistration);
      if (prefill.deadlinePpt) setDeadlinePpt(prefill.deadlinePpt);
      if (prefill.deadlinePrototype) setDeadlineProto(prefill.deadlinePrototype);
      if (prefill.deadlineFinal) {
        setDeadlineFinal(prefill.deadlineFinal);
        setEventDate(prefill.deadlineFinal);
      }
      if (prefill.deadlineResult) setDeadlineResult(prefill.deadlineResult);
      if (prefill.maxSize) setMaxSize(prefill.maxSize);
    }
  }, [prefill]);

  // Handle Event Type switch: when clicking "Mini Hackathon", auto-fill single 1-day demo details
  const handleTypeChange = (newType: "Hackathon" | "Mini Hackathon") => {
    setHackathonType(newType);
    if (newType === "Mini Hackathon") {
      if (!hackathonName || hackathonName === "Smart India Hackathon 2026") {
        loadSingleDemoDetails();
      } else {
        if (!duration) setDuration(SINGLE_MINI_HACKATHON_PRESET.duration);
        if (!venue) setVenue(SINGLE_MINI_HACKATHON_PRESET.venue);
        if (!schedule) setSchedule(DEFAULT_MINI_HACKATHON_SCHEDULE);
        if (!checklist) setChecklist(DEFAULT_MINI_HACKATHON_CHECKLIST);
        setEventDate(todayStr);
        setDeadlineReg(todayStr);
        setDeadlinePpt(todayStr);
        setDeadlineProto(todayStr);
        setDeadlineFinal(todayStr);
        setDeadlineResult(todayStr);
        setMaxSize(4);
      }
    } else {
      // Switched back to standard hackathon
      if (hackathonName === SINGLE_MINI_HACKATHON_PRESET.name && !prefill?.hackathon) {
        setHackathonName("");
      }
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const finalHackathon = hackathonName.trim() || (fd.get("hackathon") as string);
    const finalName = roomName.trim() || (fd.get("name") as string);

    if (!finalHackathon || !finalName) {
      toast.error("Please provide both Hackathon name and Room name");
      return;
    }

    const githubUrl = (fd.get("githubUrl") as string)?.trim();
    const figmaUrl = (fd.get("figmaUrl") as string)?.trim();
    const demoUrl = (fd.get("demoUrl") as string)?.trim();
    const docsUrl = (fd.get("docsUrl") as string)?.trim();

    const projectLinks = [
      { label: "GitHub Repo", url: githubUrl },
      { label: "Figma", url: figmaUrl },
      { label: "Demo", url: demoUrl },
      { label: "Documentation", url: docsUrl },
    ].filter((l) => Boolean(l.url));

    // Generate a URL-safe ID from room name + timestamp
    const id =
      finalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) +
      "-" +
      Date.now().toString(36);

    const submissionChecklistArr = checklist
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await createRoom({
        data: {
          id,
          hackathon: finalHackathon,
          hackathonType,
          duration: hackathonType === "Mini Hackathon" ? duration : "",
          venue: hackathonType === "Mini Hackathon" ? venue : "",
          schedule: hackathonType === "Mini Hackathon" ? schedule : "",
          submissionChecklist: hackathonType === "Mini Hackathon" ? submissionChecklistArr : [],
          name: finalName,
          problem: problem.trim(),
          description: description.trim(),
          maxSize: Number(maxSize || 4),
          deadlineRegistration: hackathonType === "Mini Hackathon" ? eventDate : deadlineReg,
          deadlinePpt: hackathonType === "Mini Hackathon" ? eventDate : deadlinePpt,
          deadlinePrototype: hackathonType === "Mini Hackathon" ? eventDate : deadlineProto,
          deadlineFinal: hackathonType === "Mini Hackathon" ? eventDate : deadlineFinal,
          deadlineResult: hackathonType === "Mini Hackathon" ? eventDate : deadlineResult,
          projectLinks,
          creatorId: user?._id,
          creatorEmail: user?.email,
          creatorName: user?.name,
          creatorAvatar: user?.avatar,
        },
      });

      onOpenChange(false);
      toast.success(
        hackathonType === "Mini Hackathon"
          ? `Mini Hackathon room "${finalName}" created!`
          : `Room "${finalName}" created!`
      );
      navigate({ to: "/rooms/$roomId", params: { roomId: id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create room. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">Create a Room</DialogTitle>
            {hackathonType === "Mini Hackathon" ? (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                ⚡ 1-Day Mini Hackathon
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                🏆 Standard Hackathon
              </Badge>
            )}
          </div>
          <DialogDescription>
            Spin up a collaborative workspace tailored for your team and hackathon format.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} className="grid gap-4 py-2" onSubmit={handleSubmit}>
          {/* Format / Type Dropdown */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Hackathon Event Type *
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Selecting &quot;Mini Hackathon&quot; auto-populates 1-day schedule &amp; checklist
              </span>
            </div>
            <Select
              value={hackathonType}
              onValueChange={(val: "Hackathon" | "Mini Hackathon") => handleTypeChange(val)}
            >
              <SelectTrigger className="w-full bg-background font-medium">
                <SelectValue placeholder="Select Hackathon Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hackathon">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>Hackathon (Standard Multi-Day Event)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Mini Hackathon">
                  <div className="flex items-center gap-2 font-medium">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Mini Hackathon (1-Day Event / Rapid Sprint)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hackathon Name *">
              <Input
                name="hackathon"
                placeholder={
                  hackathonType === "Mini Hackathon"
                    ? "e.g. AI Agents Flash Sprint 2026"
                    : "Smart India Hackathon 2026"
                }
                required
                value={hackathonName}
                onChange={(e) => setHackathonName(e.target.value)}
              />
            </Field>
            <Field label="Room Name *">
              <Input
                name="name"
                placeholder={hackathonType === "Mini Hackathon" ? "e.g. Autonomous Agent Builders" : "Team Nebula"}
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Problem Statement">
            <Textarea
              name="problem"
              rows={2}
              placeholder="Briefly describe the problem statement your team is solving."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
          </Field>

          {/* ─── DEDICATED MINI HACKATHON SECTION (When Mini Hackathon Selected) ─── */}
          {hackathonType === "Mini Hackathon" ? (
            <div className="space-y-4 rounded-xl border border-border bg-card/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>1-Day Mini Hackathon Parameters</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Single-Day Execution
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Event Date (1-Day) *">
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field label="Event Duration *">
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="e.g. 6 hours"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field label="Team Size Limit">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={maxSize}
                    onChange={(e) => setMaxSize(Number(e.target.value))}
                  />
                </Field>
              </div>

              <Field label="Venue / Location">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="e.g. DevHub Tech Center / Online Discord Stage"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />
                </div>
              </Field>

              {/* 1-Day Schedule Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    1-Day Event Schedule
                  </Label>
                  <button
                    type="button"
                    onClick={() => setSchedule(DEFAULT_MINI_HACKATHON_SCHEDULE)}
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Reset Sprint Schedule
                  </button>
                </div>
                <Textarea
                  rows={5}
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="09:00 AM - Check-in..."
                  className="font-mono text-xs"
                />
              </div>

              {/* Submission Checklist */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                    Submission Checklist
                  </Label>
                  <button
                    type="button"
                    onClick={() => setChecklist(DEFAULT_MINI_HACKATHON_CHECKLIST)}
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Reset Sprint Checklist
                  </button>
                </div>
                <Textarea
                  rows={4}
                  value={checklist}
                  onChange={(e) => setChecklist(e.target.value)}
                  placeholder="1. Project name&#10;2. Problem statement..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
          ) : (
            /* ─── STANDARD HACKATHON DEADLINES (When Standard Hackathon Selected) ─── */
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Maximum Team Size">
                <Input
                  name="maxSize"
                  type="number"
                  min={1}
                  max={20}
                  value={maxSize}
                  onChange={(e) => setMaxSize(Number(e.target.value))}
                />
              </Field>
              <Field label="Registration Deadline">
                <Input
                  name="deadlineRegistration"
                  type="date"
                  value={deadlineReg}
                  onChange={(e) => setDeadlineReg(e.target.value)}
                />
              </Field>
              <Field label="PPT Submission">
                <Input
                  name="deadlinePpt"
                  type="date"
                  value={deadlinePpt}
                  onChange={(e) => setDeadlinePpt(e.target.value)}
                />
              </Field>
              <Field label="Prototype Submission">
                <Input
                  name="deadlinePrototype"
                  type="date"
                  value={deadlineProto}
                  onChange={(e) => setDeadlineProto(e.target.value)}
                />
              </Field>
              <Field label="Final Submission">
                <Input
                  name="deadlineFinal"
                  type="date"
                  value={deadlineFinal}
                  onChange={(e) => setDeadlineFinal(e.target.value)}
                />
              </Field>
              <Field label="Result Date">
                <Input
                  name="deadlineResult"
                  type="date"
                  value={deadlineResult}
                  onChange={(e) => setDeadlineResult(e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* Project Links Section */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <h4 className="text-sm font-semibold">Project Links (Optional)</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="GitHub Repo URL">
                <Input name="githubUrl" placeholder="https://github.com/org/repo" />
              </Field>
              <Field label="Figma Design URL">
                <Input name="figmaUrl" placeholder="https://figma.com/file/..." />
              </Field>
              <Field label="Live Demo URL">
                <Input name="demoUrl" placeholder="https://my-demo-app.com" />
              </Field>
              <Field label="Docs / Notion URL">
                <Input name="docsUrl" placeholder="https://notion.so/..." />
              </Field>
            </div>
          </div>

          <Field label="Room Description">
            <Textarea
              name="description"
              rows={3}
              placeholder="Anything else your team should know about the workspace."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
            >
              {hackathonType === "Mini Hackathon" ? "Create Mini Hackathon Room" : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}
