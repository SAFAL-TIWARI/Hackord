import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { openOAuthPopup } from "@/lib/oauthPopup";

interface MicrosoftAuthButtonProps {
  mode?: "login" | "signup";
}

export function MicrosoftAuthButton({ mode = "login" }: MicrosoftAuthButtonProps) {
  const { microsoftLogin } = useAuth();
  const navigate = useNavigate();
  const processedCodeRef = useRef<string | null>(null);

  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;

  const processAuthCode = (code: string) => {
    if (processedCodeRef.current === code) return;
    processedCodeRef.current = code;

    const toastId = toast.loading("Signing in with Microsoft...");
    const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");

    microsoftLogin(code, redirectUri)
      .then((res) => {
        toast.dismiss(toastId);
        if (res.isNewUser || mode === "signup") {
          toast.success("Welcome to Hackord! Microsoft account linked successfully.");
          navigate({ to: "/profile-setup" });
        } else {
          toast.success("Logged in with Microsoft! Profile details synced.");
          navigate({ to: "/dashboard" });
        }
      })
      .catch((err: any) => {
        toast.dismiss(toastId);
        processedCodeRef.current = null;
        console.error("[microsoftAuthError]", err);
        toast.error(err.message || "Microsoft login failed. Please try again.");
      });
  };

  // 1. Listen for OAuth callback message sent from popup window
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "HACKORD_OAUTH_CALLBACK") {
        const { code, state } = event.data;
        if (code && state === "microsoft") {
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
  }, [microsoftLogin, navigate, mode]);

  // 2. Handle redirect fallback (in case popup was blocked or opened directly)
  useEffect(() => {
    if (typeof window === "undefined" || window.opener) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state === "microsoft" && processedCodeRef.current !== code) {
      // Clean parameters from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      processAuthCode(code);
    }
  }, [microsoftLogin, navigate, mode]);

  const handleMicrosoftClick = () => {
    if (!clientId || clientId.includes("your_microsoft_client_id")) {
      toast.error("Microsoft Client ID is missing in VITE_MICROSOFT_CLIENT_ID environment variable.");
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");
    const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_mode=query&scope=openid+profile+email+User.Read&state=microsoft`;

    // Open in dedicated popup window (just like Google)
    const popup = openOAuthPopup(msAuthUrl, "Microsoft Login", 600, 750);
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // If popup was blocked by browser, fallback to standard redirect
      window.location.href = msAuthUrl;
    }
  };

  return (
    <button
      type="button"
      onClick={handleMicrosoftClick}
      title={mode === "signup" ? "Sign up with Microsoft" : "Log in with Microsoft"}
      aria-label={mode === "signup" ? "Sign up with Microsoft" : "Log in with Microsoft"}
      className="h-10 w-10 rounded-full border border-border bg-card hover:bg-accent text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
    >
      <svg className="h-5 w-5" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
    </button>
  );
}
