import { apiFetch } from "./api";
import type { Hackathon } from "./hackathon-data";

export async function getHackathons(): Promise<Hackathon[]> {
  try {
    const data = await apiFetch<Hackathon[]>("/hackathons");
    return data || [];
  } catch (err) {
    console.error("[hackathons-api] getHackathons error:", err);
    return [];
  }
}

export async function createHackathon(
  hackathonData: Partial<Hackathon>
): Promise<Hackathon> {
  return await apiFetch<Hackathon>("/hackathons", {
    method: "POST",
    body: JSON.stringify(hackathonData),
  });
}

export async function deleteHackathon(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/hackathons/${id}`, {
    method: "DELETE",
  });
}
