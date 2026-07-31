import { MEMBERS } from "./dummy-data";

// ─── Types ─────────────────────────────────────────────────────────────────

export type DbRoom = {
  id: string;
  hackathon: string;
  name: string;
  problem: string;
  description: string;
  max_size: number;
  status: "Active" | "Planning" | "Submission";
  progress: number;
  deadline_registration: string;
  deadline_ppt: string;
  deadline_prototype: string;
  deadline_final: string;
  deadline_result: string;
  created_at: string;
  member_count?: number;
  members?: DbMember[];
};

export type DbMember = {
  user_id: string;
  user_name: string;
  user_avatar: string;
  role: string;
};

export type DbMessage = {
  id: string;
  room_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  pinned: boolean;
  created_at: string;
};

// ─── Initial Seed Data ─────────────────────────────────────────────────────

const DEFAULT_MEMBERS: DbMember[] = MEMBERS.map((m) => ({
  user_id: m.id,
  user_name: m.name,
  user_avatar: m.avatar,
  role: m.role,
}));

const INITIAL_ROOMS: DbRoom[] = [
  {
    id: "smart-india-2026",
    hackathon: "Smart India Hackathon 2026",
    name: "Team Nebula",
    problem: "AI-driven crop yield prediction for smallholder farmers using satellite imagery and IoT soil sensors.",
    description:
      "Building an end-to-end platform that combines satellite data, on-ground IoT sensors, and an LLM-powered advisor to help smallholder farmers predict yields and optimize inputs.",
    max_size: 6,
    status: "Active",
    progress: 62,
    deadline_registration: "2026-08-01",
    deadline_ppt: "2026-08-15",
    deadline_prototype: "2026-09-01",
    deadline_final: "2026-09-20",
    deadline_result: "2026-10-05",
    created_at: new Date("2026-07-01").toISOString(),
    member_count: DEFAULT_MEMBERS.length,
    members: DEFAULT_MEMBERS,
  },
  {
    id: "eth-global-2026",
    hackathon: "ETHGlobal Delhi 2026",
    name: "ChainCraft",
    problem: "Zero-knowledge privacy-preserving micro-payments for cross-border creator tipping.",
    description:
      "Developing a frictionless browser extension and smart contract suite utilizing ZK proofs for instant, private micro-donations.",
    max_size: 4,
    status: "Planning",
    progress: 25,
    deadline_registration: "2026-07-25",
    deadline_ppt: "2026-07-30",
    deadline_prototype: "2026-08-03",
    deadline_final: "2026-08-05",
    deadline_result: "2026-08-07",
    created_at: new Date("2026-07-05").toISOString(),
    member_count: 2,
    members: DEFAULT_MEMBERS.slice(0, 2),
  },
  {
    id: "devpost-ai-2026",
    hackathon: "AI Innovation Challenge 2026",
    name: "Synthetix AI",
    problem: "Autonomous multi-agent workflow engine for automated codebase refactoring and documentation.",
    description:
      "Creating an autonomous agent orchestrator that parses large enterprise codebases, runs dynamic test suites, and proposes optimized PRs.",
    max_size: 5,
    status: "Active",
    progress: 80,
    deadline_registration: "2026-07-30",
    deadline_ppt: "2026-08-05",
    deadline_prototype: "2026-08-12",
    deadline_final: "2026-08-20",
    deadline_result: "2026-09-01",
    created_at: new Date("2026-07-10").toISOString(),
    member_count: 3,
    members: DEFAULT_MEMBERS.slice(0, 3),
  },
];

