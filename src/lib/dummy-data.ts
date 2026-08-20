// Shared constants for Hackord

export const SKILLS = [
  "React", "Next.js", "Flutter", "Node.js", "Express", "Python",
  "AI/ML", "Blockchain", "Solidity", "UI/UX", "Figma",
  "Cyber Security", "IoT", "DevOps", "Hardware",
];

export type Member = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  college: string;
  city?: string;
  country?: string;
  skills: string[];
  github: string;
  linkedin: string;
  role: "Owner" | "Lead" | "Developer" | "Designer";
  status: "Online" | "Away" | "Offline";
  experience: "Beginner" | "Intermediate" | "Advanced";
};

export const CURRENT_USER: Member | null = null;
export const MEMBERS: Member[] = [];
export const DISCOVER_USERS: Member[] = [];

export type Room = {
  id: string;
  hackathon: string;
  name: string;
  problem: string;
  maxSize: number;
  members: Member[];
  status: "Active" | "Planning" | "Submission";
  deadlines: {
    registration: string;
    ppt: string;
    prototype: string;
    final: string;
    result: string;
  };
  description: string;
  progress: number;
};

export const ROOMS: Room[] = [];

export const MESSAGES: any[] = [];
export const FILES: any[] = [];
export const TASKS: any[] = [];

export const AI_TOOLS = [
  { key: "image", title: "Generate Image", desc: "Generate photorealistic & artistic images using Google Imagen 3.", icon: "Image" },
  { key: "flowchart", title: "Flowchart Suite", desc: "Generate Process, Swimlane, DFD, Decision Tree, PERT & System Flowcharts.", icon: "Workflow" },
  { key: "chart", title: "Interactive Charts & Graphs", desc: "Generate live Area, Radar, Bar, Pareto, KPI, Pie, Sparkline & Geo Bubble charts.", icon: "BarChart3" },
  { key: "ppt", title: "Generate PPT", desc: "Turn your idea into a pitch-ready deck outline.", icon: "Presentation" },
  { key: "readme", title: "Generate README", desc: "Craft a polished README from your project details.", icon: "FileText" },
  { key: "workflow", title: "Workflow Diagram", desc: "Visualize user flows and cross-team swimlanes.", icon: "GitMerge" },
  { key: "arch", title: "Architecture Diagram", desc: "Sketch a high-level system architecture & data flow.", icon: "Network" },
  { key: "validate", title: "Idea Validation", desc: "Stress-test your concept against market signals.", icon: "ShieldCheck" },
  { key: "stack", title: "Tech Stack", desc: "Get an opinionated stack for your build.", icon: "Layers" },
  { key: "tasks", title: "Task Breakdown", desc: "Turn goals into actionable sprint tickets.", icon: "ListChecks" },
  { key: "biz", title: "Business Model", desc: "Explore monetization, revenue models, and GTM.", icon: "Briefcase" },
  { key: "pitch", title: "Pitch Generator", desc: "Craft a winning judge-facing hackathon pitch.", icon: "Sparkles" },
  { key: "demo", title: "Demo Script", desc: "Storyboard a 3-minute interactive product demo.", icon: "Clapperboard" },
  { key: "elevator", title: "Elevator Pitch", desc: "60-second pitch, ready to memorize.", icon: "Rocket" },
] as const;

export const TIMELINE: any[] = [];
export const MEETINGS: { upcoming: any[]; past: any[] } = { upcoming: [], past: [] };
export const GITHUB_DATA: any = null;
export const NOTIFICATIONS: any[] = [];
export const INVITATIONS: any[] = [];

export const DEMO_AUTH_USER: any = null;

export const DUMMY_DB_ROOMS: any[] = [];
export const DUMMY_NOTIFICATIONS: any[] = [];
export const DUMMY_INVITATIONS: any[] = [];
export const DUMMY_NOTES: any[] = [];
