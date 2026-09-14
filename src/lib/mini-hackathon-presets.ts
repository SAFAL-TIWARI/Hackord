export interface MiniHackathonPreset {
  name: string;
  organizer: string;
  roomName: string;
  problem: string;
  duration: string;
  venue: string;
  mode: "Online" | "Offline" | "Hybrid";
  schedule: string;
  submissionChecklist: string[];
  description: string;
  tags: string[];
  prizePool: string;
  prizePoolUSD: number;
  banner: string;
}

export const SINGLE_MINI_HACKATHON_PRESET: MiniHackathonPreset = {
  name: "AI Agents Flash Sprint 2026",
  organizer: "Antigravity AI Collective",
  roomName: "Autonomous Agent Builders",
  problem:
    "Build and deploy an autonomous AI agent capable of executing real-world multi-step workflows in under 6 hours.",
  duration: "6 hours",
  venue: "Online (Discord Stage & Zoom)",
  mode: "Online",
  schedule: `09:00 AM – 09:30 AM | Check-in & Team Registration
09:30 AM – 10:00 AM | Kickoff & Problem Statement Reveal
10:00 AM | Hacking Begins! 🚀
01:00 PM – 01:45 PM | Mid-Sprint Lunch & Mentor Checkpoints
04:00 PM | Code Freeze & Submission Deadline
04:15 PM – 05:30 PM | Live 3-Minute Demos & Technical Q&A
05:30 PM – 06:00 PM | Closing Ceremony & Winner Announcements`,
  submissionChecklist: [
    "Project name & tagline",
    "Problem statement & target persona",
    "System architecture & prompt/agent workflow",
    "GitHub repository (clean commits & open README)",
    "Live working demo or deployed URL",
    "2-minute demo video or slide walkthrough",
    "API keys & environment setup instructions",
  ],
  description:
    "An intensive 6-hour sprint for building autonomous AI agents, tool-augmented LLMs, and multi-modal assistants.",
  tags: ["Mini/1-Day Hackathon", "AI", "LLM", "Open Source"],
  prizePool: "₹75,000 Cash + Cloud Credits",
  prizePoolUSD: 1000,
  banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
};

export const MINI_HACKATHON_PRESETS: MiniHackathonPreset[] = [SINGLE_MINI_HACKATHON_PRESET];

/**
 * Returns the single demo preset for 1-day mini hackathons.
 */
export function getSingleMiniHackathonPreset(): MiniHackathonPreset {
  return SINGLE_MINI_HACKATHON_PRESET;
}

export function getRandomMiniHackathonPreset(): MiniHackathonPreset {
  return SINGLE_MINI_HACKATHON_PRESET;
}

export const DEFAULT_MINI_HACKATHON_SCHEDULE = SINGLE_MINI_HACKATHON_PRESET.schedule;
export const DEFAULT_MINI_HACKATHON_CHECKLIST = SINGLE_MINI_HACKATHON_PRESET.submissionChecklist.join("\n");
