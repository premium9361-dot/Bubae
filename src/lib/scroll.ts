import type Lenis from 'lenis';

// ========================================================
// CENTRALIZED SCROLL CONTROLLER
// Synchronizes Lenis virtual scroll, window scroll, and SPA history
// ========================================================

let activeLenis: Lenis | null = null;
let isPopStateNavigation = false;

// Map of URL pathname -> scroll Y offset for natural Back/Forward restoration
const scrollHistory = new Map<string, number>();

/**
 * Register the active Lenis instance from SmoothScroll
 */
export function registerLenis(instance: Lenis | null) {
  activeLenis = instance;
  if (typeof window !== 'undefined') {
    (window as any).__lenis = instance;
  }
}

/**
 * Retrieve the active Lenis instance if initialized
 */
export function getLenis(): Lenis | null {
  return activeLenis;
}

/**
 * Set whether the current transition is a browser history popstate (Back/Forward)
 */
export function setIsPopState(value: boolean) {
  isPopStateNavigation = value;
}

/**
 * Check whether the current transition is a popstate
 */
export function getIsPopState(): boolean {
  return isPopStateNavigation;
}

/**
 * Save the current page scroll position before navigating away
 */
export function saveScrollPosition(path: string) {
  if (typeof window === 'undefined') return;
  const currentY =
    activeLenis && typeof activeLenis.scroll === 'number'
      ? activeLenis.scroll
      : window.scrollY || document.documentElement.scrollTop || 0;

  scrollHistory.set(path, currentY);
}

/**
 * Get previously saved scroll position for a pathname
 */
export function getSavedScrollPosition(path: string): number | undefined {
  return scrollHistory.get(path);
}

/**
 * Programmatically reset scroll to top (0, 0) across all layers
 * Resets Lenis internal target and velocity, native window, and document elements
 */
export function scrollToTop(immediate = true) {
  if (typeof window === 'undefined') return;

  // 1. Reset Lenis virtual scroll target and velocity immediately
  if (activeLenis) {
    try {
      activeLenis.scrollTo(0, {
        immediate: true,
        force: true,
        lock: false,
      });
    } catch (e) {
      console.warn('Lenis scrollTo error:', e);
    }
  }

  // 2. Reset native window scroll
  try {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: immediate ? 'instant' : 'auto',
    });
  } catch {
    window.scrollTo(0, 0);
  }

  // 3. Reset documentElement and document.body
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
  }
}

/**
 * Programmatically scroll to a specific position across Lenis and window
 */
export function scrollToPosition(y: number, immediate = true) {
  if (typeof window === 'undefined') return;

  const targetY = Math.max(0, y);

  if (activeLenis) {
    try {
      activeLenis.scrollTo(targetY, {
        immediate,
        force: true,
      });
    } catch (e) {
      console.warn('Lenis scrollTo error:', e);
    }
  }

  try {
    window.scrollTo({
      top: targetY,
      left: 0,
      behavior: immediate ? 'instant' : 'auto',
    });
  } catch {
    window.scrollTo(0, targetY);
  }

  if (document.documentElement) {
    document.documentElement.scrollTop = targetY;
  }
  if (document.body) {
    document.body.scrollTop = targetY;
  }
}
