const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

function resolveDuration(distance, { duration, minDuration = 8000, maxDuration = 16000, msPerPixel = 0.9 } = {}) {
  if (duration != null) return duration;
  return Math.round(Math.min(Math.max(Math.abs(distance) * msPerPixel, minDuration), maxDuration));
}

export function smoothScrollToElement(element, { duration, minDuration, maxDuration, offset = 0, onComplete } = {}) {
  if (!element || typeof window === 'undefined') {
    onComplete?.();
    return () => {};
  }

  const startY = window.scrollY;
  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
  const distance = targetY - startY;

  if (Math.abs(distance) < 8) {
    onComplete?.();
    return () => {};
  }

  const scrollDuration = resolveDuration(distance, { duration, minDuration, maxDuration });
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  let rafId = null;
  let startTime = null;
  let cancelled = false;
  let finished = false;

  const scrollToY = (y) => {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    root.style.scrollBehavior = previousScrollBehavior;
    onComplete?.();
  };

  const step = (timestamp) => {
    if (cancelled) return;
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / scrollDuration, 1);
    scrollToY(startY + distance * easeInOutSine(progress));
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      scrollToY(targetY);
      finish();
    }
  };

  rafId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
    finish();
  };
}
