import { apiFetch } from "./api";

export type DbChatMessage = {
  id: string;
  chatType: "general" | "direct";
  author_id: string;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  recipient_id?: string | null;
  recipient_name?: string | null;
  recipient_username?: string | null;
  recipient_avatar?: string | null;
  text: string;
  audio_url?: string | null;
  audio_duration?: number;
  pinned?: boolean;
  edited?: boolean;
  is_important?: boolean;
  reply_to?: {
    id: string;
    text: string;
    author_name: string;
    chatType?: string;
  } | null;
  read_by?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ConversationItem = {
  id: string;
  chatType: "general" | "direct";
  otherUserId?: string;
  name: string;
  username?: string;
  subtitle?: string;
  avatar?: string;
  unreadCount: number;
  lastMessageText?: string;
  lastMessageAt?: string | null;
  isPinnedTop?: boolean;
  isOnline?: boolean;
  allowDirectMessages?: boolean;
};

export type ConversationsResponse = {
  general: ConversationItem;
  direct: ConversationItem[];
};

export async function getChatMessages(params: {
  chatType?: "general" | "direct";
  otherUserId?: string;
  userId?: string;
}): Promise<DbChatMessage[]> {
  const query = new URLSearchParams();
  if (params.chatType) query.set("chatType", params.chatType);
  if (params.otherUserId) query.set("otherUserId", params.otherUserId);
  if (params.userId) query.set("userId", params.userId);

  return apiFetch<DbChatMessage[]>(`/chat/messages?${query.toString()}`);
}

export async function sendChatMessage(data: {
  chatType?: "general" | "direct";
  author_id: string;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_username?: string;
  recipient_avatar?: string;
  text: string;
  audio_url?: string;
  audio_duration?: number;
  reply_to?: { id: string; text: string; author_name: string } | null;
}): Promise<DbChatMessage> {
  return apiFetch<DbChatMessage>("/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateChatMessage(
  messageId: string,
  data: { text?: string; pinned?: boolean }
): Promise<DbChatMessage> {
  return apiFetch<DbChatMessage>(`/chat/messages/${messageId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteChatMessage(messageId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/chat/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function getConversations(userId: string): Promise<ConversationsResponse> {
  return apiFetch<ConversationsResponse>(`/chat/conversations?userId=${encodeURIComponent(userId)}`);
}

export async function markChatRead(data: {
  userId: string;
  chatType: "general" | "direct";
  otherUserId?: string;
}): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/chat/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteConversation(userId: string, otherUserId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/chat/conversations/${encodeURIComponent(otherUserId)}?userId=${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    }
  );
}
