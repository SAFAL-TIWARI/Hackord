import { useState, useEffect } from "react";
import { Users, Code, Bot, Zap, Shield, Sparkles } from "lucide-react";

const quotes = [
  { title: "Everything you need to", highlight: "win.", sub: "Professional grade tools wrapped in a beautiful interface." },
  { title: "Push the boundaries of", highlight: "possible.", sub: "Where brilliant ideas turn into reality." },
  { title: "Build the future with", highlight: "code.", sub: "Unleash your ultimate potential in every sprint." },
  { title: "Innovate, iterate, and", highlight: "conquer.", sub: "Take your hackathon project to the next level." }
];

export function FeaturesBento() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % quotes.length;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 pt-24 pb-32">
      <div className="mb-16 text-center relative h-[100px] sm:h-[120px]">
        {quotes.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i === prevIndex || (prevIndex === -1 && i !== 0);
          
          let stateClass = "opacity-0 translate-y-8 blur-md pointer-events-none"; 
          if (isCurrent) {
            stateClass = "opacity-100 translate-y-0 blur-0";
          } else if (isPast) {
            stateClass = "opacity-0 -translate-y-8 blur-md pointer-events-none";
          }

          return (
            <div
              key={i}
              className={`absolute inset-x-0 top-0 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${stateClass}`}
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
                {q.title} <span className="animate-text-shimmer">{q.highlight}</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground transition-opacity duration-1000">{q.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Feature 1: Wide Col (Real-time Collaboration) */}
        <div className="group relative col-span-1 sm:col-span-2 overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f25]/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:shadow-glow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-primary/20 p-3 text-primary mb-6 ring-1 ring-primary/30 w-fit">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">Real-time Collaboration</h3>
            <p className="mt-4 text-muted-foreground max-w-md">Seamlessly sync state across all clients. See cursors, live edits, and Kanban updates with zero latency.</p>
            
            <div className="relative mt-8 h-48 w-full rounded-xl overflow-hidden border border-white/5 bg-[#050816]">
               {/* Minimalist Kanban mock */}
               <div className="absolute inset-0 p-4 flex gap-4 opacity-70">
                 <div className="flex-1 rounded-lg border border-white/5 bg-white/5 p-3 space-y-3">
                   <div className="h-3 w-16 bg-white/20 rounded" />
                   <div className="h-12 w-full bg-primary/20 rounded-md border border-primary/30" />
                   <div className="h-12 w-full bg-white/10 rounded-md" />
                 </div>
                 <div className="flex-1 rounded-lg border border-white/5 bg-white/5 p-3 space-y-3">
                   <div className="h-3 w-20 bg-emerald-500/40 rounded" />
                   <div className="h-12 w-full bg-emerald-500/10 rounded-md border border-emerald-500/20" />
                   <div className="h-12 w-full bg-white/5 rounded-md border border-white/5" />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Smart AI Notifications */}
        <div className="group relative col-span-1 overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f25]/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-brand-2/20 hover:shadow-glow">
          <div className="absolute inset-0 bg-gradient-to-bl from-brand-2/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-brand-2/20 p-3 text-brand-2 mb-6 ring-1 ring-brand-2/30 w-fit">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Smart Notifications</h3>
            <p className="mt-4 text-muted-foreground">AI filters out the noise. Get pinged only when builds fail, PRs merge, or deadlines approach.</p>
            
            <div className="mt-auto pt-8">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-brand-2 animate-ping" />
                  <span className="text-sm text-foreground">Production deployed in 12s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Enterprise Security */}
        <div className="group relative col-span-1 overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f25]/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:shadow-glow">
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-white/10 p-3 text-white mb-6 ring-1 ring-white/20 w-fit">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Enterprise Grade</h3>
            <p className="mt-4 text-muted-foreground">End-to-end encryption for your team's code, secrets, and private discussions.</p>
            
            <div className="mt-auto pt-8">
               <div className="relative h-24 w-full rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')" }} />
                 <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md">
                   <Shield className="h-6 w-6 text-white" />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 4: AI Project Insights */}
        <div className="group relative col-span-1 sm:col-span-2 overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f25]/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-primary/20">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-primary/20 p-3 text-primary mb-6 ring-1 ring-primary/30 w-fit">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">AI Project Insights</h3>
            <p className="mt-4 text-muted-foreground max-w-md">Your AI copilot automatically generates documentation, analyzes PRs, and builds pitch decks from your README.</p>
            
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 w-fit">
              <Bot className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-mono text-primary/80">Generating pitch deck slides...</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
