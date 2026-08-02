/**
 * Haptic feedback utility using Web Vibration API.
 * Works on Android Chrome/Firefox mobile browsers.
 * Silently ignored on iOS Safari and desktop.
 */
export function haptic(type: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  const patterns: Record<typeof type, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 10],
    error: [50, 30, 50, 30, 50],
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // silently ignore if not supported
  }
}
