/**
 * Deferred media hydration — matches reference entry-gate loading strategy.
 * Critical hero images hydrate on gate tap; story/gallery images load in parallel;
 * event videos load one at a time.
 */

const DEFAULT_CONFIG = {
  criticalSelectors: [
    '#gallery-section .gallery-card--lead img[data-src]',
    '#main-content .hero-icon[data-src]',
    '#main-content .ganesha-icon[data-src]',
  ],
  parallelImageSelectors: [
    '#main-content img[data-seq]',
    '#gallery-section img[data-seq]',
    '.moments-section img[data-seq]',
  ],
  sequentialVideoSelector: '#story-frame-section video[data-seq], #events-section video[data-seq], #main-content video[data-seq][data-autoplay]',
};

let sequentialLoadStarted = false;

export function hydrateImage(img) {
  const url = img.dataset.src;
  if (!url) return;
  if (img.getAttribute('src') && !img.dataset.src) return;
  img.src = url;
  img.removeAttribute('data-src');
  img.classList.remove('deferred-media-pending');
}

export function hydrateVideo(video, autoplay) {
  const source = video.querySelector('source[data-src]');
  if (source) {
    source.src = source.dataset.src;
    source.removeAttribute('data-src');
    video.load();
  } else if (video.dataset.src && !video.getAttribute('src')) {
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
    video.load();
  }
  if (autoplay && (video.hasAttribute('data-autoplay') || video.hasAttribute('autoplay'))) {
    video.play().catch(() => {});
  }
}

export function hydrateCriticalMedia(config = DEFAULT_CONFIG) {
  const selectors = config.criticalSelectors || DEFAULT_CONFIG.criticalSelectors;
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(hydrateImage);
  }
}

export function hydrateImageAsync(img) {
  return new Promise((resolve) => {
    if (!img.dataset.src) {
      resolve();
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    hydrateImage(img);
    if (img.complete && img.naturalWidth) done();
  });
}

export function hydrateVideoAsync(video, autoplay) {
  return new Promise((resolve) => {
    const pending = video.querySelector('source[data-src]') || (video.dataset.src ? video : null);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (autoplay && (video.hasAttribute('data-autoplay') || video.hasAttribute('autoplay'))) video.play().catch(() => {});
      resolve();
    };
    if (!pending) {
      finish();
      return;
    }
    const timeout = setTimeout(finish, 20000);
    const onReady = () => {
      clearTimeout(timeout);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('error', onReady);
      finish();
    };
    video.addEventListener('canplay', onReady);
    video.addEventListener('error', onReady);
    hydrateVideo(video, false);
  });
}

export async function ensureSectionImages(selector) {
  const pending = document.querySelectorAll(selector);
  const imgs = Array.from(pending).filter((img) => img.dataset.src);
  if (imgs.length) await Promise.all(imgs.map(hydrateImageAsync));
}

export async function startSequentialMediaLoad(config = DEFAULT_CONFIG) {
  if (sequentialLoadStarted) return;
  sequentialLoadStarted = true;

  const parallelSelectors = config.parallelImageSelectors || DEFAULT_CONFIG.parallelImageSelectors;
  await Promise.all(parallelSelectors.map((selector) => ensureSectionImages(selector)));

  const videoSelector = config.sequentialVideoSelector || DEFAULT_CONFIG.sequentialVideoSelector;
  const videos = document.querySelectorAll(videoSelector);
  for (const video of videos) {
    const hasPending =
      video.querySelector('source[data-src]') || video.dataset.src;
    if (hasPending) await hydrateVideoAsync(video, true);
  }
}

/** Called when the entry gate is tapped — starts background media pipeline. */
export function beginDeferredMediaLoad(config = DEFAULT_CONFIG) {
  hydrateCriticalMedia(config);
  startSequentialMediaLoad(config);
}

/** Hydrate any images/videos still waiting on data-src (preview, gate end, or skipped entry). */
export function hydrateAllDeferredMedia(root = document) {
  root.querySelectorAll('#main-content img[data-src], #gallery-section img[data-src]').forEach(hydrateImage);
  root.querySelectorAll(
    '#main-content video[data-seq], #story-frame-section video[data-seq], #events-section video[data-seq]'
  ).forEach((video) => {
    hydrateVideo(video, video.hasAttribute('data-autoplay'));
  });
}

export function dispatchGateEnded() {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(new Event('gateEnded'));
}

export function resetDeferredMediaState() {
  sequentialLoadStarted = false;
}

/** Reset pipeline and hydrate media that mounted after entry opened (e.g. gallery active={mainRevealed}). */
export function completeDeferredMediaLoad(config = DEFAULT_CONFIG) {
  resetDeferredMediaState();
  hydrateAllDeferredMedia();
  beginDeferredMediaLoad(config);
}

export function scheduleCompleteDeferredMediaLoad(config = DEFAULT_CONFIG) {
  if (typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      completeDeferredMediaLoad(config);
    });
  });
}

export { DEFAULT_CONFIG as MEDIA_LOAD_CONFIG };
