import React from "react";
import { Bot, GitMerge, Video, Mic, CheckCircle2, Users, Radio, MonitorUp } from "lucide-react";

export function HeroShowcase() {
  return (
    <div className="relative h-[500px] w-full perspective-[1200px] hidden lg:block">
      {/* Ambient background glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/15 blur-[120px] opacity-20 pointer-events-none" />

      {/* Card 1: AI Assistant (Floating top right) */}
      <div className="absolute right-[5%] top-[10%] w-72 rounded-2xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-5 shadow-card hover:shadow-spatial animate-float [transform:rotateY(-15deg)_rotateX(10deg)] z-30 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-border">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Project Lead</span>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-background/80 p-3 text-xs text-muted-foreground border border-border">
            <p>Analyzing architecture... <br/><span className="text-primary font-semibold mt-1 inline-block">Suggestion:</span> Use Redis for real-time state sync.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-full rounded bg-primary/15 animate-pulse" />
            <div className="h-6 w-6 rounded bg-primary/15 shrink-0" />
          </div>
        </div>
      </div>

      {/* Card 2: GitHub Integration (Floating bottom left) */}
      <div className="absolute left-[0%] bottom-[15%] w-80 rounded-2xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-5 shadow-card hover:shadow-spatial animate-float-delayed [transform:rotateY(10deg)_rotateX(5deg)] z-20 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-emerald-500/10 flex items-center justify-center border border-border">
              <GitMerge className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-foreground">Pull Requests</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Live</span>
        </div>
        <div className="space-y-2">
          {[
            { msg: "feat: AI integration", time: "2m ago", status: "emerald" },
            { msg: "fix: websockets disconnect", time: "15m ago", status: "emerald" },
            { msg: "refactor: auth flow", time: "1h ago", status: "blue" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-foreground/5 transition-colors border border-border/40 bg-background/40">
              <span className="text-xs text-foreground font-mono font-medium">{item.msg}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
                <CheckCircle2 className={`h-3 w-3 text-${item.status}-500`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Live HD Video Meeting & Voice Sync (Center Back) */}
      <div className="absolute left-[12%] top-[3%] w-72 rounded-2xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-4 shadow-card hover:shadow-spatial animate-float [transform:translateZ(-100px)_rotateY(-5deg)] z-10 opacity-95 hover:opacity-100 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center border border-rose-500/25">
              <Video className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Live Team Huddle</div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-semibold text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            LIVE
          </div>
        </div>

        {/* Active Participants in Meeting */}
        <div className="space-y-2 mb-3">
          {/* Active Speaker */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-background">
                  AT
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-background" />
              </div>
              <div>
                <span className="text-xs font-medium text-foreground block leading-tight">Alex (Lead)</span>
                <span className="text-[10px] text-emerald-400 font-medium">Speaking</span>
              </div>
            </div>
            {/* Audio Wave Bars */}
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-0.5 h-4 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
              <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:75ms]" />
            </div>
          </div>

          {/* Screen Share / Participant */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px] font-bold text-cyan-400 border border-cyan-500/30">
                SK
              </div>
              <div>
                <span className="text-xs font-medium text-foreground block leading-tight">Sarah K.</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MonitorUp className="h-2.5 w-2.5 text-cyan-400" /> Sharing screen
                </span>
              </div>
            </div>
            <div className="h-5 px-1.5 rounded bg-foreground/5 flex items-center gap-1 border border-border/40 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>+3</span>
            </div>
          </div>
        </div>

        {/* Meeting Quick Bar */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">hck-92a-live</span>
          </div>
          <div className="flex items-center gap-1 text-foreground/80 font-medium">
            <Mic className="h-3 w-3 text-emerald-400" />
            <Video className="h-3 w-3 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Card 4: Deployment Status (Floating bottom right) */}
      <div className="absolute right-[15%] bottom-[15%] rounded-2xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-4 shadow-card hover:shadow-spatial animate-float-delayed [transform:rotateY(-5deg)_rotateX(5deg)] z-20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="text-sm font-semibold text-foreground">Production deployed</span>
        </div>
      </div>
      
      {/* Central Connector Lines (Stylistic) */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20" style={{ zIndex: 15 }}>
        <path d="M150 200 Q 300 150 450 300" stroke="currentColor" fill="none" strokeWidth="2" strokeDasharray="4 4" className="text-primary animate-pulse" />
      </svg>
    </div>
  );
}
