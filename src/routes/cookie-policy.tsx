import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Hackord" },
      {
        name: "description",
        content: "Cookie Policy for Hackord developer collaboration and hackathon workspace platform.",
      },
    ],
  }),
  component: CookiePolicyPage,
});

// ─── Shared sub-components ───────────────────────────────────────────────────

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4 scroll-mt-24">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5 pl-4 list-disc marker:text-primary">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity break-all">
      {children}
    </a>
  );
}

interface CookieTableProps {
  name: string;
  purpose?: string;
  provider: string;
  service?: string;
  serviceUrl?: string;
  type: string;
  expires: string;
}

function CookieTable({ name, purpose, provider, service, serviceUrl, type, expires }: CookieTableProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden text-xs">
      <div className="grid grid-cols-[auto_1fr] divide-y divide-border/40">
        <Row label="Name" value={<code className="text-foreground font-mono">{name}</code>} />
        {purpose && <Row label="Purpose" value={purpose} />}
        <Row label="Provider" value={provider} />
        {service && <Row label="Service" value={serviceUrl ? <ExternalLink href={serviceUrl}>{service}</ExternalLink> : service} />}
        <Row label="Type" value={<span className="capitalize">{type.replace(/_/g, " ")}</span>} />
        <Row label="Expires" value={expires} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <div className="px-4 py-2.5 font-medium text-foreground bg-muted/30 flex items-center min-w-[90px]">{label}</div>
      <div className="px-4 py-2.5 text-muted-foreground break-all flex items-center">{value}</div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function CookiePolicyPage() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark:border-white/5 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <BrandLogo size="md" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Link to="/signup" className="rounded-lg bg-gradient-brand px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-glow transition hover:opacity-90">
              Open Hackord
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-white/10 dark:border-white/5 bg-muted/20 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-primary mb-4">
            <span>🍪</span>
            <span>Cookie Usage &amp; Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">Cookie Policy</h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl">
            This Cookie Policy explains how <strong className="text-foreground">Hackord</strong> uses cookies and similar tracking technologies when you visit our platform, and how you can control them.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Last Updated: <span className="font-medium text-foreground">August 9, 2026</span>
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-6">

        {/* Intro */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8 text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            This Cookie Policy explains how <strong className="text-foreground">Hackord</strong> ("Company," "we," "us," and "our") uses cookies and similar technologies to recognize you when you visit our website at{" "}
            <ExternalLink href="https://hackord.vercel.app">https://hackord.vercel.app</ExternalLink> ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>
          <p>In some cases we may use cookies to collect personal information, or that becomes personal information if we combine it with other information.</p>
        </div>

        {/* What are cookies */}
        <Section title="What Are Cookies?">
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, <strong className="text-foreground">Hackord</strong>) are called <strong className="text-foreground">"first-party cookies."</strong> Cookies set by parties other than the website owner are called <strong className="text-foreground">"third-party cookies."</strong> Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
          </p>
        </Section>

        {/* Why do we use cookies */}
        <Section title="Why Do We Use Cookies?">
          <p>
            We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate — we refer to these as <strong className="text-foreground">"essential"</strong> or <strong className="text-foreground">"strictly necessary"</strong> cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our platform. Third parties serve cookies through our Website for analytics and other purposes.
          </p>
        </Section>

        {/* How can I control cookies */}
        <Section title="How Can I Control Cookies?">
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the <strong className="text-foreground">Cookie Preference Center</strong> (the consent banner that appears on your first visit). Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
          </p>
          <p>
            If you choose to reject cookies, you may still use our Website, though your access to some functionality and areas may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
          </p>
        </Section>

        {/* Cookie Tables */}
        <Section title="Cookies We Use">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Analytics &amp; Customization Cookies</h3>
              <p>These cookies collect information used either in aggregate form to help us understand how our Website is being used, or to help us customize our Website for you.</p>
              <div className="space-y-3">
                <CookieTable
                  name="_ga_#"
                  purpose="Used to distinguish individual users by means of a randomly generated number as client identifier, which allows calculation of visits and sessions."
                  provider=".hackord.vercel.app"
                  service="View Google Analytics Privacy Policy"
                  serviceUrl="https://business.safety.google/privacy/"
                  type="http_cookie"
                  expires="1 year 1 month 4 days"
                />
                <CookieTable
                  name="_ga"
                  purpose="Records a particular ID used to come up with data about website usage by the user."
                  provider=".hackord.vercel.app"
                  service="View Google Analytics Privacy Policy"
                  serviceUrl="https://business.safety.google/privacy/"
                  type="http_cookie"
                  expires="1 year 1 month 4 days"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Unclassified Cookies</h3>
              <p>These are cookies that have not yet been categorized. We are in the process of classifying these cookies with the help of their providers.</p>
              <CookieTable
                name="hackord_theme"
                provider="hackord.vercel.app"
                type="html_local_storage"
                expires="Persistent"
              />
            </div>
          </div>
        </Section>

        {/* Browser controls */}
        <Section title="How Can I Control Cookies on My Browser?">
          <p>As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser's help menu for more information. The following links explain how to manage cookies on popular browsers:</p>
          <BulletList items={[
            <ExternalLink href="https://support.google.com/chrome/answer/95647#zippy=%2Callow-or-block-cookies">Chrome</ExternalLink>,
            <ExternalLink href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d">Internet Explorer</ExternalLink>,
            <ExternalLink href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop">Firefox</ExternalLink>,
            <ExternalLink href="https://support.apple.com/en-ie/guide/safari/sfri11471/mac">Safari</ExternalLink>,
            <ExternalLink href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd">Edge</ExternalLink>,
            <ExternalLink href="https://help.opera.com/en/latest/web-preferences/">Opera</ExternalLink>,
          ]} />
          <p>In addition, most advertising networks offer you a way to opt out of targeted advertising:</p>
          <BulletList items={[
            <ExternalLink href="http://www.aboutads.info/choices/">Digital Advertising Alliance</ExternalLink>,
            <ExternalLink href="https://youradchoices.ca/">Digital Advertising Alliance of Canada</ExternalLink>,
            <ExternalLink href="http://www.youronlinechoices.com/">European Interactive Digital Advertising Alliance</ExternalLink>,
          ]} />
        </Section>

        {/* Web beacons */}
        <Section title="What About Other Tracking Technologies, Like Web Beacons?">
          <p>
            Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like <strong className="text-foreground">web beacons</strong> (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enables us to recognize when someone has visited our Website or opened an email. This allows us to monitor traffic patterns, communicate with cookies, understand whether you have come to the Website from an online advertisement, and measure the success of email marketing campaigns.
          </p>
        </Section>

        {/* Flash cookies */}
        <Section title="Do You Use Flash Cookies or Local Shared Objects?">
          <p>
            Websites may also use so-called "Flash Cookies" (also known as Local Shared Objects or "LSOs") to collect and store information about your use of our services, fraud prevention, and for other site operations. If you do not want Flash Cookies stored on your computer, you can adjust the settings of your Flash player to block them using the{" "}
            <ExternalLink href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager07.html">Website Storage Settings Panel</ExternalLink> or the{" "}
            <ExternalLink href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager03.html">Global Storage Settings Panel</ExternalLink>.
          </p>
        </Section>

        {/* Targeted advertising */}
        <Section title="Do You Serve Targeted Advertising?">
          <p>
            Third parties may serve cookies on your computer or mobile device to serve advertising through our Website. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in. The information collected through this process does not enable us or them to identify your name, contact details, or other personally identifying details unless you choose to provide these.
          </p>
        </Section>

        {/* Policy updates */}
        <Section title="How Often Will You Update This Cookie Policy?">
          <p>
            We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies. The date at the top of this Cookie Policy indicates when it was last updated.
          </p>
        </Section>

        {/* Contact */}
        <Section title="Where Can I Get Further Information?">
          <p>If you have any questions about our use of cookies or other technologies, please contact us at:</p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 border border-border text-sm font-medium text-foreground">
            <ExternalLink href="mailto:hackord.support@gmail.com">hackord.support@gmail.com</ExternalLink>
          </div>
        </Section>

        {/* Hidden DSAR link required by Termly */}
        <div style={{ display: "none" }}>
          <a className="cookie123" href="https://app.termly.io/dsar/6a94a1fb-4eb4-4c81-a74d-d3c9ce08b173" />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 dark:border-white/5 bg-background/80 py-8 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span>© 2026 Hackord. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="font-semibold text-foreground">Cookie Policy</Link>
            <a href="#" className="termly-display-preferences hover:text-foreground transition-colors">Consent Preferences</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
