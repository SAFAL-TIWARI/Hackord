import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { openOAuthPopup } from "@/lib/oauthPopup";

interface RedditAuthButtonProps {
  mode?: "login" | "signup";
}

export function RedditAuthButton({ mode = "login" }: RedditAuthButtonProps) {
  const { redditLogin } = useAuth();
  const navigate = useNavigate();
  const processedCodeRef = useRef<string | null>(null);

  const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;

  const processAuthCode = (code: string) => {
    if (processedCodeRef.current === code) return;
    processedCodeRef.current = code;

    const toastId = toast.loading("Signing in with Reddit...");
    const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");

    redditLogin(code, redirectUri)
      .then((res) => {
        toast.dismiss(toastId);
        if (res.isNewUser || mode === "signup") {
          toast.success("Welcome to Hackord! Reddit account linked successfully.");
          navigate({ to: "/profile-setup" });
        } else {
          toast.success("Logged in with Reddit! Reddit profile synced.");
          navigate({ to: "/dashboard" });
        }
      })
      .catch((err: any) => {
        toast.dismiss(toastId);
        processedCodeRef.current = null;
        console.error("[redditAuthError]", err);
        toast.error(err.message || "Reddit login failed. Please try again.");
      });
  };

  // 1. Listen for OAuth callback message sent from popup window
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "HACKORD_OAUTH_CALLBACK") {
        const { code, state } = event.data;
        if (code && state === "reddit") {
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
  }, [redditLogin, navigate, mode]);

  // 2. Handle redirect fallback (in case popup was blocked or opened directly)
  useEffect(() => {
    if (typeof window === "undefined" || window.opener) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state === "reddit" && processedCodeRef.current !== code) {
      // Clean parameters from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      processAuthCode(code);
    }
  }, [redditLogin, navigate, mode]);

  const handleRedditClick = () => {
    if (!clientId || clientId.includes("your_reddit_client_id")) {
      toast.error("Reddit Client ID is missing in VITE_REDDIT_CLIENT_ID environment variable.");
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");
    const redditAuthUrl = `https://www.reddit.com/api/v1/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=code&state=reddit&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&duration=temporary&scope=identity`;

    // Open in dedicated popup window
    const popup = openOAuthPopup(redditAuthUrl, "Reddit Login", 600, 750);
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // If popup was blocked by browser, fallback to standard redirect
      window.location.href = redditAuthUrl;
    }
  };

  return (
    <button
      type="button"
      onClick={handleRedditClick}
      title={mode === "signup" ? "Sign up with Reddit" : "Log in with Reddit"}
      aria-label={mode === "signup" ? "Sign up with Reddit" : "Log in with Reddit"}
      className="h-10 w-10 rounded-full border border-border bg-card hover:bg-[#FF4500]/10 hover:border-[#FF4500]/50 hover:text-[#FF4500] text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF4500]/50 cursor-pointer"
    >
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    </button>
  );
}
