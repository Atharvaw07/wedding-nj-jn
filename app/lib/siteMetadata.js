/**
 * Build page title, meta description, and Open Graph tags from client site data.
 * Used in theme layout.js (build time) and page.js (live preview with ?pid=).
 */

const STALE_DEMO_COUPLE = /Meenal\s*&\s*Avinash/i;

export const SITE_META_PRESETS = {
  blushtheme: { titleSuffix: '— Wedding Celebration', eventKind: 'wedding' },
  bloomingtheme: { titleSuffix: '— Wedding Celebration', eventKind: 'wedding' },
  greentemplate: { titleSuffix: '— Sacred Union', eventKind: 'wedding' },
  goldenmemoriestemplate: { titleSuffix: '| Wedding Invitation', eventKind: 'wedding' },
  ivorygoldtheme: { titleSuffix: '— Wedding Invitation', eventKind: 'wedding' },
  modernblisstemplate: { titleSuffix: '— A Sacred Union', eventKind: 'wedding' },
  templetalestemplate: {
    titleSuffix: '— A Sacred Union',
    eventKind: 'wedding',
    themeLabel: 'Temple Tales',
  },
  terracottatemplate: { titleSuffix: '— A Sacred Union', eventKind: 'wedding' },
  terracottaengagement: { titleSuffix: '— Engagement Invitation', eventKind: 'engagement' },
  classic: { titleSuffix: '— Wedding', eventKind: 'wedding' },
};

function stripHtml(text) {
  return String(text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanLine(text) {
  return stripHtml(text).replace(/\n+/g, ' ').trim();
}

function nameFromField(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val.name) return String(val.name).trim();
  return '';
}

export function resolveCoupleLine(data) {
  if (!data || typeof data !== 'object') return '';

  const footer = data.footer || {};
  const fromFooter = cleanLine(footer.couple || footer.coupleLine);
  if (fromFooter) return fromFooter;

  const hero = data.hero || data.invite?.hero || {};
  const bride = nameFromField(hero.bride) || nameFromField(hero.brideName);
  const groom = nameFromField(hero.groom) || nameFromField(hero.groomName);
  if (bride && groom) return `${bride} & ${groom}`;

  const couplePhoto = data.couplePhoto || {};
  const cpBride = nameFromField(couplePhoto.brideName);
  const cpGroom = nameFromField(couplePhoto.groomName);
  if (cpBride && cpGroom) return `${cpBride} & ${cpGroom}`;

  if (data.bride_name && data.groom_name) {
    return `${String(data.bride_name).trim()} & ${String(data.groom_name).trim()}`;
  }

  return '';
}

function parseIsoDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function resolveEventDateLine(data) {
  const std = data.saveTheDate?.weddingDate || data.saveTheDate?.date;
  let d = parseIsoDate(std);
  if (d) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const metaLine = cleanLine(data.footer?.metaLine);
  if (metaLine) return metaLine;

  const events = data.events?.items || data.events;
  if (Array.isArray(events) && events.length) {
    const first = events[0];
    d = parseIsoDate(first?.date);
    if (d) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (first?.dateLine) return cleanLine(first.dateLine);
  }

  if (data.wedding_date) return cleanLine(data.wedding_date);

  return '';
}

export function resolveVenueSnippet(data) {
  const venue = data.venue;
  if (!venue) return '';
  const name = cleanLine(venue.name);
  const city = cleanLine(venue.city);
  if (name && city) return `${name} · ${city}`;
  if (name) return name;
  if (city) return city;
  const address = venue.address;
  if (typeof address === 'string' && address.trim()) {
    return cleanLine(address.split('\n')[0]);
  }
  return '';
}

export function resolveMetaDescription(data, options = {}) {
  const { eventKind = 'wedding' } = options;
  const tagline = cleanLine(data.footer?.tagline || data.tagline);
  if (tagline) return tagline;

  const couple = resolveCoupleLine(data);
  const dateLine = resolveEventDateLine(data);
  const venueLine = resolveVenueSnippet(data);

  let description = '';
  if (couple) {
    description = eventKind === 'engagement'
      ? `Join us as we celebrate our engagement${dateLine ? `. ${dateLine}` : '.'}`
      : `Join us as we celebrate our wedding${dateLine ? `. ${dateLine}` : '.'}`;
  } else {
    description = eventKind === 'engagement'
      ? 'You are invited to celebrate our engagement.'
      : 'You are invited to celebrate our wedding.';
  }

  if (venueLine) description = `${description} · ${venueLine}`;
  return description;
}

export function resolveOgImage(data) {
  const candidates = [
    data.couplePhoto?.image,
    data.hero?.image,
    data.hero?.imageUrl,
    data.story?.items?.[0]?.image,
    data.gallery?.items?.[0]?.image,
  ];
  for (const url of candidates) {
    if (typeof url === 'string' && url.trim() && !/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) {
      return url.trim();
    }
  }
  return undefined;
}

export function resolvePageTitle(data, options = {}) {
  const {
    titleSuffix = '— Wedding',
    eventKind = 'wedding',
    themeLabel,
  } = options;

  const couple = resolveCoupleLine(data);
  if (couple) return `${couple} ${titleSuffix}`.trim();
  if (eventKind === 'engagement') return 'Engagement Invitation';
  if (themeLabel) return `${themeLabel} Wedding Invitation`;
  return 'Wedding Invitation';
}

function resolveOgTitle(data, options = {}) {
  const couple = resolveCoupleLine(data);
  const dateLine = resolveEventDateLine(data);
  if (couple && dateLine) return `${couple} — ${dateLine}`;
  return resolvePageTitle(data, options);
}

export function buildSiteMetadata(data, options = {}) {
  const title = resolvePageTitle(data, options);
  const description = resolveMetaDescription(data, options);
  const ogTitle = resolveOgTitle(data, options);
  const ogImage = resolveOgImage(data);

  const metadata = {
    title,
    description,
    robots: 'noindex,nofollow',
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
    },
  };

  if (ogImage) {
    metadata.openGraph.images = [ogImage];
  }

  return metadata;
}

