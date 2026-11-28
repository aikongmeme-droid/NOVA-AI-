export type TapRippleTone = 'surface' | 'accent';

export interface TapRippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
  tone: TapRippleTone;
  createdAt: number;
}

export const RIPPLE_DURATION_MS = 520;
export const MAX_ACTIVE_RIPPLES = 8;
export const DEFAULT_RIPPLE_SIZE = 88;
export const ACCENT_RIPPLE_SIZE = 96;

/**
 * Determines whether the tapped target represents an interactive UI control
 * so the ripple can subtly adapt its tint without distracting from content.
 */
export function resolveRippleTone(target: EventTarget | null): TapRippleTone {
  if (!target || typeof (target as Element).closest !== 'function') {
    return 'surface';
  }
  const interactive = (target as Element).closest(
    'button, a, [role="button"], [role="switch"], input, select, textarea, label'
  );
  return interactive ? 'accent' : 'surface';
}

/**
 * Builds a normalized ripple descriptor for a viewport pointer coordinate.
 */
export function createTapRipple(params: {
  id: number;
  x: number;
  y: number;
  tone?: TapRippleTone;
  now?: number;
}): TapRippleItem | null {
  const { id, x, y, tone = 'surface', now = Date.now() } = params;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
    return null;
  }
  const size = tone === 'accent' ? ACCENT_RIPPLE_SIZE : DEFAULT_RIPPLE_SIZE;
  return {
    id,
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    size,
    tone,
    createdAt: now,
  };
}

/**
 * Appends a new ripple while enforcing MAX_ACTIVE_RIPPLES so rapid tapping
 * never accumulates stale DOM nodes.
 */
export function appendTapRipple(
  current: readonly TapRippleItem[],
  next: TapRippleItem,
  maxActive: number = MAX_ACTIVE_RIPPLES
): TapRippleItem[] {
  const updated = [...current, next];
  if (updated.length <= maxActive) {
    return updated;
  }
  return updated.slice(updated.length - maxActive);
}

/**
 * Removes ripples whose animation lifetime has elapsed.
 */
export function pruneExpiredRipples(
  current: readonly TapRippleItem[],
  now: number,
  durationMs: number = RIPPLE_DURATION_MS
): TapRippleItem[] {
  return current.filter((item) => now - item.createdAt < durationMs);
}
