import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requestNotificationPermission, sendNativeSystemNotification } from "@/lib/system-notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function HomeNavbar() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (saved) return saved;
    }
    return "dark";
  });
  const [scrolled, setScrolled] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      toast.success("Browser website notifications enabled!");
      sendNativeSystemNotification(
        "Hackord Notifications Enabled 🎉",
        "You will now receive desktop alerts for hackathons, messages, and room updates."
      );
    } else {
      toast.error("Browser notification permission denied or unavailable.");
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full px-4 sm:px-6 py-3 transition-all duration-500 ease-out flex justify-center">
      <header
        className={cn(
          "w-full transition-all duration-500 ease-out flex items-center justify-between",
          scrolled
            ? "max-w-3xl rounded-full border border-border/80 bg-card/85 backdrop-blur-2xl shadow-spatial px-5 py-2.5"
            : "max-w-7xl rounded-2xl border border-transparent bg-transparent px-4 sm:px-6 py-3"
        )}
      >
        <BrandLogo size="md" className="transition-transform duration-300 hover:scale-105" />

        <nav className="flex items-center gap-2.5 sm:gap-4 text-sm font-medium">
          <button
            onClick={handleEnableNotifications}
            className={cn(
              "relative p-2 rounded-xl border transition-all duration-300",
              notifGranted
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/70"
            )}
            title={notifGranted ? "Browser website notifications enabled" : "Enable browser push notifications"}
          >
            <Bell className="h-4 w-4" />
            {notifGranted && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <Link
            to="/signup"
            className="rounded-xl bg-gradient-brand text-xs sm:text-sm font-semibold text-white px-4 py-2 shadow-glow hover:opacity-90 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Get started
          </Link>
        </nav>
      </header>
    </div>
  );
}
