/**
 * Thin wrapper over GTM's dataLayer for custom events.
 * Safe to call in SSR / when GTM is blocked — fails silently.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    if (!window.dataLayer) window.dataLayer = [];
    // Strip undefined values so they don't bloat the dataLayer.
    const clean: Record<string, unknown> = { event };
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) clean[k] = v;
    }
    window.dataLayer.push(clean);
  } catch {
    // ignore
  }
}
