// Shared dummy data for Hackord

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

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;

export const CURRENT_USER: Member = {
  id: "u_me",
  name: "Aarav Sharma",
  username: "aarav",
  avatar: avatar("Aarav"),
  college: "IIT Bombay",
  city: "Mumbai",
  country: "India",
  skills: ["React", "Node.js", "UI/UX"],
  github: "https://github.com/aarav",
  linkedin: "https://linkedin.com/in/aarav",
  role: "Owner",
  status: "Online",
  experience: "Advanced",
};

export const MEMBERS: Member[] = [
  CURRENT_USER,
  { id: "u1", name: "Priya Nair", username: "priya", avatar: avatar("Priya"), college: "NIT Trichy", skills: ["Figma", "UI/UX"], github: "https://github.com/priya", linkedin: "#", role: "Designer", status: "Online", experience: "Intermediate" },
  { id: "u2", name: "Rohan Mehta", username: "rohan", avatar: avatar("Rohan"), college: "BITS Pilani", skills: ["Python", "AI/ML"], github: "https://github.com/rohan", linkedin: "#", role: "Lead", status: "Away", experience: "Advanced" },
  { id: "u3", name: "Ishita Rao", username: "ishita", avatar: avatar("Ishita"), college: "IIIT Hyderabad", skills: ["Node.js", "DevOps"], github: "https://github.com/ishita", linkedin: "#", role: "Developer", status: "Offline", experience: "Intermediate" },
];

export const DISCOVER_USERS: Member[] = [
  { id: "d1", name: "Kabir Singh", username: "kabir", avatar: avatar("Kabir"), college: "VIT Vellore", city: "Vellore", skills: ["Flutter", "Firebase"], github: "#", linkedin: "#", role: "Developer", status: "Online", experience: "Intermediate" },
  { id: "d2", name: "Ananya Iyer", username: "ananya", avatar: avatar("Ananya"), college: "MIT Manipal", city: "Manipal", skills: ["React", "Next.js"], github: "#", linkedin: "#", role: "Developer", status: "Online", experience: "Advanced" },
  { id: "d3", name: "Vivaan Kapoor", username: "vivaan", avatar: avatar("Vivaan"), college: "IIT Delhi", city: "Delhi", skills: ["Blockchain", "Solidity"], github: "#", linkedin: "#", role: "Developer", status: "Away", experience: "Advanced" },
  { id: "d4", name: "Meera Joshi", username: "meera", avatar: avatar("Meera"), college: "IIIT Bangalore", city: "Bangalore", skills: ["AI/ML", "Python"], github: "#", linkedin: "#", role: "Developer", status: "Online", experience: "Intermediate" },
  { id: "d5", name: "Aditya Verma", username: "aditya", avatar: avatar("Aditya"), college: "DTU", city: "Delhi", skills: ["DevOps", "Cyber Security"], github: "#", linkedin: "#", role: "Developer", status: "Offline", experience: "Advanced" },
  { id: "d6", name: "Sara Khan", username: "sara", avatar: avatar("Sara"), college: "NSUT", city: "Delhi", skills: ["UI/UX", "Figma"], github: "#", linkedin: "#", role: "Designer", status: "Online", experience: "Beginner" },
];

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

export const ROOMS: Room[] = [
  {
    id: "smart-india-2026",
    hackathon: "Smart India Hackathon 2026",
    name: "Team Nebula",
    problem: "AI-driven crop yield prediction for smallholder farmers using satellite imagery and IoT soil sensors.",
    maxSize: 6,
    members: MEMBERS,
    status: "Active",
    deadlines: {
      registration: "2026-08-01",
      ppt: "2026-08-15",
      prototype: "2026-09-01",
      final: "2026-09-20",
      result: "2026-10-05",
    },
    description:
      "Building an end-to-end platform that combines satellite data, on-ground IoT sensors, and an LLM-powered advisor to help smallholder farmers predict yields and optimize inputs.",
    progress: 62,
  },
  {
    id: "eth-global-2026",
    hackathon: "ETHGlobal Delhi",
    name: "ChainCraft",
    problem: "Decentralized reputation system for open-source contributors.",
    maxSize: 4,
    members: MEMBERS.slice(0, 3),
    status: "Planning",
    deadlines: {
      registration: "2026-07-25",
      ppt: "2026-08-05",
      prototype: "2026-08-20",
      final: "2026-09-01",
      result: "2026-09-10",
    },
    description: "On-chain contribution graphs with sybil-resistant scoring.",
    progress: 24,
  },
];

