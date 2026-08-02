import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, iconOnly = false, size = "md" }: BrandLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  const svgSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <Link to="/" className={cn("flex items-center gap-2.5 select-none cursor-pointer group", className)}>
      {/* Icon Container */}
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "relative grid place-items-center rounded-xl bg-gradient-brand text-white shadow-glow transition-transform duration-200 group-hover:scale-105",
            iconSizes[size]
          )}
        >
          <Sparkles className={cn(svgSizes[size], "text-white")} />
        </div>
      </div>

      {/* Static Text without animation */}
      {!iconOnly && (
        <div className="flex items-center gap-1.5">
          <span className={cn("font-extrabold tracking-tight text-foreground", textSizes[size])}>
            Hackord
          </span>
        </div>
      )}
    </Link>
  );
}
