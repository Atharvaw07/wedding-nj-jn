function isVideoSrc(src) {
  if (!src || typeof src !== 'string') return false;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(src);
}

/** Collect unique image URLs from merged site data. */
export function collectImageUrls(data) {
  if (!data || typeof data !== 'object') return [];
  const urls = [];
  const seen = new Set();

  const add = (url) => {
    if (!url || typeof url !== 'string' || isVideoSrc(url) || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };
add(data.hero?.ganeshImageUrl);
  add(data.venue?.image);
  for (const item of data.story?.items || []) add(item.image);
  for (const item of data.events?.items || []) add(item.image);

  return urls;
}

/** Fire-and-forget image preloads (browser cache). */
export function preloadImages(urls) {
  for (const url of urls) {
    const img = new Image();
    img.src = url;
  }
}

/** Wait until listed images finish loading (or fail). */
export function waitForImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) return Promise.resolve();

  return Promise.all(
    unique.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = url;
        })
    )
  );
}
