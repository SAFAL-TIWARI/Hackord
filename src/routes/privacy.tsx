import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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

// ─── Shared sub-components ───────────────────────────────────────────────────

function Section({ id, title, short, children }: { id?: string; title: string; short?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {short && <p className="mt-1 text-xs text-primary italic">In Short: {short}</p>}
      </div>
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

function InternalAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
      {children}
    </a>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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

  const toc = [
    { id: "infocollect", label: "1. What Information Do We Collect?" },
    { id: "infouse", label: "2. How Do We Process Your Information?" },
    { id: "whoshare", label: "3. When and With Whom Do We Share Your Personal Information?" },
    { id: "cookies", label: "4. Do We Use Cookies and Other Tracking Technologies?" },
    { id: "sociallogins", label: "5. How Do We Handle Your Social Logins?" },
    { id: "inforetain", label: "6. How Long Do We Keep Your Information?" },
    { id: "infosafe", label: "7. How Do We Keep Your Information Safe?" },
    { id: "privacyrights", label: "8. What Are Your Privacy Rights?" },
    { id: "DNT", label: "9. Controls for Do-Not-Track Features" },
    { id: "policyupdates", label: "10. Do We Make Updates to This Notice?" },
    { id: "contact", label: "11. How Can You Contact Us About This Notice?" },
    { id: "request", label: "12. How Can You Review, Update, or Delete the Data We Collect?" },
  ];

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
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Transparency &amp; Data Security</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl">
            This Privacy Policy outlines how <strong className="text-foreground font-semibold">Hackord</strong> collects, uses, protects, and handles your personal data when you use our collaborative workspace platform.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Last Updated: <span className="font-medium text-foreground">August 9, 2026</span>
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-6">

        {/* Intro card */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            This Privacy Notice for <strong className="text-foreground">Hackord</strong> ("we," "us," or "our") describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
          </p>
          <BulletList items={[
            <>Visit our website at <ExternalLink href="https://hackord.vercel.app">https://hackord.vercel.app</ExternalLink> or any website of ours that links to this Privacy Notice</>,
            <>Use <strong className="text-foreground">Hackord</strong> — an all-in-one developer workspace platform. Discover global hackathons, launch virtual project rooms with HD video calls (Agora RTC), track live GitHub repositories, and build software with your team.</>,
            "Engage with us in other related ways, including any marketing or events.",
          ]} />
          <p>
            <strong className="text-foreground">Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. For questions, contact us at{" "}
            <ExternalLink href="mailto:hackord.support@gmail.com">hackord.support@gmail.com</ExternalLink>.
          </p>
        </div>

        {/* Summary */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Summary of Key Points</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">What personal information do we process?</strong> We may process personal information depending on how you interact with our Services, the choices you make, and the products and features you use.</p>
            <p><strong className="text-foreground">Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
            <p><strong className="text-foreground">Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
            <p><strong className="text-foreground">How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
            <p>
              <strong className="text-foreground">How do you exercise your rights?</strong> Visit{" "}
              <ExternalLink href="https://hackord.vercel.app/settings">hackord.vercel.app/settings</ExternalLink>, or contact us directly.
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <div id="toc" className="glass-strong rounded-2xl p-6 sm:p-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <ol className="space-y-1.5 text-sm">
            {toc.map((item) => (
              <li key={item.id}>
                <InternalAnchor href={`#${item.id}`}>{item.label}</InternalAnchor>
              </li>
            ))}
          </ol>
        </div>

        {/* Section 1 */}
        <Section id="infocollect" title="1. What Information Do We Collect?" short="We collect personal information that you provide to us.">
          <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, or otherwise when you contact us.</p>
          <div className="space-y-2">
            <p><strong className="text-foreground">Personal Information Provided by You.</strong> The personal information we collect may include: names, email addresses, usernames, passwords, and social media profile data.</p>
            <p><strong className="text-foreground">Sensitive Information.</strong> We do not process sensitive information.</p>
            <p>
              <strong className="text-foreground">Social Media Login Data.</strong> We may provide you with the option to register using your existing Google or GitHub account. If you choose to register in this way, we will collect certain profile information from the social media provider.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Google API Limited Use Disclosure</p>
            <p>
              Our use of information received from Google APIs will adhere to the{" "}
              <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</ExternalLink>, including the{" "}
              <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy#limited-use">Limited Use requirements</ExternalLink>.
            </p>
          </div>
        </Section>

        {/* Section 2 */}
        <Section id="infouse" title="2. How Do We Process Your Information?" short="We process your information to provide, improve, and administer our Services.">
          <p>We process your personal information for a variety of reasons, including:</p>
          <BulletList items={[
            <><strong className="text-foreground">Account creation and authentication:</strong> We process your information so you can create and log in to your account.</>,
            <><strong className="text-foreground">Prize draws and competitions:</strong> We may process your information to administer hackathon prize draws and competitions.</>,
          ]} />
        </Section>

        {/* Section 3 */}
        <Section id="whoshare" title="3. When and With Whom Do We Share Your Personal Information?" short="We may share information in specific situations with specific third parties.">
          <p>We may need to share your personal information in the following situations:</p>
          <BulletList items={[
            <><strong className="text-foreground">Business Transfers:</strong> We may share or transfer your information in connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</>,
          ]} />
        </Section>

        {/* Section 4 */}
        <Section id="cookies" title="4. Do We Use Cookies and Other Tracking Technologies?" short="We may use cookies and other tracking technologies to collect and store your information.">
          <p>
            We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. For full details, see our{" "}
            {/* <Link to="/cookie-policy" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">Cookie Policy</Link>. */}
          </p>
        </Section>

        {/* Section 5 */}
        <Section id="sociallogins" title="5. How Do We Handle Your Social Logins?" short="If you log in via a social media account, we may have access to certain information about you.">
          <p>
            Our Services offer you the ability to register and log in using your third-party social media account details (like Google or GitHub). Where you choose to do this, we will receive certain profile information about you from your social media provider. We will use the information we receive only for the purposes described in this Privacy Notice.
          </p>
        </Section>

        {/* Section 6 */}
        <Section id="inforetain" title="6. How Long Do We Keep Your Information?" short="We keep your information for as long as necessary to fulfill the purposes outlined in this notice.">
          <p>
            We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law. When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information.
          </p>
        </Section>

        {/* Section 7 */}
        <Section id="infosafe" title="7. How Do We Keep Your Information Safe?" short="We aim to protect your personal information through organizational and technical security measures.">
          <p>
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>
        </Section>

        {/* Section 8 */}
        <Section id="privacyrights" title="8. What Are Your Privacy Rights?" short="You may review, change, or terminate your account at any time.">
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time by contacting us at{" "}
              <ExternalLink href="mailto:hackord.support@gmail.com">hackord.support@gmail.com</ExternalLink>.
            </p>
            <p>
              <strong className="text-foreground">Account Information:</strong> You can log in to your account settings and update your user account at any time. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. Visit{" "}
              <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">Settings → Danger Zone</Link> to delete your account.
            </p>
          </div>
        </Section>

        {/* Section 9 */}
        <Section id="DNT" title="9. Controls for Do-Not-Track Features">
          <p>
            Most web browsers and some mobile operating systems include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.
          </p>
        </Section>

        {/* Section 10 */}
        <Section id="policyupdates" title="10. Do We Make Updates to This Notice?" short="Yes, we will update this notice as necessary to stay compliant with relevant laws.">
          <p>
            We may update this Privacy Notice from time to time. The updated version will be indicated by an updated date at the top of this Privacy Notice. We encourage you to review this Privacy Notice frequently to stay informed of how we are protecting your information.
          </p>
        </Section>

        {/* Section 11 */}
        <Section id="contact" title="11. How Can You Contact Us About This Notice?">
          <p>If you have questions or comments about this notice, you may email us at:</p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 border border-border text-sm font-medium text-foreground">
            <ExternalLink href="mailto:hackord.support@gmail.com">hackord.support@gmail.com</ExternalLink>
          </div>
        </Section>

        {/* Section 12 */}
        <Section id="request" title="12. How Can You Review, Update, or Delete the Data We Collect?">
          <p>
            Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. To submit a request, please visit:{" "}
            <ExternalLink href="https://hackord.vercel.app/settings">hackord.vercel.app/settings</ExternalLink>.
          </p>
        </Section>

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
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="font-semibold text-foreground">Privacy Policy</Link>
            {/* <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <a href="#" className="termly-display-preferences hover:text-foreground transition-colors">Consent Preferences</a> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