const INITIAL_MESSAGES: DbMessage[] = [
  {
    id: "msg_1",
    room_id: "smart-india-2026",
    author_name: "Rohan Mehta",
    author_avatar: "https://api.dicebear.com/9.x/glass/svg?seed=Rohan",
    text: "Hey team! I just updated the ML model architecture in the repo. Precision is up to 94.2% on the validation set.",
    pinned: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "msg_2",
    room_id: "smart-india-2026",
    author_name: "Priya Nair",
    author_avatar: "https://api.dicebear.com/9.x/glass/svg?seed=Priya",
    text: "Awesome work Rohan! I'm wrapping up the dashboard Figma specs. Will share the component wireframes shortly.",
    pinned: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "msg_3",
    room_id: "smart-india-2026",
    author_name: "Aarav Sharma",
    author_avatar: "https://api.dicebear.com/9.x/glass/svg?seed=Aarav",
    text: "Great progress everyone! Reminder: PPT submission deadline is coming up. Let's aim for a mock deck presentation tomorrow.",
    pinned: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "msg_4",
    room_id: "eth-global-2026",
    author_name: "Aarav Sharma",
    author_avatar: "https://api.dicebear.com/9.x/glass/svg?seed=Aarav",
    text: "Welcome to ChainCraft workspace! Let me know when you've reviewed the ZK circuit specs.",
    pinned: true,
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

// ─── LocalStorage Persistence Engine ────────────────────────────────────────

const ROOMS_STORAGE_KEY = "forge_focus_rooms";
const MESSAGES_STORAGE_KEY = "forge_focus_messages";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function loadRoomsFromStorage(): DbRoom[] {
  if (!isBrowser()) return INITIAL_ROOMS;
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("[rooms-api] Error reading rooms from localStorage:", err);
    return INITIAL_ROOMS;
  }
}

function saveRoomsToStorage(rooms: DbRoom[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  } catch (err) {
    console.error("[rooms-api] Error saving rooms to localStorage:", err);
  }
}

function loadMessagesFromStorage(): DbMessage[] {
  if (!isBrowser()) return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("[rooms-api] Error reading messages from localStorage:", err);
    return INITIAL_MESSAGES;
  }
}

function saveMessagesToStorage(messages: DbMessage[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error("[rooms-api] Error saving messages to localStorage:", err);
  }
}

// ─── Function Wrappers for Client & Server Compatibility ───────────────────

export async function getRooms(): Promise<DbRoom[]> {
  return loadRoomsFromStorage();
}

export async function getRoom(params: { data: { roomId: string } }): Promise<DbRoom | null> {
  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === params.data.roomId);
  return room || null;
}

export async function createRoom(params: {
  data: {
    id: string;
    hackathon: string;
    name: string;
    problem?: string;
    description?: string;
    maxSize?: number;
    deadlineRegistration?: string;
    deadlinePpt?: string;
    deadlinePrototype?: string;
    deadlineFinal?: string;
    deadlineResult?: string;
  };
}): Promise<DbRoom> {
  const data = params.data;
  const rooms = loadRoomsFromStorage();

  const newRoom: DbRoom = {
    id: data.id,
    hackathon: data.hackathon,
    name: data.name,
    problem: data.problem || "",
    description: data.description || "",
    max_size: data.maxSize || 6,
    status: "Planning",
    progress: 0,
    deadline_registration: data.deadlineRegistration || "",
    deadline_ppt: data.deadlinePpt || "",
    deadline_prototype: data.deadlinePrototype || "",
    deadline_final: data.deadlineFinal || "",
    deadline_result: data.deadlineResult || "",
    created_at: new Date().toISOString(),
    member_count: 1,
    members: [
      {
        user_id: "u_me",
        user_name: "Aarav Sharma",
        user_avatar: "https://api.dicebear.com/9.x/glass/svg?seed=Aarav",
        role: "Owner",
      },
    ],
  };

  rooms.unshift(newRoom);
  saveRoomsToStorage(rooms);

  // Add welcome message for new room
  const messages = loadMessagesFromStorage();
  messages.push({
    id: `msg_${Date.now()}`,
    room_id: newRoom.id,
    author_name: "System Bot",
    author_avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=system",
    text: `🎉 Room "${newRoom.name}" has been created! Welcome to your private hackathon workspace.`,
    pinned: true,
    created_at: new Date().toISOString(),
  });
  saveMessagesToStorage(messages);

  return newRoom;
}

export async function getMessages(params: { data: { roomId: string } }): Promise<DbMessage[]> {
  const messages = loadMessagesFromStorage();
  return messages.filter((m) => m.room_id === params.data.roomId);
}

export async function getMessagesSince(params: {
  data: { roomId: string; since: string };
}): Promise<DbMessage[]> {
  const messages = loadMessagesFromStorage();
  const sinceTime = new Date(params.data.since).getTime();
  return messages.filter(
    (m) => m.room_id === params.data.roomId && new Date(m.created_at).getTime() > sinceTime,
  );
}

export async function sendMessage(params: {
  data: {
    roomId: string;
    text: string;
    authorName: string;
    authorAvatar?: string;
  };
}): Promise<DbMessage> {
  const data = params.data;
  const messages = loadMessagesFromStorage();

  const newMsg: DbMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    room_id: data.roomId,
    author_name: data.authorName,
    author_avatar: data.authorAvatar || "https://api.dicebear.com/9.x/glass/svg?seed=User",
    text: data.text,
    pinned: false,
    created_at: new Date().toISOString(),
  };

  messages.push(newMsg);
  saveMessagesToStorage(messages);
  return newMsg;
}
