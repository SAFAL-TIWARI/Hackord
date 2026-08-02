import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, iconOnly = false, size = "md" }: BrandLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const imgSizes = {
    sm: "h-5 w-5",
    md: "h-6.5 w-6.5",
    lg: "h-8 w-8",
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
            "relative grid place-items-center rounded-xl bg-gradient-brand text-white shadow-glow transition-transform duration-200 group-hover:scale-105 overflow-hidden p-1",
            iconSizes[size]
          )}
        >
          <img
            src="/logo.png"
            alt="Hackord Logo"
            className={cn("object-contain rounded-lg", imgSizes[size])}
          />
        </div>
      </div>

      {/* Static Text */}
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

