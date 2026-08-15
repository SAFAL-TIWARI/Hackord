import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MessageSquare, Bot, Plus, FolderOpen } from "lucide-react";

export function AiWorkspaceSkeleton() {
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-[260px_1fr] glass rounded-3xl border border-border shadow-spatial overflow-hidden h-[660px] transition-all duration-300">
      {/* 1. Left Sidebar Skeleton */}
      <div className="border-r border-border bg-sidebar/40 p-4 flex flex-col h-full overflow-hidden w-full md:w-[260px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 w-full">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary/40 animate-pulse" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-4 rounded-md hidden md:block" />
        </div>

        {/* New Chat Button Skeleton */}
        <div className="w-full flex items-center justify-between mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-primary/40" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="relative mb-3 w-full">
          <Skeleton className="w-full h-8 rounded-xl" />
        </div>

        {/* List Sections Skeleton */}
        <div className="flex-1 overflow-hidden space-y-4 pr-0.5">
          {/* Pinned Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-3 w-5 rounded-full" />
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`pin-${i}`}
                  className="flex items-center gap-2 p-2 rounded-xl bg-card/30 border border-border/40"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-primary/30 shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Recents Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-3 w-5 rounded-full" />
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`recent-${i}`}
                  className="flex items-center gap-2 p-2 rounded-xl bg-card/20 border border-border/30"
                >
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Thread Skeleton */}
      <div className="flex flex-col flex-1 h-full bg-card/10 overflow-hidden relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border p-3.5 gap-3 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
              <Bot className="h-4 w-4 text-primary/40 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36 sm:w-48" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2.5 w-48 sm:w-64" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card/40">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground/40" />
              <Skeleton className="h-3 w-8 hidden sm:inline-block" />
            </div>
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl hidden sm:block" />
          </div>
        </div>

        {/* Message Stream Skeleton */}
        <div className="flex-1 space-y-4 overflow-hidden p-4 bg-slate-950/5 dark:bg-black/5">
          {/* AI Message */}
          <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[75%] mr-auto">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <div className="flex-1 p-3.5 rounded-2xl bg-card/80 border border-border space-y-2 rounded-tl-md">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-2 mt-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* User Message */}
          <div className="flex items-start gap-2 max-w-[80%] ml-auto flex-row-reverse">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <div className="p-3.5 rounded-2xl bg-primary/20 border border-primary/30 space-y-1.5 rounded-tr-md">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2.5 w-10" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* AI Followup Message */}
          <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[70%] mr-auto">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <div className="flex-1 p-3.5 rounded-2xl bg-card/80 border border-border space-y-2 rounded-tl-md">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>

        {/* Bottom Input Row Skeleton */}
        <div className="flex items-center gap-2 border-t border-border p-3 bg-card/35 backdrop-blur-md">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  );
}
