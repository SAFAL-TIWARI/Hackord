import { apiFetch } from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────

export type DbMember = {
  user_id: string;
  user_name: string;
  user_avatar: string;
  role: string;
};

export type DbProjectLink = {
  label: string;
  url: string;
};

export type DbFileResource = {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  size: string;
  createdAt: string;
};

export type DbTask = {
  id: string;
  title: string;
  assignee: string;
  status: "Todo" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  deadline: string;
  createdAt?: string;
};

export type DbActivity = {
  id: string;
  who: string;
  what: string;
  when: string;
};

export type DbMessage = {
  id: string;
  room_id?: string;
  author_name: string;
  author_avatar: string;
  text: string;
  pinned: boolean;
  created_at: string;
  recipient_name?: string | null;
  reply_to?: string | null;
  edited?: boolean;
};

export type DbRoom = {
  creator_id: string;
  creator_name?: string;
  creator_email?: string;
  id: string;
  hackathon: string;
  name: string;
  problem: string;
  description: string;
  github_url?: string;
  meeting_code?: string;
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
  project_links?: DbProjectLink[];
  files?: DbFileResource[];
  tasks?: DbTask[];
  messages?: DbMessage[];
  activities?: DbActivity[];
};

// ─── User Helper ────────────────────────────────────────────────────────────

export function getLoggedInUser(): { id: string; name: string; email: string; avatar: string } {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem("hackord_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name) {
          return {
            id: u._id || u.id || "",
            name: u.name,
            email: u.email || "",
            avatar: u.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(u.name)}`,
          };
        }
      }
    } catch {}
  }
  return {
    id: "",
    name: "User",
    email: "",
    avatar: "",
  };
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export async function getRooms(params?: {
  userId?: string;
  email?: string;
  userName?: string;
  all?: boolean;
}): Promise<DbRoom[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.email) searchParams.set("email", params.email);
    if (params?.userName) searchParams.set("userName", params.userName);
    if (params?.all) searchParams.set("all", "true");

    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const backendRooms = await apiFetch<DbRoom[]>(`/rooms${queryStr}`);

    if (params?.userId || params?.email || params?.all) {
      return Array.isArray(backendRooms) ? backendRooms : [];
    }

    const localRooms = loadRoomsFromStorage();

    // Merge backend rooms with local rooms by ID
    const roomMap = new Map<string, DbRoom>();
    localRooms.forEach((r) => roomMap.set(r.id, r));
    if (Array.isArray(backendRooms)) {
      backendRooms.forEach((r) => roomMap.set(r.id, r));
    }

    const merged = Array.from(roomMap.values());
    saveRoomsToStorage(merged);
    return merged;
  } catch (err) {
    console.warn("[rooms-api] Backend unavailable, falling back to localStorage:", (err as Error)?.message || err);
    return loadRoomsFromStorage();
  }
}

export async function getRoom(params: { data: { roomId: string } }): Promise<DbRoom | null> {
  const roomId = params.data.roomId;
  try {
    const room = await apiFetch<DbRoom>(`/rooms/${roomId}`);
    if (room && room.id) {
      saveRoomToStorage(room);
      return room;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend getRoom failed, checking local storage:", (err as Error)?.message || err);
  }

  // Check localStorage
  const rooms = loadRoomsFromStorage();
  const found = rooms.find((r) => r.id === roomId || r.id?.toLowerCase() === roomId.toLowerCase());
  if (found) return found;

  // Fallback generated room if refreshed and not in DB/storage yet
  const formattedTitle = roomId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const defaultUser = getLoggedInUser();
  const generated: DbRoom = {
    id: roomId,
    hackathon: "Smart India Hackathon 2026",
    name: formattedTitle,
    problem: `Collaborative workspace for ${formattedTitle}`,
    description: `Building solution for ${formattedTitle}.`,
    max_size: 6,
    status: "Active",
    progress: 45,
    deadline_registration: "2026-08-15",
    deadline_ppt: "2026-08-30",
    deadline_prototype: "2026-09-10",
    deadline_final: "2026-09-25",
    deadline_result: "2026-10-05",
    created_at: new Date().toISOString(),
    members: [
      {
        user_id: defaultUser.id,
        user_name: defaultUser.name,
        user_avatar: defaultUser.avatar,
        role: "Owner",
      },
    ],
    creator_id: defaultUser.id || "system",
    creator_name: defaultUser.name,
    creator_email: defaultUser.email || ""
  };

  saveRoomToStorage(generated);
  return generated;
}

export async function createRoom(params: {
  data: {
    id?: string;
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
    projectLinks?: { label: string; url: string }[];
    creatorId?: string;
    creatorEmail?: string;
    creatorName?: string;
    creatorAvatar?: string;
  };
}): Promise<DbRoom> {
  const currentUser = getLoggedInUser();
  const requestPayload = {
    ...params.data,
    creatorId: params.data.creatorId || currentUser.id,
    creatorEmail: params.data.creatorEmail || currentUser.email,
    creatorName: params.data.creatorName || currentUser.name,
    creatorAvatar: params.data.creatorAvatar || currentUser.avatar,
  };

  let created: DbRoom | null = null;
  try {
    created = await apiFetch<DbRoom>("/rooms", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
  } catch (err) {
    console.warn("[rooms-api] Backend failed, creating room locally", err);
  }

  if (!created) {
    created = createRoomLocally(requestPayload);
  } else {
    saveRoomToStorage(created);
  }

  return created;
}

export async function updateRoom(params: {
  roomId: string;
  data: Partial<DbRoom>;
}): Promise<DbRoom> {
  const currentUser = getLoggedInUser();
  try {
    const updated = await apiFetch<DbRoom>(`/rooms/${params.roomId}`, {
      method: "PUT",
      body: JSON.stringify({ ...params.data, updatedBy: currentUser.name.split(" ")[0] }),
    });
    if (updated) {
      saveRoomToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend update failed, updating local storage", err);
  }

  const rooms = loadRoomsFromStorage();
  const index = rooms.findIndex((r) => r.id === params.roomId);
  if (index !== -1) {
    rooms[index] = { ...rooms[index], ...params.data };
    saveRoomsToStorage(rooms);
    return rooms[index];
  }
  throw new Error("Room not found");
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  try {
    await apiFetch(`/rooms/${roomId}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("[rooms-api] Backend delete failed, removing from local storage", err);
  }

  // Remove from localStorage
  const rooms = loadRoomsFromStorage();
  const filtered = rooms.filter((r) => r.id !== roomId && r.id?.toLowerCase() !== roomId.toLowerCase());
  saveRoomsToStorage(filtered);
  return true;
}

