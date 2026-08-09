import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sparkles,
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
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { submitHostHackathonRequest, sendContactMessage } from "@/lib/hackathons-api";
import { toast } from "sonner";

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
      const res = await submitHostHackathonRequest({
        name: hostForm.name.trim(),
        organizer: hostForm.organizer.trim(),
        contactEmail: hostForm.contactEmail.trim(),
        banner: hostForm.banner.trim() || "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
        prizePool: hostForm.prizePool.trim() || "TBD",
        prizePoolUSD: Number(hostForm.prizePoolUSD) || 0,
        mode: hostForm.mode,
        level: hostForm.level,
        registrationDeadline: hostForm.registrationDeadline,
        submissionDeadline: hostForm.submissionDeadline,
        resultDate: hostForm.resultDate,
        teamSize: { min: Number(hostForm.teamMin) || 1, max: Number(hostForm.teamMax) || 4 },
        tags: hostForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
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
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
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
            <a href="mailto:support@hackord.com" className="text-xs text-primary font-medium hover:underline">
              support@hackord.com
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hName" className="text-xs font-semibold">Hackathon Title *</Label>
                  <Input
                    id="hName"
                    placeholder="e.g. Global AI Innovators Hackathon"
                    value={hostForm.name}
                    onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hOrganizer" className="text-xs font-semibold">Organizer / Organization *</Label>
                  <Input
                    id="hOrganizer"
                    placeholder="e.g. Acme Tech Club / DevCorp"
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
                    placeholder="₹2 Lakhs & Certificates"
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
                    <Send className="mr-2 h-4 w-4" /> Submit Hackathon for Approval
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
