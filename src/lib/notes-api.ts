import { apiFetch } from "./api";

export type DbNote = {
  _id: string;
  id?: string;
  user_id: string;
  user_email?: string;
  title: string;
  content: string;
  createdAt: string;
};

export async function getNotes(params?: {
  userId?: string;
  email?: string;
}): Promise<DbNote[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.email) searchParams.set("email", params.email);

    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const notes = await apiFetch<DbNote[]>(`/notes${queryStr}`);
    return Array.isArray(notes) ? notes : [];
  } catch (err) {
    console.error("Failed to fetch notes:", err);
    return [];
  }
}

export async function createNote(data: {
  title?: string;
  content: string;
  userId?: string;
  email?: string;
}): Promise<DbNote> {
  return await apiFetch<DbNote>("/notes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await apiFetch(`/notes/${noteId}`, {
    method: "DELETE",
  });
}
