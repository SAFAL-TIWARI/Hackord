import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Hackord" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  return (
    <AuthShell title="Create your workspace" subtitle="Join Hackord and start collaborating">
      <div className="grid gap-2">
        <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/profile-setup" })}>
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/profile-setup" })}>
          Continue with GitHub
        </Button>
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/profile-setup" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@college.edu" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Create a password" required />
        </div>
        <Button type="submit" className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-90">
          Create account
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground underline-offset-4 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