export async function getMessages(params: { data: { roomId: string } }): Promise<DbMessage[]> {
  try {
    const messages = await apiFetch<DbMessage[]>(`/rooms/${params.data.roomId}/messages`);
    return messages;
  } catch (err) {
    return loadMessagesFromStorage().filter((m) => m.room_id === params.data.roomId);
  }
}

export async function getMessagesSince(params: {
  data: { roomId: string; since: string };
}): Promise<DbMessage[]> {
  try {
    const messages = await apiFetch<DbMessage[]>(
      `/rooms/${params.data.roomId}/messages?since=${encodeURIComponent(params.data.since)}`
    );
    return messages;
  } catch (err) {
    const messages = loadMessagesFromStorage();
    const sinceTime = new Date(params.data.since).getTime();
    return messages.filter(
      (m) => m.room_id === params.data.roomId && new Date(m.created_at).getTime() > sinceTime,
    );
  }
}

export async function sendMessage(params: {
  data: {
    roomId: string;
    text: string;
    authorName?: string;
    authorAvatar?: string;
    recipientName?: string | null;
    replyTo?: string | null;
  };
}): Promise<DbMessage> {
  const currentUser = getLoggedInUser();
  const payload = {
    roomId: params.data.roomId,
    text: params.data.text,
    authorName: params.data.authorName || currentUser.name,
    authorAvatar: params.data.authorAvatar || currentUser.avatar,
    recipientName: params.data.recipientName || null,
    replyTo: params.data.replyTo || null,
  };

  try {
    const msg = await apiFetch<DbMessage>(`/rooms/${params.data.roomId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return msg;
  } catch (err) {
    return sendMessageLocally(payload);
  }
}

export async function addFileResource(params: {
  roomId: string;
  name: string;
  url: string;
  type?: string;
  uploadedBy?: string;
}): Promise<DbFileResource> {
  const currentUser = getLoggedInUser();
  const payload = {
    ...params,
    uploadedBy: params.uploadedBy || currentUser.name,
  };

  try {
    const file = await apiFetch<DbFileResource>(`/rooms/${params.roomId}/files`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return file;
  } catch (err) {
    return {
      id: `file_${Date.now()}`,
      name: params.name,
      url: params.url,
      type: params.type || "link",
      uploadedBy: payload.uploadedBy,
      size: "External Link",
      createdAt: new Date().toISOString(),
    };
  }
}

export async function addTask(params: {
  roomId: string;
  title: string;
  assignee?: string;
  priority?: "Low" | "Medium" | "High";
  deadline?: string;
}): Promise<DbTask> {
  const currentUser = getLoggedInUser();
  const payload = {
    ...params,
    assignee: params.assignee || currentUser.name,
  };

  let newTask: DbTask | null = null;
  try {
    newTask = await apiFetch<DbTask>(`/rooms/${params.roomId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("[rooms-api] Backend addTask failed, adding locally", err);
    newTask = {
      id: `task_${Date.now()}`,
      title: params.title,
      assignee: payload.assignee,
      status: "Todo",
      priority: params.priority || "Medium",
      deadline: params.deadline || "Upcoming",
    };
  }

  // Update local storage room so UI and progress are saved locally as well
  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === params.roomId || r.id?.toLowerCase() === params.roomId.toLowerCase());
  if (room) {
    if (!room.tasks) room.tasks = [];
    if (!room.tasks.some((t) => t.id === newTask!.id)) {
      room.tasks.push(newTask!);
    }
    const completed = room.tasks.filter((tk) => tk.status === "Completed").length;
    room.progress = room.tasks.length > 0 ? Math.round((completed / room.tasks.length) * 100) : 0;
    saveRoomsToStorage(rooms);
  }

  return newTask!;
}

export async function updateTaskStatus(params: {
  roomId: string;
  taskId: string;
  status: "Todo" | "In Progress" | "Completed";
}): Promise<DbRoom> {
  try {
    const updated = await apiFetch<DbRoom>(`/rooms/${params.roomId}/tasks/${params.taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: params.status }),
    });
    if (updated) {
      saveRoomToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend task status update failed, updating locally", err);
  }

  // Local fallback
  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === params.roomId || r.id?.toLowerCase() === params.roomId.toLowerCase());
  if (room && room.tasks) {
    const t = room.tasks.find((task) => task.id === params.taskId);
    if (t) {
      t.status = params.status;
      const completed = room.tasks.filter((tk) => tk.status === "Completed").length;
      room.progress = room.tasks.length > 0 ? Math.round((completed / room.tasks.length) * 100) : 0;
      if (!room.activities) room.activities = [];
      const user = getLoggedInUser();
      room.activities.unshift({
        id: `act_${Date.now()}`,
        who: user.name.split(" ")[0],
        what: `moved task "${t.title}" → ${params.status}`,
        when: new Date().toISOString(),
      });
      saveRoomsToStorage(rooms);
      return room;
    }
  }
  throw new Error("Task not found");
}

export async function deleteTask(params: {
  roomId: string;
  taskId: string;
}): Promise<DbRoom> {
  try {
    const updated = await apiFetch<DbRoom>(`/rooms/${params.roomId}/tasks/${params.taskId}`, {
      method: "DELETE",
    });
    if (updated) {
      saveRoomToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend deleteTask failed, updating locally", err);
  }

  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === params.roomId || r.id?.toLowerCase() === params.roomId.toLowerCase());
  if (room && room.tasks) {
    const idx = room.tasks.findIndex((t) => t.id === params.taskId);
    if (idx !== -1) {
      const removed = room.tasks.splice(idx, 1)[0];
      const completed = room.tasks.filter((tk) => tk.status === "Completed").length;
      room.progress = room.tasks.length > 0 ? Math.round((completed / room.tasks.length) * 100) : 0;
      saveRoomsToStorage(rooms);
      return room;
    }
  }
  throw new Error("Task not found");
}

export async function addProjectLink(params: {
  roomId: string;
  label: string;
  url: string;
}): Promise<DbRoom> {
  try {
    const updated = await apiFetch<DbRoom>(`/rooms/${params.roomId}/links`, {
      method: "POST",
      body: JSON.stringify(params),
    });
    if (updated) {
      saveRoomToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend add link failed, updating locally", err);
  }

  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === params.roomId);
  if (room) {
    if (!room.project_links) room.project_links = [];
    room.project_links.push({ label: params.label, url: params.url });
    saveRoomsToStorage(rooms);
    return room;
  }
  throw new Error("Room not found");
}

export async function addMemberToRoom(params: {
  roomId: string;
  user_name: string;
  user_avatar?: string;
  role?: string;
}): Promise<DbRoom> {
  try {
    const updated = await apiFetch<DbRoom>(`/rooms/${params.roomId}/members`, {
      method: "POST",
      body: JSON.stringify(params),
    });
    if (updated) {
      saveRoomToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend add member failed, updating locally", err);
  }

  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === params.roomId);
  if (room) {
    if (!room.members) room.members = [];
    room.members.push({
      user_id: `u_${Date.now()}`,
      user_name: params.user_name,
      user_avatar: params.user_avatar || "https://api.dicebear.com/9.x/glass/svg?seed=User",
      role: params.role || "Contributor",
    });
    saveRoomsToStorage(rooms);
    return room;
  }
  throw new Error("Room not found");
}

// ─── Local Fallbacks ─────────────────────────────────────────────────────────

const ROOMS_STORAGE_KEY = "forge_focus_rooms";
const MESSAGES_STORAGE_KEY = "forge_focus_messages";

function loadRoomsFromStorage(): DbRoom[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRoomsToStorage(rooms: DbRoom[]): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  } catch {}
}

function saveRoomToStorage(room: DbRoom): void {
  const rooms = loadRoomsFromStorage();
  const index = rooms.findIndex((r) => r.id === room.id);
  if (index !== -1) {
    rooms[index] = room;
  } else {
    rooms.unshift(room);
  }
  saveRoomsToStorage(rooms);
}

function loadMessagesFromStorage(): DbMessage[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessagesToStorage(messages: DbMessage[]): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

function createRoomLocally(data: any): DbRoom {
  const rooms = loadRoomsFromStorage();
  const links = Array.isArray(data.projectLinks) ? data.projectLinks.filter((l: any) => l.url) : [];
  const currentUser = getLoggedInUser();
  const ownerId = data.creatorId || currentUser.id || `u_${Date.now()}`;
  const ownerEmail = data.creatorEmail || currentUser.email || "";
  const ownerName = data.creatorName || currentUser.name || "Owner";
  const ownerAvatar = data.creatorAvatar || currentUser.avatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(ownerName)}`;

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
    project_links: links,
    created_at: new Date().toISOString(),
    member_count: 1,
    members: [
      {
        user_id: ownerId,
        user_name: ownerName,
        user_avatar: ownerAvatar,
        role: "Owner",
      },
    ],
    files: [],
    tasks: [],
    activities: [
      { id: `act_${Date.now()}`, who: ownerName.split(" ")[0], what: `created room "${data.name}"`, when: new Date().toISOString() },
    ],
    creator_id: ownerId,
    creator_email: ownerEmail,
  };

  rooms.unshift(newRoom);
  saveRoomsToStorage(rooms);
  return newRoom;
}

export async function removeMemberFromRoom(params: {
  roomId: string;
  userId: string;
  removedBy?: string;
}): Promise<DbRoom | null> {
  const { roomId, userId, removedBy } = params;
  try {
    const updated = await apiFetch<DbRoom>(`/rooms/${roomId}/members/${userId}`, {
      method: "DELETE",
      body: JSON.stringify({ removedBy: removedBy || getLoggedInUser().name.split(" ")[0] }),
    });
    if (updated) {
      saveRoomToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("[rooms-api] Backend removeMember failed, updating locally", err);
  }

  // Fallback local update
  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === roomId);
  if (room && room.members) {
    const idx = room.members.findIndex((m) => m.user_id === userId || m.user_name === userId);
    if (idx !== -1) {
      const removed = room.members.splice(idx, 1)[0];
      if (!room.activities) room.activities = [];
      room.activities.unshift({
        id: `act_${Date.now()}`,
        who: removedBy || getLoggedInUser().name.split(" ")[0],
        what: `removed ${removed.user_name} from team`,
        when: new Date().toISOString(),
      });
      saveRoomsToStorage(rooms);
    }
    return room;
  }
  return null;
}

function sendMessageLocally(data: any): DbMessage {
  const messages = loadMessagesFromStorage();
  const newMsg: DbMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    room_id: data.roomId,
    author_name: data.authorName,
    author_avatar: data.authorAvatar || "https://api.dicebear.com/9.x/glass/svg?seed=User",
    text: data.text,
    pinned: false,
    created_at: new Date().toISOString(),
    recipient_name: data.recipientName || null,
    reply_to: data.replyTo || null,
    edited: false,
  };
  messages.push(newMsg);
  saveMessagesToStorage(messages);
  return newMsg;
}

export async function updateMessage(params: {
  roomId: string;
  messageId: string;
  data: { text?: string; pinned?: boolean };
}): Promise<DbMessage> {
  try {
    const msg = await apiFetch<DbMessage>(`/rooms/${params.roomId}/messages/${params.messageId}`, {
      method: "PUT",
      body: JSON.stringify(params.data),
    });
    return msg;
  } catch (err) {
    const messages = loadMessagesFromStorage();
    const msg = messages.find((m) => m.id === params.messageId);
    if (msg) {
      if (params.data.text !== undefined) {
        msg.text = params.data.text;
        msg.edited = true;
      }
      if (params.data.pinned !== undefined) {
        msg.pinned = params.data.pinned;
      }
      saveMessagesToStorage(messages);
      return msg;
    }
    throw err;
  }
}

export async function deleteMessage(params: {
  roomId: string;
  messageId: string;
}): Promise<{ message: string; id: string }> {
  try {
    const res = await apiFetch<{ message: string; id: string }>(
      `/rooms/${params.roomId}/messages/${params.messageId}`,
      { method: "DELETE" }
    );
    return res;
  } catch (err) {
    const messages = loadMessagesFromStorage();
    const idx = messages.findIndex((m) => m.id === params.messageId);
    if (idx !== -1) {
      messages.splice(idx, 1);
      saveMessagesToStorage(messages);
      return { message: "Deleted locally", id: params.messageId };
    }
    throw err;
  }
}

export async function getAgoraToken(roomId: string): Promise<{
  token: string;
  appId: string;
  channelName?: string;
  warning?: string;
}> {
  return apiFetch<{ token: string; appId: string; channelName?: string; warning?: string }>(`/rooms/${roomId}/token`);
}

export async function leaveRoom(roomId: string, user: { id?: string; email?: string; name?: string }): Promise<boolean> {
  try {
    await apiFetch(`/rooms/${roomId}/leave`, {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      }),
    });
  } catch (err) {
    console.warn("[rooms-api] Backend leaveRoom failed, updating locally:", err);
  }

  // Remove member from local storage
  const rooms = loadRoomsFromStorage();
  const room = rooms.find((r) => r.id === roomId);
  if (room && room.members) {
    const idx = room.members.findIndex(
      (m) =>
        (user.id && m.user_id === user.id) ||
        (user.email && m.user_id === user.email) ||
        (user.name && m.user_name === user.name)
    );
    if (idx !== -1) {
      room.members.splice(idx, 1);
      saveRoomsToStorage(rooms);
    }
  }
  return true;
}
