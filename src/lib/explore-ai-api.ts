import { apiFetch } from "./api";
import type { Hackathon } from "./hackathon-data";

export interface ExploreAiMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  date: string;
  hackathons?: Hackathon[];
  createdAt?: string;
}

export interface ExploreAiConversation {
  id: string;
  userId: string;
  messages: ExploreAiMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExploreAiChatResponse {
  success: boolean;
  userMessage: ExploreAiMessage;
  aiMessage: ExploreAiMessage;
  conversation: ExploreAiConversation;
}

/**
 * Fetch the authenticated user's Explore AI conversation
 */
export async function getExploreConversation(): Promise<ExploreAiConversation | null> {
  try {
    const res = await apiFetch<{ success: boolean; conversation: ExploreAiConversation }>(
      "/explore-ai/conversation"
    );
    return res?.conversation || null;
  } catch (err) {
    console.error("[explore-ai-api] getExploreConversation error:", err);
    return null;
  }
}

/**
 * Send a chat prompt to the Explore AI assistant
 */
export async function sendExploreChatMessage(
  prompt: string,
  signal?: AbortSignal
): Promise<ExploreAiChatResponse> {
  return await apiFetch<ExploreAiChatResponse>("/explore-ai/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    signal,
  });
}

/**
 * Clear the authenticated user's Explore AI conversation history
 */
export async function clearExploreConversation(): Promise<{ success: boolean; message: string }> {
  return await apiFetch<{ success: boolean; message: string }>("/explore-ai/conversation", {
    method: "DELETE",
  });
}
