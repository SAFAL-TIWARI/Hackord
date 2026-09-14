import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Loader2, Eye, EyeOff, RotateCw } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { GitHubAuthButton } from "@/components/GitHubAuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Hackord" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, requestOtp, verifyOtp, forgotPasswordRequest, resetPasswordVerify, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<"password" | "otp" | "reset">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
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
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setResending(true);
    try {
      if (authMode === "reset") {
        const res = await forgotPasswordRequest(email);
        toast.success(res.message || "Password reset verification code resent!");
      } else {
        const res = await requestOtp(email);
        toast.success(res.message || "Verification code resent to your email!");
      }
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(email);
      setOtpSent(true);
      setResendCooldown(30);
      toast.success(res.message || "Verification code sent to your email!");
    } catch (err: any) {
      if (err.message?.includes("sign up") || err.message?.includes("No account found")) {
        toast.error("No account found with this email. Redirecting to Sign Up page...");
        setTimeout(() => {
          navigate({ to: "/signup" });
        }, 1200);
      } else {
        toast.error(err.message || "Failed to send OTP code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      toast.error("Please enter the verification code sent to your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(email, otpCode);
      toast.success("Successfully verified & logged in!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      if (err.message?.includes("sign up") || err.message?.includes("No account found")) {
        toast.error("No account found with this email. Redirecting to Sign Up page...");
        setTimeout(() => {
          navigate({ to: "/signup" });
        }, 1200);
      } else {
        toast.error(err.message || "Invalid verification code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email);
      setOtpSent(true);
      setResendCooldown(30);
      toast.success(res.message || "Password reset verification code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordVerify(email, otpCode, newPassword);
      toast.success("Password reset successfully! Logged in.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Password reset failed. Check code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={authMode === "reset" ? "Reset Password" : "Welcome back"}
      subtitle={authMode === "reset" ? "Verification code will be sent to your email" : "Log in to your Hackord workspace"}
    >
      {/* Auth Method Selector */}
      {authMode !== "reset" && (
        <div className="flex rounded-xl bg-muted/30 p-1 mb-6 border border-border/50">
          <button
            type="button"
            onClick={() => { setAuthMode("password"); setOtpSent(false); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authMode === "password" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("otp"); setOtpSent(false); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authMode === "otp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email OTP
          </button>
        </div>
      )}

      {authMode === "password" ? (
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => { setAuthMode("reset"); setOtpSent(false); }}
                className="text-xs text-primary hover:underline cursor-pointer font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              <Mail className="h-4 w-4" />
            )}
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
      ) : authMode === "otp" ? (
        <form className="space-y-4" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <div className="space-y-2">
            <Label htmlFor="otp-email">Email Address</Label>
            <Input
              id="otp-email"
              type="email"
              placeholder="Enter your email for code"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || otpSent}
            />
          </div>

          {otpSent && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp-code">6-Digit Verification Code</Label>
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
                  id="otp-code"
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
                  onClick={() => { setOtpSent(false); setOtpCode(""); }}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Change email
                </button>
                <span>Code expires in 10 mins</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {loading
              ? "Processing…"
              : otpSent
              ? "Verify & Sign In"
              : "Send Code"}
          </Button>
        </form>
      ) : (
        /* Forgot / Reset Password Form */
        <form className="space-y-4" onSubmit={otpSent ? handleResetPassword : handleSendResetCode}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reset-email">Registered Email Address</Label>
              <button
                type="button"
                onClick={() => { setAuthMode("password"); setOtpSent(false); }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Back to Login
              </button>
            </div>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || otpSent}
            />
          </div>

          {otpSent && (
            <>
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reset-otp-code">6-Digit Verification Code</Label>
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
                    id="reset-otp-code"
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
                    onClick={() => { setOtpSent(false); setOtpCode(""); }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Change email
                  </button>
                  <span>Code sent to your email</span>
                </div>
              </div>

              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {loading
              ? "Processing…"
              : otpSent
              ? "Reset Password & Login"
              : "Send Reset Code"}
          </Button>

          {otpSent && (
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
          )}
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

      <div className="flex items-center justify-center gap-4">
        <GoogleAuthButton mode="login" />
        <GitHubAuthButton mode="login" />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-foreground font-medium underline-offset-4 hover:underline">Sign up</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (saved) return saved;
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
    localStorage.setItem("hackord_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-background text-foreground bg-mesh relative flex flex-col transition-colors duration-300">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[350px] sm:h-[500px] bg-brand-2/10 dark:bg-brand-2/15 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md mx-auto text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" className="flex-col gap-3" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="w-full sm:mx-auto sm:max-w-[440px] animate-fade-in animate-delay-100">
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-border to-transparent">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
            <div className="bg-card/90 text-card-foreground backdrop-blur-2xl rounded-[23px] px-6 py-8 sm:px-8 sm:py-10 shadow-card relative z-10 border border-border">
              {children}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to Hackord's{" "}
            <Link to="/terms" className="text-foreground underline underline-offset-2 hover:text-primary">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-foreground underline underline-offset-2 hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

