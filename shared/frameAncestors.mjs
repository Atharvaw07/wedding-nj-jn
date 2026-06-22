/**
 * CSP frame-ancestors for template sites embedded in the InviteVibes platform editor.
 */

function parseOrigin(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildFrameAncestorsCsp() {
  const ancestors = new Set(["'self'"]);
  const platform =
    parseOrigin(process.env.NEXT_PUBLIC_PLATFORM_ORIGIN) ||
    parseOrigin(process.env.NEXT_PUBLIC_CLIENT_URL);

  if (platform) ancestors.add(platform);

  if (process.env.NODE_ENV !== 'production') {
    ancestors.add('http://localhost:3000');
    ancestors.add('http://127.0.0.1:3000');
  }

  if (ancestors.size <= 1 && process.env.NODE_ENV !== 'production') {
    return "frame-ancestors *";
  }

  return `frame-ancestors ${[...ancestors].join(' ')}`;
}

export function frameAncestorHeaders() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: buildFrameAncestorsCsp(),
        },
      ],
    },
  ];
}
