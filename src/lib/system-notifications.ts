/**
 * Browser System Push Notification helper.
 * Delivers native OS notifications to Desktop Notification Center & Mobile Notification Panel.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function sendNativeSystemNotification(title: string, body: string, icon?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();
      };
    } catch (e) {
      console.warn("Native Notification error:", e);
    }
  }
}
