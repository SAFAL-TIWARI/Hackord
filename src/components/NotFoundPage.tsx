import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Compass, AlertCircle, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { HomeNavbar } from "@/components/HomeNavbar";
import { HomeFooter } from "@/components/HomeFooter";

export function NotFoundPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      toast.dismiss("404-redirect");
      return;
    }

    if (timeLeft <= 0) {
      toast.dismiss("404-redirect");
      navigate({ to: "/" });
      return;
    }

    // Trigger toast notification during the final 5 seconds (5s, 4s, 3s, 2s, 1s)
    if (timeLeft <= 5) {
      toast.info(`Redirecting to Home page in ${timeLeft} second${timeLeft === 1 ? "" : "s"}...`, {
        id: "404-redirect",
        duration: 2000,
      });
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isPaused, navigate]);

  const handleGoBack = () => {
    toast.dismiss("404-redirect");
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  const handleGoHome = () => {
    toast.dismiss("404-redirect");
    navigate({ to: "/" });
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    if (!isPaused) {
      toast.info("Auto-redirect paused.", { id: "404-redirect-pause", duration: 3000 });
    } else {
      toast.success("Auto-redirect resumed.", { id: "404-redirect-pause", duration: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-background bg-mesh text-foreground flex flex-col justify-between overflow-x-hidden relative scanlines">
      {/* Home Navbar */}
      <HomeNavbar />

      {/* Hero 404 Visual Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

        {/* 404 Cyber Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-mono text-muted-foreground animate-fade-in shadow-sm border border-border">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>
          <span className="tracking-wider">ERROR 404 // SIGNAL_LOST</span>
        </div>

        {/* Glitch Animated 404 Title */}
        <div className="relative mt-8 select-none">
          <h1 className="text-8xl sm:text-9xl font-extrabold tracking-tight text-gradient-brand glitch-text font-display drop-shadow-xl">
            404
          </h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-brand rounded-full blur-xs opacity-80" />
        </div>

        {/* Message Headings */}
        <h2 className="mt-8 text-2xl sm:text-4xl font-bold tracking-tight animate-fade-in animate-delay-100">
          Lost in Hyperspace?
        </h2>

        <p className="mt-4 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-in animate-delay-200">
          The page you're searching for doesn't exist, was renamed, or has traveled into another dimension.
        </p>

        {/* Countdown & Auto Redirect Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 glass-strong rounded-2xl px-5 py-3 border border-border/60 shadow-spatial animate-fade-in animate-delay-300">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
            <Compass className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "8s" }} />
            <span>
              {isPaused ? (
                <span className="text-warning font-semibold">Redirect Paused</span>
              ) : (
                <>
                  Redirecting home in{" "}
                  <span className="font-bold text-primary text-base font-mono mx-0.5">{timeLeft}</span>s
                </>
              )}
            </span>
          </div>

          <button
            onClick={togglePause}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/30 cursor-pointer"
            title={isPaused ? "Resume Redirect" : "Pause Redirect"}
          >
            {isPaused ? (
              <>
                <PlayCircle className="h-3.5 w-3.5 text-success" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <PauseCircle className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-md animate-fade-in animate-delay-400">
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl glass-strong px-6 py-3.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95 border border-border hover:border-primary/50 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span>Go Back</span>
          </button>

          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
        </div>
      </main>

      {/* Home Footer */}
      <HomeFooter />
    </div>
  );
}
