import React from "react";
import { LayoutList, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-card/80 border border-border/80 p-1 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
          view === "list"
            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-card/50"
        )}
      >
        <LayoutList className="h-3.5 w-3.5" />
        <span>List</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange("grid")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
          view === "grid"
            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-card/50"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>Grid</span>
      </button>
    </div>
  );
}
