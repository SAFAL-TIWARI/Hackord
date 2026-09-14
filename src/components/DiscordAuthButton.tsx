import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { openOAuthPopup } from "@/lib/oauthPopup";

interface DiscordAuthButtonProps {
  mode?: "login" | "signup";
}

export function DiscordAuthButton({ mode = "login" }: DiscordAuthButtonProps) {
  const { discordLogin } = useAuth();
  const navigate = useNavigate();
  const processedCodeRef = useRef<string | null>(null);

  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;

  const processAuthCode = (code: string) => {
    if (processedCodeRef.current === code) return;
    processedCodeRef.current = code;

    const toastId = toast.loading("Signing in with Discord...");
    const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");

    discordLogin(code, redirectUri)
      .then((res) => {
        toast.dismiss(toastId);
        if (res.isNewUser || mode === "signup") {
          toast.success("Welcome to Hackord! Discord account linked successfully.");
          navigate({ to: "/profile-setup" });
        } else {
          toast.success("Logged in with Discord! Discord handle & details synced.");
          navigate({ to: "/dashboard" });
        }
      })
      .catch((err: any) => {
        toast.dismiss(toastId);
        processedCodeRef.current = null;
        console.error("[discordAuthError]", err);
        toast.error(err.message || "Discord login failed. Please try again.");
      });
  };

  // 1. Listen for OAuth callback message sent from popup window
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "HACKORD_OAUTH_CALLBACK") {
        const { code, state } = event.data;
        if (code && state === "discord") {
          processAuthCode(code);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Reset processing ref if page restored from browser bfcache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        processedCodeRef.current = null;
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [discordLogin, navigate, mode]);

  // 2. Handle redirect fallback (in case popup was blocked or opened directly)
  useEffect(() => {
    if (typeof window === "undefined" || window.opener) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state === "discord" && processedCodeRef.current !== code) {
      // Clean parameters from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      processAuthCode(code);
    }
  }, [discordLogin, navigate, mode]);

  const handleDiscordClick = () => {
    if (!clientId || clientId.includes("your_discord_client_id")) {
      toast.error("Discord Client ID is missing in VITE_DISCORD_CLIENT_ID environment variable.");
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=identify+email&state=discord`;

    // Open in dedicated popup window (just like Google)
    const popup = openOAuthPopup(discordAuthUrl, "Discord Login", 600, 750);
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // If popup was blocked by browser, fallback to standard redirect
      window.location.href = discordAuthUrl;
    }
  };

  return (
    <button
      type="button"
      onClick={handleDiscordClick}
      title={mode === "signup" ? "Sign up with Discord" : "Log in with Discord"}
      aria-label={mode === "signup" ? "Sign up with Discord" : "Log in with Discord"}
      className="h-10 w-10 rounded-full border border-border bg-card hover:bg-[#5865F2]/10 hover:border-[#5865F2]/50 hover:text-[#5865F2] text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 cursor-pointer"
    >
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    </button>
  );
}
