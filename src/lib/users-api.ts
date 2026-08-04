import { apiFetch } from "./api";

export type DbUser = {
  _id: string;
  name: string;
  email?: string;
  username: string;
  avatar: string;
  college?: string;
  city?: string;
  country?: string;
  bio?: string;
  experience?: "Beginner" | "Intermediate" | "Advanced";
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  role?: string;
};

export type DbInvitation = {
  _id: string;
  id?: string;
  sender: {
    user_id: string;
    name: string;
    avatar: string;
    email?: string;
  };
  recipient: {
    user_id: string;
    name: string;
    avatar: string;
    email?: string;
  };
  roomId: string;
  roomName: string;
  hackathon: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export async function searchUsers(
  query: string = "",
  options?: { excludeId?: string; excludeEmail?: string }
): Promise<DbUser[]> {
  try {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (options?.excludeId) params.set("excludeId", options.excludeId);
    if (options?.excludeEmail) params.set("excludeEmail", options.excludeEmail);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<DbUser[]>(`/users/search${queryStr}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to search users:", err);
    return [];
  }
}

export async function getUserById(id: string): Promise<DbUser | null> {
  try {
    return await apiFetch<DbUser>(`/users/${encodeURIComponent(id)}`);
  } catch (err) {
    console.error("Failed to get user details:", err);
    return null;
  }
}

export async function sendRoomInvitation(payload: {
  recipientId: string;
  roomId: string;
  message?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
}): Promise<DbInvitation> {
  return await apiFetch<DbInvitation>("/invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPendingInvitations(params?: {
  userId?: string;
  email?: string;
}): Promise<DbInvitation[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.email) searchParams.set("email", params.email);

    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const data = await apiFetch<any[]>(`/invitations/me${queryStr}`);
    if (Array.isArray(data)) {
      return data.map((inv: any) => ({
        ...inv,
        id: inv._id || inv.id,
      }));
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch invitations:", err);
    return [];
  }
}

export async function acceptRoomInvitation(target: string | { invitationId?: string; id?: string }) {
  const invitationId = typeof target === "string" ? target : (target?.invitationId || target?.id);
  if (!invitationId || invitationId === "undefined" || invitationId === "null") {
    throw new Error("Invalid invitation ID");
  }
  return await apiFetch<{ message: string; invitation: DbInvitation }>(
    `/invitations/${invitationId}/accept`,
    { method: "POST" }
  );
}

export async function rejectRoomInvitation(target: string | { invitationId?: string; id?: string }) {
  const invitationId = typeof target === "string" ? target : (target?.invitationId || target?.id);
  if (!invitationId || invitationId === "undefined" || invitationId === "null") {
    throw new Error("Invalid invitation ID");
  }
  return await apiFetch<{ message: string; invitation: DbInvitation }>(
    `/invitations/${invitationId}/reject`,
    { method: "POST" }
  );
}

export type UserSettings = {
  notificationPreferences: {
    emailEnabled: boolean;
    roomInvites: boolean;
    deadlines: boolean;
    chatMessages: boolean;
    reminders: boolean;
  };
  privacySettings: {
    discoverable: boolean;
    allowInvites: boolean;
    showEmail: boolean;
    activityStatus: boolean;
  };
};

export async function getUserSettings(params?: { userId?: string; email?: string }): Promise<UserSettings> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.email) searchParams.set("email", params.email);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return await apiFetch<UserSettings>(`/users/settings${queryStr}`);
  } catch (err) {
    console.error("Failed to fetch user settings:", err);
    return {
      notificationPreferences: {
        emailEnabled: true,
        roomInvites: true,
        deadlines: true,
        chatMessages: true,
        reminders: false,
      },
      privacySettings: {
        discoverable: true,
        allowInvites: true,
        showEmail: true,
        activityStatus: true,
      },
    };
  }
}

export async function updateUserSettings(payload: Partial<UserSettings> & { userId?: string; email?: string }): Promise<UserSettings> {
  return await apiFetch<UserSettings>("/users/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUserAccount(params?: { userId?: string; email?: string }): Promise<{ message: string }> {
  return await apiFetch<{ message: string }>("/users/me", {
    method: "DELETE",
    body: JSON.stringify(params || {}),
  });
}

