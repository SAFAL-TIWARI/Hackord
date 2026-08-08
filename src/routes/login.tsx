import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Loader2, Eye, EyeOff } from "lucide-react";
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

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Hackord" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate({ to: "/dashboard" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Hackord workspace">
      <form className="space-y-4" onSubmit={handleSubmit}>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90"
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
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("hackord_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen bg-background text-foreground bg-mesh relative overflow-hidden flex flex-col transition-colors duration-300">
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

