import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

type Props = {
  theme: "dark" | "light";
  onToggle: () => void;
  className?: string;
};

/**
 * iOS-style sliding pill toggle for dark/light mode.
 * Smooth animated thumb slides between sun (light) and moon (dark).
 */
export function ThemeToggle({ theme, onToggle, className }: Props) {
  const isDark = theme === "dark";

  const handleClick = () => {
    haptic("light");
    onToggle();
  };

  return (
    <button
      id="theme-toggle"
      onClick={handleClick}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border border-border p-1 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        isDark
          ? "bg-slate-800 border-slate-600"
          : "bg-amber-50 border-amber-200",
        className
      )}
    >
      {/* Track icons (always visible in background) */}
      <Sun
        className={cn(
          "absolute left-1.5 h-3.5 w-3.5 transition-all duration-300",
          isDark ? "text-slate-600 opacity-40" : "text-amber-500 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute right-1.5 h-3.5 w-3.5 transition-all duration-300",
          isDark ? "text-indigo-300 opacity-100" : "text-slate-400 opacity-40"
        )}
      />

      {/* Sliding thumb */}
      <span
        className={cn(
          "absolute flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-300 ease-in-out",
          isDark
            ? "translate-x-8 bg-indigo-500 shadow-indigo-500/50"
            : "translate-x-0 bg-amber-400 shadow-amber-400/50"
        )}
        style={{ boxShadow: isDark ? "0 0 8px 2px rgba(99,102,241,0.5)" : "0 0 8px 2px rgba(251,191,36,0.5)" }}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-white" />
        ) : (
          <Sun className="h-3 w-3 text-white" />
        )}
      </span>
    </button>
  );
}
