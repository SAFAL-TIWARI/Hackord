import { formatDateWord } from "./date-utils";
import type { DbRoom } from "./rooms-api";

/**
 * Format a Date object to YYYYMMDD string for Google Calendar all-day events
 */
export function toGCalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Format a Date object to YYYYMMDDTHHmmssZ for timed events in UTC
 */
export function toGCalDateTimeUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generates a Google Calendar event creation URL that opens directly in a new tab
 */
export function generateGoogleCalendarUrl({
  title,
  startDate,
  endDate,
  details,
  location,
}: {
  title: string;
  startDate: string | Date;
  endDate?: string | Date;
  details?: string;
  location?: string;
}): string {
  const start = typeof startDate === "string" ? new Date(startDate) : new Date(startDate.getTime());
  let end = endDate
    ? typeof endDate === "string"
      ? new Date(endDate)
      : new Date(endDate.getTime())
    : new Date(start);

  if (isNaN(start.getTime())) {
    const today = new Date();
    const sStr = toGCalDate(today);
    const e = new Date(today);
    e.setDate(e.getDate() + 1);
    const eStr = toGCalDate(e);
    return buildGCalUrl(title, `${sStr}/${eStr}`, details, location);
  }

  // Google Calendar all-day events: end date is exclusive (day after last day)
  if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  } else {
    // Add 1 day to end date to make it inclusive of the end day
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }

  const sStr = toGCalDate(start);
  const eStr = toGCalDate(end);
  const datesParam = `${sStr}/${eStr}`;

  return buildGCalUrl(title, datesParam, details, location);
}

function buildGCalUrl(title: string, dates: string, details?: string, location?: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: dates,
  });

  if (details) {
    params.set("details", details);
  }

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates the Google Calendar event URL for the entire Hackathon Room schedule
 */
export function getRoomGoogleCalendarUrl(room: DbRoom, originUrl?: string): string {
  const rawDates = [
    room.deadline_registration,
    room.deadline_ppt,
    room.deadline_prototype,
    room.deadline_final,
    room.deadline_result,
  ]
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const startDate = rawDates.length > 0 ? rawDates[0] : new Date();
  const endDate = rawDates.length > 0 ? rawDates[rawDates.length - 1] : startDate;

  const appUrl = originUrl || (typeof window !== "undefined" ? window.location.href : "");

  const details = [
    `🏆 Hackathon: ${room.hackathon}`,
    `👥 Team Room: ${room.name}`,
    room.problem ? `\n🎯 Problem Statement:\n${room.problem}` : "",
    room.description ? `\n📝 Description:\n${room.description}` : "",
    "\n📌 Hackathon Timeline & Deadlines:",
    room.deadline_registration ? `• Registration Deadline: ${formatDateWord(room.deadline_registration)}` : null,
    room.deadline_ppt ? `• PPT Submission: ${formatDateWord(room.deadline_ppt)}` : null,
    room.deadline_prototype ? `• Prototype Submission: ${formatDateWord(room.deadline_prototype)}` : null,
    room.deadline_final ? `• Final Submission: ${formatDateWord(room.deadline_final)}` : null,
    room.deadline_result ? `• Result Declaration: ${formatDateWord(room.deadline_result)}` : null,
    appUrl ? `\n🔗 Hackord Room Workspace:\n${appUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const title = `[Hackathon] ${room.hackathon} — ${room.name}`;
  const location = appUrl ? `Hackord Workspace: ${appUrl}` : "Online / Hackord";

  return generateGoogleCalendarUrl({
    title,
    startDate,
    endDate,
    details,
    location,
  });
}

/**
 * Generates the Google Calendar event URL for a specific milestone/deadline
 */
export function getMilestoneGoogleCalendarUrl(
  room: DbRoom,
  milestoneLabel: string,
  dateStr: string,
  originUrl?: string
): string {
  const appUrl = originUrl || (typeof window !== "undefined" ? window.location.href : "");
  const title = `🚨 [Deadline] ${room.hackathon}: ${milestoneLabel}`;

  const details = [
    `📌 Deadline: ${milestoneLabel}`,
    `🏆 Hackathon: ${room.hackathon}`,
    `👥 Team: ${room.name}`,
    `📅 Due Date: ${formatDateWord(dateStr)}`,
    room.problem ? `\n🎯 Problem: ${room.problem}` : "",
    appUrl ? `\n🔗 Open Hackord Workspace: ${appUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const location = appUrl ? `Hackord Workspace: ${appUrl}` : "Online / Hackord";

  return generateGoogleCalendarUrl({
    title,
    startDate: dateStr,
    endDate: dateStr,
    details,
    location,
  });
}

/**
 * Generates and downloads an iCal (.ics) file containing all milestones of the Hackathon
 */
export function downloadRoomIcsFile(room: DbRoom, originUrl?: string): void {
  const appUrl = originUrl || (typeof window !== "undefined" ? window.location.href : "");
  const milestones = [
    { label: "Registration Deadline", dateStr: room.deadline_registration },
    { label: "PPT Submission", dateStr: room.deadline_ppt },
    { label: "Prototype Submission", dateStr: room.deadline_prototype },
    { label: "Final Submission", dateStr: room.deadline_final },
    { label: "Result Declaration", dateStr: room.deadline_result },
  ].filter((m) => Boolean(m.dateStr));

  const formatIcsDate = (dStr: string) => {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const icsLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hackord//Hackathon Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${room.hackathon} - ${room.name}`,
  ];

  milestones.forEach((m, idx) => {
    const dStr = formatIcsDate(m.dateStr);
    if (!dStr) return;

    // Next day for DTEND
    const nextD = new Date(m.dateStr);
    nextD.setDate(nextD.getDate() + 1);
    const dEndStr = formatIcsDate(nextD.toISOString());

    const summary = `${room.hackathon}: ${m.label} (${room.name})`;
    const description = `Milestone: ${m.label}\\nHackathon: ${room.hackathon}\\nTeam: ${room.name}\\nWorkspace: ${appUrl}`;

    icsLines.push(
      "BEGIN:VEVENT",
      `UID:${room.id}-${idx}-${dStr}@hackord.com`,
      `DTSTAMP:${toGCalDate(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${dStr}`,
      `DTEND;VALUE=DATE:${dEndStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:Hackord Workspace`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  });

  icsLines.push("END:VCALENDAR");

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeFilename = (room.hackathon || "hackathon").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  link.download = `${safeFilename}_schedule.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
