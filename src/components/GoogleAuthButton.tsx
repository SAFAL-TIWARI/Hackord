import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  mode?: "login" | "signup";
}

export function GoogleAuthButton({ mode = "login" }: GoogleAuthButtonProps) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Google authentication failed. No credential returned.");
      return;
    }

    setLoading(true);
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res.isNewUser || mode === "signup") {
        toast.success("Welcome to Hackord! Let's complete your profile.");
        navigate({ to: "/profile-setup" });
      } else {
        toast.success("Successfully logged in with Google!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    toast.error("Google Authentication was unsuccessful or canceled.");
  };

  if (!clientId || clientId.includes("your_google_client_id")) {
    return (
      <div className="w-full text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        Google Client ID is missing in frontend <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">.env</code>.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      {loading ? (
        <div className="w-full h-10 rounded-full bg-secondary/50 border border-border flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Authenticating with Google…</span>
        </div>
      ) : (
        <div className="w-full flex justify-center overflow-hidden rounded-full shadow-md transition-all hover:scale-[1.01]">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="filled_black"
            shape="pill"
            text={mode === "signup" ? "signup_with" : "signin_with"}
            width="100%"
          />
        </div>
      )}
    </div>
  );
}
