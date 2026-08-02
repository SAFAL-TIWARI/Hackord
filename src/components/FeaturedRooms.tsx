import { Link } from "@tanstack/react-router";
import { Layers3, ArrowUpRight, Plus } from "lucide-react";
import { SpotlightCard } from "@/components/SpotlightCard";

export function FeaturedRooms() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Layers3 className="h-3.5 w-3.5" />
            <span>Live Workspace Preview</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Featured Hackathon Rooms</h2>
          <p className="text-sm text-muted-foreground mt-1">Join an active project team or create your own room in seconds.</p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <span>View all rooms in Dashboard</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Box 1: CREATE NEW ROOM CARD */}
        <SpotlightCard className="group relative flex flex-col justify-between rounded-2xl border-2 border-dashed border-primary/30 bg-card/30 p-6 transition-all duration-300 hover:border-primary hover:bg-card/60 hover:shadow-glow cursor-pointer">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow transition-transform duration-300 group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary transition-colors">+ Create New Room</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Start a team workspace for your next hackathon. Set project goals, invite teammates, and auto-generate pitch decks.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary ring-1 ring-primary/20 transition-all hover:bg-primary hover:text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Room Now</span>
          </Link>
        </SpotlightCard>

        {/* Box 2: ROOM CARD - CyberPulse AI */}
        <SpotlightCard className="flex flex-col justify-between rounded-2xl bg-card/40 p-6 border border-white/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                ● Active Sprint
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">ETH Global</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-foreground">CyberPulse AI</h3>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              Voice-enabled pair programming copilot for hackathon teams.
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-mono text-emerald-400">75% Built</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
            </div>
            <Link
              to="/dashboard"
              className="rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
            >
              Join Room →
            </Link>
          </div>
        </SpotlightCard>

        {/* Box 3: ROOM CARD - Team Nexus */}
        <SpotlightCard className="flex flex-col justify-between rounded-2xl bg-card/40 p-6 border border-white/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                🏆 1st Place
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">HackVerse '26</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-foreground">Team Nexus</h3>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              Decentralized real-time collaboration workspace with AI docs.
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-mono text-amber-300">90% Complete</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: "90%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
              <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
              <img src="https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
            </div>
            <Link
              to="/dashboard"
              className="rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
            >
              View Room →
            </Link>
          </div>
        </SpotlightCard>

        {/* Box 4: ROOM CARD - DevForge */}
        <SpotlightCard className="flex flex-col justify-between rounded-2xl bg-card/40 p-6 border border-white/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                💡 Brainstorming
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">HackMIT</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-foreground">DevForge Studio</h3>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              Automated pitch deck generator for hackathon final presentations.
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-mono text-purple-400">45% In Progress</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" style={{ width: "45%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
              <img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100" className="h-7 w-7 rounded-full ring-2 ring-background object-cover" />
            </div>
            <Link
              to="/dashboard"
              className="rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
            >
              Join Room →
            </Link>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
