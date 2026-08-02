// ─── Centralized API Client ─────────────────────────────────────────────────
// All backend requests go through this wrapper which auto-injects the JWT token.

const rawApiUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : "http://localhost:3000/api";

function normalizeApiBase(url: string): string {
  let cleaned = url.trim().replace(/\/+$/, "");
  if (!cleaned.endsWith("/api")) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
}

const API_BASE = normalizeApiBase(rawApiUrl);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hackord_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      (data as { message?: string }).message || `Request failed (${res.status})`,
      res.status,
    );
  }

  return data as T;
}

