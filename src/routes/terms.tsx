import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileText, ShieldAlert, ArrowLeft, CheckCircle2, UserCheck, Code2, Scale, Mail } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Hackord" },
      {
        name: "description",
        content: "Terms of Service for Hackord developer collaboration and hackathon workspace platform.",
      },
    ],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
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
            <FileText className="h-3.5 w-3.5" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl">
            These Terms of Service govern your access to and use of the <strong className="text-foreground font-semibold">Hackord</strong> platform, software, virtual rooms, and services.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Last Updated: <span className="font-medium text-foreground">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12 backdrop-blur-2xl">
        {/* Section 1: Acceptance of Terms */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms & Eligibility</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By creating an account, accessing, or using <strong className="text-foreground">Hackord</strong> (accessible at <code className="rounded bg-muted px-1.5 py-0.5 text-foreground text-xs">https://hackord.vercel.app</code>), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You must be at least 13 years of age (or the minimum legal age in your jurisdiction) to use Hackord. If you are entering into these terms on behalf of an entity or hackathon organization, you represent that you have authority to bind that entity.
          </p>
        </section>

        {/* Section 2: Account Registration & OAuth Security */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">2. User Accounts & Security</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hackord allows account registration directly or through third-party authentication services including <strong className="text-foreground">Google OAuth</strong> and <strong className="text-foreground">GitHub OAuth</strong>.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>You are responsible for maintaining the confidentiality of your account credentials and OAuth access permissions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>You agree to notify Hackord immediately of any unauthorized access or breach of account security.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Hackord reserves the right to suspend or terminate accounts that provide false identification or violate safety guidelines.</span>
            </li>
          </ul>
        </section>

        {/* Section 3: Project Ownership & Intellectual Property */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Code2 className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">3. Intellectual Property & Code Rights</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Users retain 100% ownership</strong> of all software code, project ideas, repositories, pitch materials, and documentation created or shared within Hackord workspaces.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hackord does not claim any intellectual property rights over user-created hackathon projects. By sharing content in public rooms, you grant fellow room members the permission level specified by your project settings.
          </p>
        </section>

        {/* Section 4: Acceptable Use Policy */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Scale className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use Policy</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When using Hackord's real-time rooms, chat features, and video calls, you agree NOT to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-2">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Upload or transmit malware, viruses, or malicious scripts.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Harass, abuse, or discriminate against other hackathon participants or team members.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Attempt to bypass authentication mechanisms or disrupt platform infrastructure.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Use automated bots to spam public rooms or scrape platform user data.</span>
            </li>
          </ul>
        </section>

        {/* Section 5: Disclaimers & Limitation of Liability */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">5. Service Availability & Limitations</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hackord is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive to maintain high availability for hackathon events, we do not guarantee uninterrupted operation or zero latency in real-time video/audio channels.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Hackord shall not be liable for any indirect, incidental, or consequential damages resulting from platform downtime or third-party service outages (such as Agora RTC or GitHub API downtime).
          </p>
        </section>

        {/* Section 6: Contact Us */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Mail className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">6. Questions & Legal Contact</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions regarding these Terms of Service or need legal inquiries addressed, please contact our team at:
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 border border-border text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>hackord.support@gmail.com</span>
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
            <Link to="/terms" className="font-semibold text-foreground">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <a href="#" className="termly-display-preferences hover:text-foreground transition-colors">Consent Preferences</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