export type Invitation = {
  id: string;
  roomName: string;
  hackathon: string;
  sender: Member;
  message: string;
  time: string;
};

export const INVITATIONS: Invitation[] = [
  {
    id: "i1",
    roomName: "Pixel Pirates",
    hackathon: "HackMIT 2026",
    sender: DISCOVER_USERS[1],
    message: "Hi! We need a strong React dev for our AR shopping demo. Would love to have you.",
    time: "2h ago",
  },
  {
    id: "i2",
    roomName: "Quantum Loop",
    hackathon: "Google Solution Challenge",
    sender: DISCOVER_USERS[3],
    message: "Looking for someone with AI/ML experience — you'd be a great fit.",
    time: "1d ago",
  },
];

export type Notification = {
  id: string;
  type: "invite" | "meeting" | "chat" | "submission" | "github" | "member";
  title: string;
  detail: string;
  time: string;
  unread?: boolean;
};

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "invite", title: "New invitation", detail: "Ananya invited you to Pixel Pirates.", time: "2h ago", unread: true },
  { id: "n2", type: "meeting", title: "Meeting in 30 min", detail: "Team Nebula sync at 6:00 PM.", time: "3h ago", unread: true },
  { id: "n3", type: "submission", title: "PPT deadline tomorrow", detail: "Smart India Hackathon 2026", time: "5h ago" },
  { id: "n4", type: "chat", title: "New message", detail: "Rohan: Pushed the auth flow, please review.", time: "1d ago" },
  { id: "n5", type: "github", title: "Repository connected", detail: "team-nebula/farmyield linked to Team Nebula.", time: "2d ago" },
  { id: "n6", type: "member", title: "New member joined", detail: "Priya joined Team Nebula.", time: "3d ago" },
];

export type Message = {
  id: string;
  authorId: string;
  text: string;
  time: string;
  pinned?: boolean;
  code?: string;
};

export const MESSAGES: Message[] = [
  { id: "m1", authorId: "u2", text: "Kicked off the repo. Auth flow scaffolded 🚀", time: "10:12 AM", pinned: true },
  { id: "m2", authorId: "u_me", text: "Nice! I'll take the dashboard components.", time: "10:14 AM" },
  { id: "m3", authorId: "u1", text: "Uploaded the new mockups to Files.", time: "10:20 AM" },
  { id: "m4", authorId: "u3", text: "Deployed a preview:", time: "10:32 AM", code: "https://team-nebula.vercel.app" },
];

export type FileItem = {
  id: string;
  name: string;
  type: "pdf" | "ppt" | "zip" | "image" | "video" | "doc";
  size: string;
  uploadedBy: string;
  time: string;
};

export const FILES: FileItem[] = [
  { id: "f1", name: "Problem-Statement.pdf", type: "pdf", size: "1.2 MB", uploadedBy: "Rohan", time: "2d ago" },
  { id: "f2", name: "Pitch-Deck-v2.pptx", type: "ppt", size: "8.4 MB", uploadedBy: "Priya", time: "1d ago" },
  { id: "f3", name: "prototype.zip", type: "zip", size: "42 MB", uploadedBy: "Ishita", time: "6h ago" },
  { id: "f4", name: "architecture.png", type: "image", size: "540 KB", uploadedBy: "Aarav", time: "3h ago" },
  { id: "f5", name: "demo-clip.mp4", type: "video", size: "22 MB", uploadedBy: "Rohan", time: "1h ago" },
];

export type Task = {
  id: string;
  title: string;
  assignee: string;
  priority: "Low" | "Medium" | "High";
  deadline: string;
  status: "Todo" | "In Progress" | "Completed";
};

