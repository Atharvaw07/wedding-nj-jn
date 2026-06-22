/**
 * Shared postMessage origin checks for template iframes embedded in the platform editor.
 * Set NEXT_PUBLIC_PLATFORM_ORIGIN (or NEXT_PUBLIC_CLIENT_URL) on template Vercel projects.
 */

const DEFAULT_DEV_PLATFORM = 'http://localhost:3000';

export function getAllowedPlatformOrigins() {
  const raw =
    process.env.NEXT_PUBLIC_PLATFORM_ORIGIN ||
    process.env.NEXT_PUBLIC_CLIENT_URL ||
    '';
  const origins = new Set();
  if (raw.trim()) {
    try {
      const url = raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`;
      origins.add(new URL(url).origin);
    } catch {
      /* ignore invalid env */
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    origins.add(DEFAULT_DEV_PLATFORM);
    origins.add('http://127.0.0.1:3000');
  }
  return [...origins];
}

export function isAllowedPlatformOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const allowed = getAllowedPlatformOrigins();
  if (allowed.length > 0) {
    return allowed.includes(origin);
  }
  if (process.env.NODE_ENV !== 'production') {
    try {
      const u = new URL(origin);
      return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }
  return false;
}

/** Notify parent editor that this iframe is ready for draft sync. */
export function postReadyToPlatform() {
  if (typeof window === 'undefined' || window.parent === window) return;
  const allowed = getAllowedPlatformOrigins();
  const targets =
    allowed.length > 0
      ? allowed
      : process.env.NODE_ENV !== 'production'
        ? ['*']
        : [];
  for (const target of targets) {
    try {
      window.parent.postMessage({ type: 'WEDDING_PREVIEW_READY' }, target);
    } catch {
      /* ignore cross-origin post failures */
    }
  }
}
