import { getRooms, getLoggedInUser } from "./rooms-api";
import { getPendingInvitations } from "./users-api";
import { DUMMY_NOTIFICATIONS } from "./dummy-data";

export type RealNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
  type: "invite" | "deadline" | "activity" | "member" | "message" | "info";
  link?: string;
  createdAt: number;
};

export async function fetchRealNotifications(user?: { _id: string; email: string } | null): Promise<RealNotification[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("hackord_token") : null;
  if (!user && !token) {
    return DUMMY_NOTIFICATIONS;
  }

  const currentUser = user ? { id: user._id, email: user.email } : getLoggedInUser();
  const notifs: RealNotification[] = [];

  try {
    // 1. Real Room Invitations
    const pendingInvs = await getPendingInvitations({
      userId: currentUser.id,
      email: currentUser.email,
    });

    if (Array.isArray(pendingInvs)) {
      pendingInvs.forEach((inv) => {
        notifs.push({
          id: `inv_${inv.id}`,
          title: `Room Invitation: ${inv.roomName}`,
          detail: `${inv.sender?.name || "A platform user"} invited you to join "${inv.roomName}" for ${inv.hackathon || "hackathon"}.`,
          time: "Pending",
          unread: true,
          type: "invite",
          link: "/dashboard",
          createdAt: inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now(),
        });
      });
    }

    // 2. Real Room Deadlines and Activity Items
    const rooms = await getRooms({
      userId: currentUser.id,
      email: currentUser.email,
    });

    if (Array.isArray(rooms)) {
      rooms.forEach((r) => {
        // Deadlines
        const deadlines = [
          { name: "Registration", val: r.deadline_registration },
          { name: "PPT Submission", val: r.deadline_ppt },
          { name: "Prototype", val: r.deadline_prototype },
          { name: "Final Submission", val: r.deadline_final },
        ].filter((d) => Boolean(d.val));

        deadlines.forEach((d) => {
          if (!d.val) return;
          const target = new Date(d.val);
          if (isNaN(target.getTime())) return;
          const diffMs = target.getTime() - Date.now();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays >= -1 && diffDays <= 30) {
            notifs.push({
              id: `dl_${r.id}_${d.name}`,
              title: `${d.name}: ${r.name}`,
              detail: `${d.name} for ${r.hackathon} is scheduled for ${target.toDateString().slice(4)} (${diffDays <= 0 ? "Due Now" : `${diffDays} days left`}).`,
              time: diffDays <= 0 ? "Due Now" : `${diffDays}d left`,
              unread: diffDays <= 3,
              type: "deadline",
              link: `/rooms/${r.id}`,
              createdAt: target.getTime() - 86400000 * 2,
            });
          }
        });

        // Team Activities
        if (Array.isArray(r.activities)) {
          r.activities.slice(0, 3).forEach((act) => {
            notifs.push({
              id: `act_${act.id}`,
              title: `${r.name}: Team Activity`,
              detail: `${act.who} ${act.what}`,
              time: act.when ? new Date(act.when).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
              unread: false,
              type: "activity",
              link: `/rooms/${r.id}`,
              createdAt: act.when ? new Date(act.when).getTime() : Date.now() - 3600000,
            });
          });
        }
      });
    }
  } catch (err) {
    console.warn("[notifications-api] Error fetching real notifications:", err);
  }

  // Sort by newest first
  notifs.sort((a, b) => b.createdAt - a.createdAt);

  return notifs;
}
