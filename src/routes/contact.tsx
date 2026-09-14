import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Send,
  Mail,
  Building2,
  Calendar,
  Trophy,
  Users,
  Globe,
  Tag,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  Loader2,
  MapPin,
  LifeBuoy,
  MessageCircle,
  Code2,
  Zap,
  Clock,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { submitHostHackathonRequest, sendContactMessage } from "@/lib/hackathons-api";
import { toast } from "sonner";
import {
  DEFAULT_MINI_HACKATHON_SCHEDULE,
  DEFAULT_MINI_HACKATHON_CHECKLIST,
  SINGLE_MINI_HACKATHON_PRESET,
} from "@/lib/mini-hackathon-presets";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Hackord" },
      {
        name: "description",
        content:
          "Get in touch with the Hackord support team, submit feedback, or host your hackathon on Hackord's global Explore platform.",
      },
    ],
  }),
  pendingComponent: ContactSkeleton,
  component: ContactPage,
});

function ContactPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in or sign up to access the Contact Us page");
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  // General Contact Form State
  const [generalSubmitting, setGeneralSubmitting] = useState(false);
  const [generalForm, setGeneralForm] = useState({
    name: "",
    email: "",
    category: "General Query",
    subject: "",
    message: "",
  });

  // Host Hackathon Form State
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [hostSubmitted, setHostSubmitted] = useState(false);
  const [hostForm, setHostForm] = useState({
    name: "",
    organizer: "",
    contactEmail: "",
    banner: "",
    prizePool: "₹1 Lakh Cash & Prizes",
    prizePoolUSD: "1200",
    hackathonType: "Hackathon" as "Hackathon" | "Mini Hackathon",
    duration: "6 hours",
    venue: "DevHub Tech Park, Bengaluru",
    schedule: DEFAULT_MINI_HACKATHON_SCHEDULE,
    submissionChecklist: DEFAULT_MINI_HACKATHON_CHECKLIST,
    mode: "Online" as "Online" | "Offline" | "Hybrid",
    level: "National" as "State" | "National" | "Global",
    registrationDeadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    submissionDeadline: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0],
    resultDate: new Date(Date.now() + 32 * 86400000).toISOString().split("T")[0],
    teamMin: "1",
    teamMax: "4",
    tags: "AI, Web3, Open-Source",
    platform: "Community Host",
    platformUrl: "",
    description: "",
  });

  // Load single demo preset for 1-day sprint hosting
  const loadSingleHostPreset = () => {
    const preset = SINGLE_MINI_HACKATHON_PRESET;
    const todayStr = new Date().toISOString().split("T")[0];
    setHostForm((prev) => ({
      ...prev,
      hackathonType: "Mini Hackathon",
      name: preset.name,
      organizer: prev.organizer || preset.organizer,
      duration: preset.duration,
      venue: preset.venue,
      mode: preset.mode,
      schedule: preset.schedule,
      submissionChecklist: preset.submissionChecklist.join("\n"),
      registrationDeadline: todayStr,
      submissionDeadline: todayStr,
      resultDate: todayStr,
      tags: preset.tags.join(", "),
      prizePool: preset.prizePool,
      prizePoolUSD: String(preset.prizePoolUSD),
      description: preset.description,
    }));
  };

  // Auto fill user details when user is loaded
  useEffect(() => {
    if (user) {
      setGeneralForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
      setHostForm((prev) => ({
        ...prev,
        contactEmail: user.email || "",
        organizer: user.name || "",
      }));
    }
  }, [user]);

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalForm.name.trim() || !generalForm.email.trim() || !generalForm.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setGeneralSubmitting(true);
    try {
      const res = await sendContactMessage({
        name: generalForm.name.trim(),
        email: generalForm.email.trim(),
        category: generalForm.category,
        subject: generalForm.subject.trim(),
        message: generalForm.message.trim(),
      });
      toast.success(res.message || "Thank you! Your message has been received by the Hackord team.");
      setGeneralForm({
        name: user?.name || "",
        email: user?.email || "",
        category: "General Query",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send contact message");
    } finally {
      setGeneralSubmitting(false);
    }
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hostForm.name.trim() || !hostForm.organizer.trim() || !hostForm.contactEmail.trim() || !hostForm.description.trim()) {
      toast.error("Please fill in all required fields (Name, Organizer, Email, Description)");
      return;
    }

    setHostSubmitting(true);
    try {
      const rawTags = hostForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (hostForm.hackathonType === "Mini Hackathon") {
        if (!rawTags.includes("Mini Hackathon")) rawTags.unshift("Mini Hackathon");
        if (!rawTags.includes("1-Day Hackathon")) rawTags.splice(1, 0, "1-Day Hackathon");
      }

      const res = await submitHostHackathonRequest({
        name: hostForm.name.trim(),
        organizer: hostForm.organizer.trim(),
        contactEmail: hostForm.contactEmail.trim(),
        banner: hostForm.banner.trim() || "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
        prizePool: hostForm.prizePool.trim() || "TBD",
        prizePoolUSD: Number(hostForm.prizePoolUSD) || 0,
        mode: hostForm.mode,
        level: hostForm.level,
        hackathonType: hostForm.hackathonType,
        duration: hostForm.hackathonType === "Mini Hackathon" ? hostForm.duration : "",
        venue: hostForm.hackathonType === "Mini Hackathon" ? hostForm.venue : "",
        schedule: hostForm.hackathonType === "Mini Hackathon" ? hostForm.schedule : "",
        submissionChecklist: hostForm.hackathonType === "Mini Hackathon"
          ? hostForm.submissionChecklist.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        registrationDeadline: hostForm.registrationDeadline,
        submissionDeadline: hostForm.submissionDeadline,
        resultDate: hostForm.resultDate,
        teamSize: { min: Number(hostForm.teamMin) || 1, max: Number(hostForm.teamMax) || 4 },
        tags: rawTags,
        platform: hostForm.platform.trim() || "Community Host",
        platformUrl: hostForm.platformUrl.trim(),
        description: hostForm.description.trim(),
      });

      toast.success(res.message || "Hackathon submitted! Admin review pending.");
      setHostSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit hackathon request");
    } finally {
      setHostSubmitting(false);
    }
  };

  if (authLoading) {
    return <ContactSkeleton />;
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-12 py-4">
        {/* ─── CONTACT US HERO SECTION ─── */}
        <section className="glass-strong rounded-3xl p-8 sm:p-12 shadow-card text-center relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs text-primary border border-primary/20">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Hackord Support & Community Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Contact <span className="text-gradient-brand">Us</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Have a question, feedback, feature request, or technical query? We're here to help. Reach out to the Hackord core team directly or submit your hackathon to feature it on our global Explore platform.
            </p>
          </div>
        </section>

        {/* ─── CONTACT INFO CARDS GRID ─── */}
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="glass rounded-2xl p-6 shadow-card space-y-3 flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">Email Support</h3>
            <p className="text-xs text-muted-foreground">
              Direct line to our technical support team for account & platform help.
            </p>
            <a href="mailto:hackord.support@gmail.com" className="text-xs text-primary font-medium hover:underline">
              hackord.support@gmail.com
            </a>
          </div>

          <div className="glass rounded-2xl p-6 shadow-card space-y-3 flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-400">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">Developer Community</h3>
            <p className="text-xs text-muted-foreground">
              Connect with thousands of builders, teammates, and hackathon organizers.
            </p>
            <span className="text-xs text-purple-400 font-medium">Discord & GitHub Community</span>
          </div>

          <div className="glass rounded-2xl p-6 shadow-card space-y-3 flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">Host Hackathons</h3>
            <p className="text-xs text-muted-foreground">
              Feature your competition on Hackord and give participants live room tools.
            </p>
            <a href="#host-section" className="text-xs text-emerald-400 font-medium hover:underline">
              Submit Hackathon Form ↓
            </a>
          </div>
        </section>

        {/* ─── GENERAL CONTACT FORM & FAQ GRID ─── */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* General Contact Form */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 sm:p-8 shadow-card border border-border/60">
              <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-primary" /> Send Us a Message
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Fill in the form below to contact the Hackord support team.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gName" className="text-xs font-semibold">Your Name *</Label>
                    <Input
                      id="gName"
                      placeholder="Safal Tiwari"
                      value={generalForm.name}
                      onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gEmail" className="text-xs font-semibold">Your Email *</Label>
                    <Input
                      id="gEmail"
                      type="email"
                      placeholder="safal@example.com"
                      value={generalForm.email}
                      onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Inquiry Category</Label>
                    <Select
                      value={generalForm.category}
                      onValueChange={(val) => setGeneralForm({ ...generalForm, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Query">General Query</SelectItem>
                        <SelectItem value="Bug Report">Bug Report</SelectItem>
                        <SelectItem value="Feature Request">Feature Request</SelectItem>
                        <SelectItem value="Partnership / Hosting">Partnership / Hosting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gSubject" className="text-xs font-semibold">Subject</Label>
                    <Input
                      id="gSubject"
                      placeholder="e.g. Question about Room Video Calling"
                      value={generalForm.subject}
                      onChange={(e) => setGeneralForm({ ...generalForm, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gMessage" className="text-xs font-semibold">Message *</Label>
                  <Textarea
                    id="gMessage"
                    rows={4}
                    placeholder="Write your message or inquiry here..."
                    value={generalForm.message}
                    onChange={(e) => setGeneralForm({ ...generalForm, message: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={generalSubmitting}
                  className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90 font-semibold py-2.5"
                >
                  {generalSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Contact Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* FAQ Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-2xl p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
              </h2>

              <div className="space-y-4 text-xs text-muted-foreground">
                <div className="border-b border-border/40 pb-3">
                  <p className="font-semibold text-foreground mb-1">What is Hackord?</p>
                  <p>Hackord is a collaborative workspace platform for developers to discover hackathons, join rooms, and build projects together.</p>
                </div>

                <div className="border-b border-border/40 pb-3">
                  <p className="font-semibold text-foreground mb-1">How can I host my hackathon?</p>
                  <p>Use the "Host Your Hackathon" section on this page below. Our admins will review and feature it on the Explore page.</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1">Is Hackord free to use?</p>
                  <p>Yes! Hackord workspaces, real-time video/audio rooms, and hackathon registry access are 100% free for all developers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── DEDICATED SECTION: HOST YOUR HACKATHON ─── */}
        <section id="host-section" className="glass rounded-3xl p-6 sm:p-10 shadow-card border border-emerald-500/30 space-y-8 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-emerald-400" />
                <h2 className="text-2xl font-bold">Host Your Hackathon on Hackord</h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                  Feature on Explore Page
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Are you organizing a hackathon? Reach thousands of active developers. Fill in your event details below to submit your hackathon for Admin review.
              </p>
            </div>
          </div>

          {hostSubmitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold">Hackathon Request Submitted!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Thank you! Your hackathon hosting request has been sent to our admin team for review. Upon approval, it will automatically appear live on the Explore page.
              </p>
              <Button
                onClick={() => {
                  setHostSubmitted(false);
                  setHostForm({
                    name: "",
                    organizer: user?.name || "",
                    contactEmail: user?.email || "",
                    banner: "",
                    prizePool: "₹1 Lakh Cash & Prizes",
                    prizePoolUSD: "1200",
                    hackathonType: "Hackathon",
                    duration: "6 hours",
                    venue: "DevHub Tech Park, Bengaluru",
                    schedule: DEFAULT_MINI_HACKATHON_SCHEDULE,
                    submissionChecklist: DEFAULT_MINI_HACKATHON_CHECKLIST,
                    mode: "Online",
                    level: "National",
                    registrationDeadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                    submissionDeadline: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0],
                    resultDate: new Date(Date.now() + 32 * 86400000).toISOString().split("T")[0],
                    teamMin: "1",
                    teamMax: "4",
                    tags: "AI, Web3, Open-Source",
                    platform: "Community Host",
                    platformUrl: "",
                    description: "",
                  });
                }}
                variant="outline"
                className="mt-4"
              >
                Submit Another Hackathon
              </Button>
            </div>
          ) : (
            <form onSubmit={handleHostSubmit} className="space-y-6">
              {/* ─── EVENT FORMAT DROPDOWN ─── */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <Trophy className="h-4 w-4" />
                    Hackathon Hosting Format *
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Select &quot;Mini Hackathon&quot; for 1-day sprint events with live schedule &amp; checklist
                  </span>
                </div>
                <Select
                  value={hostForm.hackathonType}
                  onValueChange={(val: "Hackathon" | "Mini Hackathon") => {
                    if (val === "Mini Hackathon") {
                      loadSingleHostPreset();
                    } else {
                      setHostForm((prev) => ({
                        ...prev,
                        hackathonType: val,
                        registrationDeadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                        submissionDeadline: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0],
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-background font-medium">
                    <SelectValue placeholder="Select Event Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hackathon">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span>Hackathon (Standard Multi-Day / Multi-Week Event)</span>
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
                <div className="space-y-2">
                  <Label htmlFor="hName" className="text-xs font-semibold">
                    {hostForm.hackathonType === "Mini Hackathon" ? "Mini Hackathon Title *" : "Hackathon Title *"}
                  </Label>
                  <Input
                    id="hName"
                    placeholder={
                      hostForm.hackathonType === "Mini Hackathon"
                        ? "e.g. AI Agents Flash Sprint 2026"
                        : "e.g. Global AI Innovators Hackathon"
                    }
                    value={hostForm.name}
                    onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hOrganizer" className="text-xs font-semibold">Organizer / Organization *</Label>
                  <Input
                    id="hOrganizer"
                    placeholder="e.g. Antigravity AI Collective / Tech Club"
                    value={hostForm.organizer}
                    onChange={(e) => setHostForm({ ...hostForm, organizer: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hContactEmail" className="text-xs font-semibold">Contact Email *</Label>
                  <Input
                    id="hContactEmail"
                    type="email"
                    placeholder="organizer@domain.com"
                    value={hostForm.contactEmail}
                    onChange={(e) => setHostForm({ ...hostForm, contactEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hBanner" className="text-xs font-semibold">Banner Image URL</Label>
                  <Input
                    id="hBanner"
                    placeholder="https://images.unsplash.com/..."
                    value={hostForm.banner}
                    onChange={(e) => setHostForm({ ...hostForm, banner: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="hPrizePool" className="text-xs font-semibold">Prize Pool Text</Label>
                  <Input
                    id="hPrizePool"
                    placeholder={hostForm.hackathonType === "Mini Hackathon" ? "₹50,000 + Swags" : "₹2 Lakhs & Certificates"}
                    value={hostForm.prizePool}
                    onChange={(e) => setHostForm({ ...hostForm, prizePool: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Event Mode</Label>
                  <Select
                    value={hostForm.mode}
                    onValueChange={(val: any) => setHostForm({ ...hostForm, mode: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Event Level</Label>
                  <Select
                    value={hostForm.level}
                    onValueChange={(val: any) => setHostForm({ ...hostForm, level: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="State">State</SelectItem>
                      <SelectItem value="National">National</SelectItem>
                      <SelectItem value="Global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ─── DEDICATED MINI HACKATHON FIELDS (When Mini Hackathon Selected) ─── */}
              {hostForm.hackathonType === "Mini Hackathon" ? (
                <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                    <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>1-Day Mini Hackathon Details (Rapid Sprint)</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Single-Day Event
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hEventDate" className="text-xs font-semibold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Event Date (1-Day) *
                      </Label>
                      <Input
                        id="hEventDate"
                        type="date"
                        value={hostForm.submissionDeadline}
                        onChange={(e) =>
                          setHostForm({
                            ...hostForm,
                            registrationDeadline: e.target.value,
                            submissionDeadline: e.target.value,
                            resultDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hDuration" className="text-xs font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Duration *
                      </Label>
                      <Input
                        id="hDuration"
                        placeholder="e.g. 6 hours"
                        value={hostForm.duration}
                        onChange={(e) => setHostForm({ ...hostForm, duration: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hVenue" className="text-xs font-semibold flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Venue / Physical Location (or Online Link)
                    </Label>
                    <Input
                      id="hVenue"
                      placeholder="e.g. DevHub Tech Park, Bengaluru (or Online Discord)"
                      value={hostForm.venue}
                      onChange={(e) => setHostForm({ ...hostForm, venue: e.target.value })}
                    />
                  </div>

                  {/* Schedule Editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hSchedule" className="text-xs font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        1-Day Schedule
                      </Label>
                      <button
                        type="button"
                        onClick={() => setHostForm({ ...hostForm, schedule: DEFAULT_MINI_HACKATHON_SCHEDULE })}
                        className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Reset Sprint Schedule
                      </button>
                    </div>
                    <Textarea
                      id="hSchedule"
                      rows={6}
                      value={hostForm.schedule}
                      onChange={(e) => setHostForm({ ...hostForm, schedule: e.target.value })}
                      placeholder="09:00 AM – 09:30 AM | Check-in..."
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Submission Checklist */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hChecklist" className="text-xs font-semibold flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                        Submission Checklist
                      </Label>
                      <button
                        type="button"
                        onClick={() => setHostForm({ ...hostForm, submissionChecklist: DEFAULT_MINI_HACKATHON_CHECKLIST })}
                        className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Reset Sprint Checklist
                      </button>
                    </div>
                    <Textarea
                      id="hChecklist"
                      rows={5}
                      value={hostForm.submissionChecklist}
                      onChange={(e) => setHostForm({ ...hostForm, submissionChecklist: e.target.value })}
                      placeholder="1. Project name&#10;2. Problem statement..."
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ) : (
                /* ─── STANDARD MULTI-DAY DEADLINES ─── */
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hRegDate" className="text-xs font-semibold">Registration Deadline *</Label>
                    <Input
                      id="hRegDate"
                      type="date"
                      value={hostForm.registrationDeadline}
                      onChange={(e) => setHostForm({ ...hostForm, registrationDeadline: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hSubDate" className="text-xs font-semibold">Submission Deadline *</Label>
                    <Input
                      id="hSubDate"
                      type="date"
                      value={hostForm.submissionDeadline}
                      onChange={(e) => setHostForm({ ...hostForm, submissionDeadline: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hPlatformUrl" className="text-xs font-semibold">Platform / Event URL</Label>
                  <Input
                    id="hPlatformUrl"
                    placeholder="https://myhackathon.com"
                    value={hostForm.platformUrl}
                    onChange={(e) => setHostForm({ ...hostForm, platformUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hTags" className="text-xs font-semibold">Tags (comma separated)</Label>
                  <Input
                    id="hTags"
                    placeholder="AI, Web3, Beginner"
                    value={hostForm.tags}
                    onChange={(e) => setHostForm({ ...hostForm, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hDesc" className="text-xs font-semibold">Description & Details *</Label>
                <Textarea
                  id="hDesc"
                  rows={4}
                  placeholder="Describe your hackathon themes, tracks, prize structure, and submission guidelines..."
                  value={hostForm.description}
                  onChange={(e) => setHostForm({ ...hostForm, description: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={hostSubmitting}
                className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90 font-semibold py-3"
              >
                {hostSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Hackathon...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />{" "}
                    {hostForm.hackathonType === "Mini Hackathon"
                      ? "Submit Mini Hackathon for Approval"
                      : "Submit Hackathon for Approval"}
                  </>
                )}
              </Button>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export function ContactSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-12 py-4 animate-pulse">
        {/* Hero Section Skeleton */}
        <div className="glass-strong rounded-3xl p-8 sm:p-12 shadow-card text-center relative overflow-hidden space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-center">
            <Skeleton className="h-7 w-64 rounded-full" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-10 sm:h-12 w-72 sm:w-96 rounded-xl" />
          </div>
          <div className="space-y-2 max-w-2xl mx-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5 mx-auto" />
          </div>
        </div>

        {/* 3 Contact Info Cards Skeleton */}
        <div className="grid gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 shadow-card space-y-3 flex flex-col items-center text-center">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
          ))}
        </div>

        {/* Contact Message Form Skeleton */}
        <div className="glass rounded-3xl p-6 sm:p-10 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-56 rounded-md" />
              <Skeleton className="h-4 w-80 rounded-md" />
            </div>
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        {/* Host Hackathon Section Skeleton */}
        <div className="glass rounded-3xl p-6 sm:p-10 shadow-card space-y-6">
          <div className="space-y-2 border-b border-border pb-6">
            <Skeleton className="h-6 w-64 rounded-md" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}

