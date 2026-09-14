import { apiFetch } from "./api";
import type { Hackathon } from "./hackathon-data";

export type ScrapedFileStatus = {
  exists: boolean;
  totalCount: number;
  updatedAt: string | null;
  hackathons: Partial<Hackathon>[];
};

export type HostRequestSubmission = {
  _id: string;
  name: string;
  organizer: string;
  contactEmail: string;
  banner?: string;
  prizePool?: string;
  prizePoolUSD?: number;
  mode: "Online" | "Offline" | "Hybrid";
  level?: "State" | "National" | "Global";
  registrationDeadline: string;
  submissionDeadline: string;
  resultDate?: string;
  teamSize?: { min: number; max: number };
  tags?: string[];
  platform?: string;
  platformUrl?: string;
  hackathonType?: "Hackathon" | "Mini Hackathon";
  duration?: string;
  venue?: string;
  schedule?: string;
  submissionChecklist?: string[];
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

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

export async function triggerHackathonScrape(options?: {
  autoFeed?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  fileStatus?: ScrapedFileStatus;
  merged?: {
    insertedCount: number;
    updatedCount: number;
    totalProcessed: number;
  };
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
    fileStatus?: ScrapedFileStatus;
    merged?: {
      insertedCount: number;
      updatedCount: number;
      totalProcessed: number;
    };
  }>("/admin/trigger-scrape", {
    method: "POST",
    body: JSON.stringify({ autoFeed: options?.autoFeed ?? false }),
  });
}

export async function getScrapedFileStatus(): Promise<ScrapedFileStatus> {
  return await apiFetch<ScrapedFileStatus>("/admin/scraped-file-status");
}

export type GitSyncStatus = {
  success: boolean;
  method?: string;
  commitSha?: string;
  commitUrl?: string;
  note?: string;
  error?: string;
};

export async function feedScrapedHackathonsToDb(): Promise<{
  success: boolean;
  message: string;
  hackathonsCount: number;
  gitStatus?: GitSyncStatus;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
    hackathonsCount: number;
    gitStatus?: GitSyncStatus;
  }>("/admin/feed-scraped-hackathons", {
    method: "POST",
  });
}

export async function rejectScrapedHackathon(id: string): Promise<{
  success: boolean;
  message: string;
  fileStatus?: ScrapedFileStatus;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
    fileStatus?: ScrapedFileStatus;
  }>("/admin/scraped-hackathons/reject", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function deleteAllScrapedHackathons(): Promise<{
  success: boolean;
  message: string;
  fileStatus?: ScrapedFileStatus;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
    fileStatus?: ScrapedFileStatus;
  }>("/admin/scraped-hackathons", {
    method: "DELETE",
  });
}

export async function submitHostHackathonRequest(data: any): Promise<{
  success: boolean;
  message: string;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
  }>("/hackathons/submit-host-request", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getHostRequests(): Promise<HostRequestSubmission[]> {
  return await apiFetch<HostRequestSubmission[]>("/admin/host-requests");
}

export async function approveHostRequest(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
  }>(`/admin/host-requests/${id}/approve`, {
    method: "POST",
  });
}

export async function deleteHostRequest(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
  }>(`/admin/host-requests/${id}`, {
    method: "DELETE",
  });
}

export type ContactMessageItem = {
  _id: string;
  name: string;
  email: string;
  category: string;
  subject?: string;
  message: string;
  status: "unread" | "read" | "resolved";
  createdAt: string;
};

export async function sendContactMessage(data: {
  name: string;
  email: string;
  category?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  return await apiFetch<{ success: boolean; message: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getContactMessages(): Promise<ContactMessageItem[]> {
  return await apiFetch<ContactMessageItem[]>("/admin/contact-messages");
}

export async function deleteContactMessage(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return await apiFetch<{ success: boolean; message: string }>(
    `/admin/contact-messages/${id}`,
    {
      method: "DELETE",
    }
  );
}

