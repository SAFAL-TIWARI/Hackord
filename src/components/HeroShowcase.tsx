import React from "react";
import { Bot, GitMerge, LayoutDashboard, Activity, CheckCircle2, ChevronRight } from "lucide-react";

export function HeroShowcase() {
  return (
    <div className="relative h-[500px] w-full perspective-[1200px] hidden lg:block">
      {/* Ambient background glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-brand blur-[120px] opacity-40 animate-pulse-glow" />

      {/* Card 1: AI Assistant (Floating top right) */}
      <div className="absolute right-[5%] top-[10%] w-72 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 shadow-2xl animate-float [transform:rotateY(-15deg)_rotateX(10deg)] z-30">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Project Lead</span>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-background/50 p-3 text-xs text-muted-foreground border border-white/5">
            <p>Analyzing architecture... <br/><span className="text-primary mt-1 inline-block">Suggestion:</span> Use Redis for real-time state sync.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-full rounded bg-primary/20 animate-pulse" />
            <div className="h-6 w-6 rounded bg-primary/20 shrink-0" />
          </div>
        </div>
      </div>

      {/* Card 2: GitHub Integration (Floating bottom left) */}
      <div className="absolute left-[0%] bottom-[15%] w-80 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 shadow-2xl animate-float-delayed [transform:rotateY(10deg)_rotateX(5deg)] z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-emerald-500/20 flex items-center justify-center">
              <GitMerge className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm font-medium">Pull Requests</span>
          </div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
        <div className="space-y-2">
          {[
            { msg: "feat: AI integration", time: "2m ago", status: "emerald" },
            { msg: "fix: websockets disconnect", time: "15m ago", status: "emerald" },
            { msg: "refactor: auth flow", time: "1h ago", status: "blue" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-xs text-foreground font-mono">{item.msg}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
                <CheckCircle2 className={`h-3 w-3 text-${item.status}-500`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Live Metrics (Center Back) */}
      <div className="absolute left-[15%] top-[5%] w-64 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-5 shadow-xl animate-float [transform:translateZ(-100px)_rotateY(-5deg)] z-10 opacity-80">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-[#38BDF8]" />
          <span className="text-sm font-medium">Sprint Velocity</span>
        </div>
        <div className="flex items-end gap-2 h-20">
          {[40, 70, 45, 90, 65, 100].map((h, i) => (
            <div key={i} className="w-full bg-[#38BDF8]/20 rounded-t-sm transition-all duration-1000 relative group">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-[#38BDF8]/40 to-[#38BDF8] rounded-t-sm" 
                style={{ height: `${h}%` }} 
              />
            </div>
          ))}
        </div>
      </div>
      {/* Card 4: Deployment Status (Floating bottom right) */}
      <div className="absolute right-[15%] bottom-[15%] rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-4 shadow-2xl animate-float-delayed [transform:rotateY(-5deg)_rotateX(5deg)] z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="text-sm font-medium text-foreground">Production deployed</span>
        </div>
      </div>
      
      {/* Central Connector Lines (Stylistic) */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20" style={{ zIndex: 15 }}>
        <path d="M150 200 Q 300 150 450 300" stroke="currentColor" fill="none" strokeWidth="2" strokeDasharray="4 4" className="text-primary animate-pulse" />
      </svg>
    </div>
  );
}
