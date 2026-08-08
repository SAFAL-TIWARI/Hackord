import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface GitHubAuthButtonProps {
  mode?: "login" | "signup";
}

export function GitHubAuthButton({ mode = "login" }: GitHubAuthButtonProps) {
  const { githubLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const processedCodeRef = useRef<string | null>(null);

  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

  // Handle GitHub OAuth callback code from URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && processedCodeRef.current !== code) {
      processedCodeRef.current = code;
      setLoading(true);

      // Clean code parameter from URL immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      githubLogin(code)
        .then((res) => {
          if (res.isNewUser || mode === "signup") {
            toast.success("Welcome to Hackord! GitHub profile linked successfully.");
            navigate({ to: "/profile-setup" });
          } else {
            toast.success("Logged in with GitHub! Profile GitHub URL saved.");
            navigate({ to: "/dashboard" });
          }
        })
        .catch((err: any) => {
          console.error("[githubAuthError]", err);
          toast.error(err.message || "GitHub login failed. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [githubLogin, navigate, mode]);

  const handleGitHubClick = () => {
    if (!clientId || clientId.includes("your_github_client_id")) {
      toast.error("GitHub Client ID is missing in VITE_GITHUB_CLIENT_ID environment variable.");
      return;
    }

    setLoading(true);
    const redirectUri = window.location.origin + window.location.pathname;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    
    window.location.href = githubAuthUrl;
  };

  return (
    <button
      type="button"
      onClick={handleGitHubClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-[#171b26] hover:bg-[#202636] active:scale-[0.99] text-white border border-white/10 rounded-full py-2.5 px-4 font-medium text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Connecting with GitHub…</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>{mode === "signup" ? "Sign up with GitHub" : "Continue with GitHub"}</span>
        </>
      )}
    </button>
  );
}