export const TASKS: Task[] = [
  { id: "t1", title: "Design onboarding screens", assignee: "Priya", priority: "High", deadline: "Aug 12", status: "In Progress" },
  { id: "t2", title: "Set up CI/CD", assignee: "Ishita", priority: "Medium", deadline: "Aug 10", status: "Todo" },
  { id: "t3", title: "Train yield prediction model v1", assignee: "Rohan", priority: "High", deadline: "Aug 18", status: "In Progress" },
  { id: "t4", title: "Landing page", assignee: "Aarav", priority: "Medium", deadline: "Aug 08", status: "Completed" },
  { id: "t5", title: "Write pitch script", assignee: "Priya", priority: "Low", deadline: "Aug 20", status: "Todo" },
  { id: "t6", title: "Integrate IoT sensor API", assignee: "Ishita", priority: "High", deadline: "Aug 14", status: "In Progress" },
  { id: "t7", title: "Prepare demo video", assignee: "Rohan", priority: "Medium", deadline: "Aug 22", status: "Todo" },
];

export const AI_TOOLS = [
  { key: "ppt", title: "Generate PPT", desc: "Turn your idea into a pitch-ready deck outline.", icon: "Presentation" },
  { key: "readme", title: "Generate README", desc: "Craft a polished README from your project details.", icon: "FileText" },
  { key: "workflow", title: "Workflow Diagram", desc: "Visualize user flows and system workflows.", icon: "Workflow" },
  { key: "validate", title: "Idea Validation", desc: "Stress-test your concept against market signals.", icon: "ShieldCheck" },
  { key: "stack", title: "Tech Stack", desc: "Get an opinionated stack for your build.", icon: "Layers" },
  { key: "tasks", title: "Task Breakdown", desc: "Turn goals into actionable tickets.", icon: "ListChecks" },
  { key: "arch", title: "Architecture Diagram", desc: "Sketch a high-level system architecture.", icon: "Network" },
  { key: "biz", title: "Business Model", desc: "Explore monetization and go-to-market.", icon: "Briefcase" },
  { key: "pitch", title: "Pitch Generator", desc: "Craft a winning judge-facing pitch.", icon: "Sparkles" },
  { key: "demo", title: "Demo Script", desc: "Storyboard a 3-minute demo.", icon: "Clapperboard" },
  { key: "elevator", title: "Elevator Pitch", desc: "60-second pitch, ready to memorize.", icon: "Rocket" },
] as const;

export const TIMELINE = [
  { key: "reg", label: "Registration", date: "Aug 01", status: "done" as const },
  { key: "idea", label: "Idea Freeze", date: "Aug 08", status: "done" as const },
  { key: "ppt", label: "PPT Submission", date: "Aug 15", status: "current" as const },
  { key: "proto", label: "Prototype", date: "Sep 01", status: "upcoming" as const },
  { key: "demo", label: "Demo Day", date: "Sep 15", status: "upcoming" as const },
  { key: "final", label: "Final Submission", date: "Sep 20", status: "upcoming" as const },
  { key: "result", label: "Result", date: "Oct 05", status: "upcoming" as const },
];

export const MEETINGS = {
  upcoming: [
    { id: "mt1", title: "Weekly sync", when: "Today · 6:00 PM", participants: 4 },
    { id: "mt2", title: "Design review", when: "Tomorrow · 4:00 PM", participants: 3 },
  ],
  past: [
    { id: "mp1", title: "Kickoff", when: "Aug 01 · 45 min", participants: 5 },
    { id: "mp2", title: "Sprint planning", when: "Aug 05 · 1 h 12 m", participants: 4 },
  ],
};

export const GITHUB_DATA = {
  repo: "team-nebula/farmyield",
  url: "https://github.com/team-nebula/farmyield",
  stars: 42,
  commits: [
    { sha: "a1b2c3d", msg: "feat: add IoT ingestion pipeline", author: "Ishita", time: "2h ago" },
    { sha: "e4f5g6h", msg: "fix: dashboard chart tooltip", author: "Aarav", time: "5h ago" },
    { sha: "i7j8k9l", msg: "docs: update README", author: "Priya", time: "1d ago" },
    { sha: "m0n1o2p", msg: "chore: bump deps", author: "Rohan", time: "2d ago" },
  ],
  prs: [
    { id: 24, title: "Add crop yield model v1", author: "Rohan", status: "Open" },
    { id: 23, title: "Refactor auth flow", author: "Aarav", status: "Open" },
  ],
  issues: [
    { id: 18, title: "Sensor data drops after 24h", author: "Ishita", status: "Open" },
    { id: 17, title: "Improve loading skeletons", author: "Priya", status: "Open" },
  ],
};
