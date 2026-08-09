import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 bg-mesh">
      <div className="max-w-md text-center glass-strong rounded-2xl p-10">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hackord — Real-Time Hackathon Workspaces & Dev Rooms" },
      {
        name: "description",
        content:
          "Hackord is an all-in-one developer workspace platform. Discover global hackathons, launch virtual project rooms with HD video calls (Agora RTC), track live GitHub repositories, and build software with your team.",
      },
      {
        name: "keywords",
        content:
          "hackathon, developer workspace, hackathon team finder, real time video call, agora rtc, github integration, developer collaboration, virtual project room, open source projects, coding rooms",
      },
      { name: "author", content: "Hackord" },
      { name: "robots", content: "index, follow" },
      { name: "theme-color", content: "#090d16" },
      { name: "google-site-verification", content: "KOi1bvu2tRkeojuYE0ABHOWsA8_frAbvSeMWsQGhBM4" },

      // OpenGraph Metadata
      { property: "og:site_name", content: "Hackord" },
      { property: "og:title", content: "Hackord — Real-Time Hackathon Workspaces & Dev Rooms" },
      {
        property: "og:description",
        content:
          "Discover hackathons, launch virtual project rooms with HD video calls (Agora RTC), track live GitHub repos, and ship software with your team.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hackord.vercel.app" },
      { property: "og:image", content: "https://hackord.vercel.app/logo.png" },

      // Twitter Card Metadata
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@hackord_app" },
      { name: "twitter:title", content: "Hackord — Real-Time Hackathon Workspaces & Dev Rooms" },
      {
        name: "twitter:description",
        content:
          "Discover hackathons, launch virtual project rooms with HD video calls, track live GitHub repos, and ship software together.",
      },
      { name: "twitter:image", content: "https://hackord.vercel.app/logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "canonical", href: "https://hackord.vercel.app" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hackord",
    operatingSystem: "All",
    applicationCategory: "DeveloperApplication",
    description:
      "Hackord is an all-in-one developer workspace and collaboration platform for hackathons, virtual project rooms, HD video calls, and GitHub integration.",
    url: "https://hackord.vercel.app",
    image: "https://hackord.vercel.app/logo.png",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "Hackord",
      url: "https://hackord.vercel.app",
      logo: "https://hackord.vercel.app/logo.png",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Termly Consent Banner — MUST be first script on page */}
        <script src="https://app.termly.io/resource-blocker/9f2d5f69-0057-49d8-894b-302e07544ca1?autoBlock=on" />
        {/* Google Analytics (GA4) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-FHJN9TL6LM"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-FHJN9TL6LM');
            `,
          }}
        />
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('hackord_theme');
                  var theme = savedTheme || 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
