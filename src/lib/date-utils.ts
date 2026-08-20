/**
 * Date formatting helpers for Hackord.
 * Ensures consistent date representations across the whole platform:
 * - DD/MM/YYYY for compact/table/numeric dates (where previously MM/DD/YYYY)
 * - DD Month YYYY (e.g., 21 Aug 2026) for worded date formats (where previously Month DD YYYY)
 * - DD Month (e.g., 21 Aug) for compact worded dates
 */

export function formatDateNumeric(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateWord(
  dateInput?: string | number | Date | null,
  options?: { shortMonth?: boolean; includeYear?: boolean }
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const shortMonth = options?.shortMonth ?? true;
  const includeYear = options?.includeYear ?? true;

  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: shortMonth ? "short" : "long" });
  const year = date.getFullYear();

  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

export function formatDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day}/${month}/${year}, ${time}`;
}