export function applySiteDocumentMeta(data, options = {}) {
  if (typeof document === 'undefined' || !data) return;

  const title = resolvePageTitle(data, options);
  const description = resolveMetaDescription(data, options);
  const ogTitle = resolveOgTitle(data, options);

  document.title = title;

  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', description);

  for (const [prop, content] of [
    ['og:title', ogTitle],
    ['og:description', description],
  ]) {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  const ogImage = resolveOgImage(data);
  if (ogImage) {
    let imgMeta = document.querySelector('meta[property="og:image"]');
    if (!imgMeta) {
      imgMeta = document.createElement('meta');
      imgMeta.setAttribute('property', 'og:image');
      document.head.appendChild(imgMeta);
    }
    imgMeta.setAttribute('content', ogImage);
  }
}

/** Replace copied template demo copy (e.g. stale Meenal & Avinash entry text). */
function syncStaleDemoCopy(data, options = {}) {
  if (!data || typeof data !== 'object') return data;
  const couple = resolveCoupleLine(data);
  if (!couple) return data;

  const { eventKind = 'wedding' } = options;
  let out = data;
  let changed = false;

  const entry = data.entry;
  if (entry && typeof entry === 'object') {
    const msg = typeof entry.message === 'string' ? entry.message.trim() : '';
    if (!msg || STALE_DEMO_COUPLE.test(msg)) {
      const nextMessage = eventKind === 'engagement'
        ? `With love and blessings,\nwe invite you to celebrate the engagement of:\n${couple}`
        : `With love and blessings,\nwe invite you to the wedding of:\n${couple}`;
      if (msg !== nextMessage) {
        out = { ...out, entry: { ...entry, message: nextMessage } };
        changed = true;
      }
    }
  }

  const footer = (changed ? out.footer : data.footer) || {};
  if (footer && typeof footer === 'object' && !cleanLine(footer.couple || footer.coupleLine)) {
    out = {
      ...(changed ? out : data),
      footer: { ...footer, couple: couple },
    };
    changed = true;
  }

  return changed ? out : data;
}

export function finalizeSiteData(data, themeKey) {
  const preset = SITE_META_PRESETS[themeKey] || {};
  return syncStaleDemoCopy(data, preset);
}
