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
        <div className="group relative col-span-1 sm:col-span-2 overflow-hidden rounded-3xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-8 shadow-card transition-all duration-300 hover:border-foreground/25 hover:shadow-spatial hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-primary/10 text-primary mb-6 border border-border w-fit p-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Real-time Collaboration</h3>
            <p className="mt-4 text-muted-foreground max-w-md">Seamlessly sync state across all clients. See cursors, live edits, and Kanban updates with zero latency.</p>
            
            <div className="relative mt-8 h-48 w-full rounded-xl overflow-hidden border border-border bg-background/80">
               {/* Minimalist Kanban mock */}
               <div className="absolute inset-0 p-4 flex gap-4 opacity-80">
                 <div className="flex-1 rounded-lg border border-border bg-card p-3 space-y-3">
                   <div className="h-3 w-16 bg-foreground/20 rounded" />
                   <div className="h-12 w-full bg-primary/15 rounded-md border border-border" />
                   <div className="h-12 w-full bg-foreground/5 rounded-md border border-border" />
                 </div>
                 <div className="flex-1 rounded-lg border border-border bg-card p-3 space-y-3">
                   <div className="h-3 w-20 bg-emerald-500/40 rounded" />
                   <div className="h-12 w-full bg-emerald-500/10 rounded-md border border-border" />
                   <div className="h-12 w-full bg-foreground/5 rounded-md border border-border" />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Smart AI Notifications */}
        <div className="group relative col-span-1 overflow-hidden rounded-3xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-8 shadow-card transition-all duration-300 hover:border-foreground/25 hover:shadow-spatial hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-primary/10 text-primary mb-6 border border-border w-fit p-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Smart Notifications</h3>
            <p className="mt-4 text-muted-foreground">AI filters out the noise. Get pinged only when builds fail, PRs merge, or deadlines approach.</p>
            
            <div className="mt-auto pt-8">
              <div className="rounded-xl border border-border bg-card/90 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-sm font-medium text-foreground">Production deployed in 12s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Enterprise Security */}
        <div className="group relative col-span-1 overflow-hidden rounded-3xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-8 shadow-card transition-all duration-300 hover:border-foreground/25 hover:shadow-spatial hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-primary/10 text-primary mb-6 border border-border w-fit p-3">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Enterprise Grade</h3>
            <p className="mt-4 text-muted-foreground">End-to-end encryption for your team's code, secrets, and private discussions.</p>
            
            <div className="mt-auto pt-8">
               <div className="relative h-24 w-full rounded-xl border border-border bg-card/90 overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')" }} />
                 <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center bg-foreground/5 relative z-10 shadow-sm backdrop-blur-md">
                   <Shield className="h-6 w-6 text-foreground" />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 4: AI Project Insights */}
        <div className="group relative col-span-1 sm:col-span-2 overflow-hidden rounded-3xl border border-border bg-card/85 dark:bg-card/45 backdrop-blur-2xl p-8 shadow-card transition-all duration-300 hover:border-foreground/25 hover:shadow-spatial hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full">
            <div className="inline-flex rounded-xl bg-primary/10 text-primary mb-6 border border-border w-fit p-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">AI Project Insights</h3>
            <p className="mt-4 text-muted-foreground max-w-md">Your AI copilot automatically generates documentation, analyzes PRs, and builds pitch decks from your README.</p>
            
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card/90 p-4 w-fit">
              <Bot className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-mono text-foreground/90">Generating pitch deck slides...</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
