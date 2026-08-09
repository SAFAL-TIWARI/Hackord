import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

type Props = {
  theme: "dark" | "light";
  onToggle: () => void;
  className?: string;
};

/**
 * High-fidelity Spatial UI glassmorphic slider for dark/light mode.
 * Styled after Apple Vision Pro OS theme slider.
 * Features a frosted glass track, glowing gradient sliding thumb, and sliding text labels.
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
      suppressHydrationWarning
      onClick={handleClick}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-8 w-25 shrink-0 cursor-pointer items-center rounded-full border p-1 select-none overflow-hidden shadow-inner transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isDark
          ? "bg-black/30 border-white/10 shadow-black/40"
          : "bg-white/15 border-white/30 shadow-white/10",
        className
      )}
      style={{
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Dynamic environmental glowing light inside the track */}
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-transparent transition-opacity duration-500 pointer-events-none",
          isDark ? "opacity-0" : "opacity-100"
        )}
      />
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-l from-indigo-500/20 via-blue-500/5 to-transparent transition-opacity duration-500 pointer-events-none",
          isDark ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Track text labels */}
      <span
        className={cn(
          "absolute left-4.5 text-xs font-semibold uppercase tracking-wider text-slate-100 transition-all duration-300 pointer-events-none",
          isDark
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-3"
        )}
      >
        Night
      </span>

      <span
        className={cn(
          "absolute right-4.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all duration-300 pointer-events-none",
          isDark
            ? "opacity-0 translate-x-3"
            : "opacity-100 translate-x-0"
        )}
      >
        Day
      </span>

      {/* Sliding thumb containing gradient & active icon */}
      <span
        className={cn(
          "absolute flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1)",
          isDark
            ? "translate-x-[65px] bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400"
            : "translate-x-0 bg-gradient-to-tr from-amber-500 via-orange-400 to-yellow-300"
        )}
        style={{
          boxShadow: isDark
            ? "0 0 12px rgba(99, 102, 241, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)"
            : "0 0 12px rgba(245, 158, 11, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)",
        }}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        ) : (
          <Sun className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        )}
      </span>
    </button>
  );
}
