'use client';

import { useEffect, useState } from 'react';

/** Image deferred until entry-gate tap; uses data-src in live sites. */
export default function DeferredImg({
  src,
  defer = true,
  sequential = true,
  className,
  alt = '',
  width,
  height,
  decoding = 'async',
  ...rest
}) {
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setPreview(document.documentElement.classList.contains('platform-preview'));
  }, []);

  if (!src) return null;

  if (!defer || preview) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        decoding={decoding}
        loading={preview ? 'eager' : 'lazy'}
        {...rest}
      />
    );
  }

  const pendingClass = ['deferred-media-pending', className].filter(Boolean).join(' ');

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-src={src}
      {...(sequential ? { 'data-seq': true } : {})}
      alt={alt}
      className={pendingClass}
      width={width}
      height={height}
      decoding={decoding}
      {...rest}
    />
  );
}
