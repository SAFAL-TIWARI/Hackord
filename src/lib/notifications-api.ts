import { getRooms, getLoggedInUser } from "./rooms-api";
import { getPendingInvitations, getUserSettings } from "./users-api";
import { formatDateWord } from "./date-utils";

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
    return [];
  }

  const currentUser = user ? { id: user._id, email: user.email } : getLoggedInUser();
  const notifs: RealNotification[] = [];

  try {
    // 0. Fetch User Notification Preferences
    const userSettings = await getUserSettings({
      userId: currentUser.id,
      email: currentUser.email,
    });
    const prefs = userSettings?.notificationPreferences || {
      emailEnabled: true,
      roomInvites: true,
      deadlines: true,
      chatMessages: true,
      reminders: true,
    };

    // 1. Real Room Invitations (if roomInvites toggle is ON)
    if (prefs.roomInvites !== false) {
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
    }

    // 2. Real Room Deadlines and Activity Items
    const rooms = await getRooms({
      userId: currentUser.id,
      email: currentUser.email,
    });

    if (Array.isArray(rooms)) {
      rooms.forEach((r) => {
        // Deadlines (if deadlines toggle is ON)
        if (prefs.deadlines !== false) {
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
                detail: `${d.name} for ${r.hackathon} is scheduled for ${formatDateWord(target)} (${diffDays <= 0 ? "Due Now" : `${diffDays} days left`}).`,
                time: diffDays <= 0 ? "Due Now" : `${diffDays}d left`,
                unread: diffDays <= 3,
                type: "deadline",
                link: `/rooms/${r.id}`,
                createdAt: target.getTime() - 86400000 * 2,
              });
            }
          });
        }

        // Team Activities / Messages (if chatMessages toggle is ON)
        if (prefs.chatMessages !== false && Array.isArray(r.activities)) {
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

    // 3. Unread Direct Messages / Chat Notifications
    if (prefs.chatMessages !== false && currentUser.id) {
      try {
        const { getConversations } = await import("./chat-api");
        const convs = await getConversations(currentUser.id);
        if (convs && Array.isArray(convs.direct)) {
          convs.direct.forEach((c) => {
            if (c.unreadCount > 0) {
              notifs.push({
                id: `chat_${c.id}_${c.unreadCount}`,
                title: `New message from ${c.name}`,
                detail: c.lastMessageText || `${c.unreadCount} unread message(s)`,
                time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
                unread: true,
                type: "message",
                link: `/chat?userId=${c.otherUserId}`,
                createdAt: c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : Date.now(),
              });
            }
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn("[notifications-api] Error fetching real notifications:", err);
  }

  // Sort by newest first
  notifs.sort((a, b) => b.createdAt - a.createdAt);

  return notifs;
}
