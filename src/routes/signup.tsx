import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Eye, EyeOff, RotateCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "./login";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { GitHubAuthButton } from "@/components/GitHubAuthButton";
import { DiscordAuthButton } from "@/components/DiscordAuthButton";
import { MicrosoftAuthButton } from "@/components/MicrosoftAuthButton";
// import { RedditAuthButton } from "@/components/RedditAuthButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Hackord" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { signupRequestOtp, signupVerifyOtp, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending || loading) return;
    setResending(true);
    try {
      const res = await signupRequestOtp(name, email, password);
      toast.success(res.message || "Verification code resent to your email!");
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await signupRequestOtp(name, email, password);
      setStep("otp");
      setResendCooldown(30);
      toast.success(res.message || "Verification code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Signup request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.trim().length < 4) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await signupVerifyOtp(name, email, password, otpCode);
      toast.success("Account created and verified! Let's set up your profile.");
      navigate({ to: "/profile-setup" });
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === "otp" ? "Verify your email" : "Create your workspace"}
      subtitle={step === "otp" ? `We sent a code to ${email}` : "Join Hackord and start collaborating"}
    >
      {step === "details" ? (
        <form className="space-y-4" onSubmit={handleRequestOtp}>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Sending verification code…" : "Continue with Email OTP"}
          </Button>
        </form>
      ) : (
        <form className="space-y-5 animate-fade-in" onSubmit={handleVerifyOtp}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Here is your verification step:</p>
            <p className="text-sm font-semibold text-foreground">Enter 6-digit code</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="signup-otp">6-Digit Verification Code</Label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending || loading}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span className="tabular-nums">Resend in {resendCooldown}s</span>
                ) : (
                  <>
                    <RotateCw className="h-3 w-3" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-center py-1">
              <InputOTP
                id="signup-otp"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={otpCode}
                onChange={(val) => setOtpCode(val)}
                disabled={loading}
                autoFocus
              >
                <InputOTPGroup className="gap-2 sm:gap-2.5">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="text-primary hover:underline cursor-pointer"
              >
                Edit details
              </button>
              <span>Code sent to {email}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Verifying & Creating…" : "Verify Code & Create Account"}
          </Button>

          <div className="text-center pt-1 text-xs text-muted-foreground">
            Didn't receive code?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resending || loading}
              className="text-primary hover:underline font-medium cursor-pointer disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
        <GoogleAuthButton mode="signup" />
        <GitHubAuthButton mode="signup" />
        <DiscordAuthButton mode="signup" />
        <MicrosoftAuthButton mode="signup" />
        {/* <RedditAuthButton mode="signup" /> */}
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground font-medium underline-offset-4 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
