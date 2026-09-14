/**
 * Opens a centered popup window for third-party OAuth authorization flows.
 */
export function openOAuthPopup(
  url: string,
  title: string = "Hackord OAuth",
  width: number = 600,
  height: number = 700
): Window | null {
  if (typeof window === "undefined") return null;

  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    url,
    title,
    `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no,width=${width},height=${height},top=${top},left=${left}`
  );

  if (popup) {
    try {
      popup.focus();
    } catch (e) {}
  }

  return popup;
}
