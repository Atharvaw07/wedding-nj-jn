'use client';

import { useEffect, useState } from 'react';

function isVideoUrl(src) {
  if (!src || typeof src !== 'string') return false;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(src);
}

/** Background video deferred until entry-gate sequential hydration. */
export default function DeferredEventVideo({ src, className, ...rest }) {
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setPreview(document.documentElement.classList.contains('platform-preview'));
  }, []);

  if (!src || !isVideoUrl(src)) return null;

  if (preview) {
    return (
      <video className={className} src={src} autoPlay muted loop playsInline preload="metadata" aria-hidden {...rest} />
    );
  }

  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      data-seq
      data-autoplay
      aria-hidden
      {...rest}
    >
      <source data-src={src} type="video/mp4" />
    </video>
  );
}
