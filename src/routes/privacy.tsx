import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, ArrowLeft, Mail, Server } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Hackord" },
      {
        name: "description",
        content: "Privacy Policy for Hackord developer collaboration and hackathon workspace platform.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (saved) return saved;
    }
    return "dark";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const lastUpdated = "August 9, 2026";

  return (
    <div className="min-h-screen bg-background bg-mesh text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark:border-white/5 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <BrandLogo size="md" />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Link
              to="/signup"
              className="rounded-lg bg-gradient-brand px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-glow transition hover:opacity-90"
            >
              Open Hackord
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b border-white/10 dark:border-white/5 bg-muted/20 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-primary mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Transparency & Data Security</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl">
            This Privacy Policy outlines how <strong className="text-foreground font-semibold">Hackord</strong> collects, uses, protects, and handles your personal data when you use our collaborative workspace platform.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Last Updated: <span className="font-medium text-foreground">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12 backdrop-blur-2xl">
        {/* Section 1: Overview & Application Purpose */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">1. Application Purpose & Overview</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Hackord</strong> ("we", "our", or "us") is an intelligent, real-time developer workspace and collaboration platform designed for hackathon participants, software engineers, and project teams. Hackord enables users to discover hackathons, create collaborative project rooms, communicate via HD audio/video calls (powered by Agora), track tasks, manage team profiles, and integrate GitHub repositories.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We respect your privacy and are committed to protecting personal information collected through our website hosted at <code className="rounded bg-muted px-1.5 py-0.5 text-foreground text-xs">https://hackord.vercel.app</code> and associated service APIs.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Eye className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect information necessary to provide you with seamless collaboration tools and account management:
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Account Information:</strong> When you register directly, we collect your full name, email address, password hash, and optional profile bio or avatar URL.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span><strong className="text-foreground">OAuth Authentication Data (Google & GitHub):</strong> If you log in via Google OAuth or GitHub OAuth, we receive your name, primary email address, profile picture URL, and unique platform ID provided by the OAuth provider.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Workspace & Room Content:</strong> Room chat messages, task lists, code snippets, room participant state, and project metadata created within your Hackord workspaces.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Technical & Usage Data:</strong> Basic browser type, IP address (for socket connections & session security), theme preferences, and system notification preferences.</span>
            </li>
          </ul>
        </section>

        {/* Section 3: How We Use Your Data & Google OAuth Compliance */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4 border-l-4 border-primary">
          <div className="flex items-center gap-3 text-primary">
            <Lock className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">3. Google OAuth & User Data Policy</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hackord uses Google OAuth strictly for user authentication and account identification.
          </p>
          <div className="rounded-xl bg-card/80 p-4 border border-border space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Google API Limited Use Disclosure:</p>
            <p className="text-xs sm:text-sm leading-relaxed">
              Hackord's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pt-1">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>We <strong className="text-foreground">do not sell, rent, or trade</strong> your Google OAuth user data or personal information to third parties.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>We <strong className="text-foreground">do not use</strong> user data for advertising or targeted marketing purposes.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>We <strong className="text-foreground">do not train</strong> generalized artificial intelligence or machine learning models on your private Google profile data.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Data Storage, Third Parties & Security */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Server className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">4. Third-Party Integrations & Data Security</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To deliver essential real-time features, Hackord integrates with trusted service providers under strict security standards:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-border/80 p-4 bg-card/40">
              <h3 className="text-sm font-semibold text-foreground mb-1">Agora RTC</h3>
              <p className="text-xs text-muted-foreground">Powers encrypted real-time voice and video streams in project rooms. Audio/video streams are ephemeral and not recorded by Hackord.</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4 bg-card/40">
              <h3 className="text-sm font-semibold text-foreground mb-1">GitHub API</h3>
              <p className="text-xs text-muted-foreground">Allows room members to showcase repository stats, commits, and activity logs within their workspaces.</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4 bg-card/40">
              <h3 className="text-sm font-semibold text-foreground mb-1">EmailJS / Nodemailer</h3>
              <p className="text-xs text-muted-foreground">Used solely to send transactional emails, room invite alerts, and requested password notifications.</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4 bg-card/40">
              <h3 className="text-sm font-semibold text-foreground mb-1">TLS & Token Security</h3>
              <p className="text-xs text-muted-foreground">All client-server communications use HTTPS/TLS encryption. Authentication tokens are securely hashed and stored.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Data Rights & Account Deletion */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">5. Your Data Rights & Deletion</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You retain complete ownership over your account data. You have the right to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-2">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Access and export your profile and project data at any time.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Update or rectify your account settings from your user profile.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Permanently delete your account and associated database records directly via <Link to="/settings" className="text-primary underline">Settings → Danger Zone</Link> or by contacting support.</span>
            </li>
          </ul>
        </section>

        {/* Section 6: Contact Us */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Mail className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">6. Contact Information</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or Hackord's data practices, please reach out to us at:
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 border border-border text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>privacy@hackord.app</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 dark:border-white/5 bg-background/80 py-8 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span>© 2026 Hackord. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="font-semibold text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
