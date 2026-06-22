/** True when a string field has non-whitespace content. */
export function hasText(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

/** True when an image / media URL is present. */
export function hasMediaUrl(value) {
  return hasText(value);
}

export function coupleBlockHasContent(person) {
  if (!person || typeof person !== 'object') return false;
  return hasText(person.name) || hasText(person.familyLine);
}

export function storyItemHasContent(item) {
  if (!item || typeof item !== 'object') return false;
  return hasMediaUrl(item.image) || hasText(item.text) || hasText(item.caption);
}

export function storySlideHasContent(slide) {
  if (!slide || typeof slide !== 'object') return false;
  return hasMediaUrl(slide.media);
}

export function eventItemHasContent(item) {
  if (!item || typeof item !== 'object') return false;
  if (hasText(item.title) || hasMediaUrl(item.image)) return true;
  if (hasText(item.description) || hasText(item.venue) || hasText(item.mapsUrl)) return true;
  if (hasText(item.date) || hasText(item.time)) return true;
  if (item.dressCode?.enabled) return true;
  return false;
}

export function heroHasContent(hero) {
  if (!hero || typeof hero !== 'object') return false;
  return (
    hasMediaUrl(hero.ganeshImageUrl) ||
    hasText(hero.godQuote) ||
    hasText(hero.introLine1) ||
    coupleBlockHasContent(hero.bride) ||
    coupleBlockHasContent(hero.groom)
  );
}

export function footerHasContent(footer) {
  if (!footer || typeof footer !== 'object') return false;
  return hasText(footer.message) || hasText(footer.regards) || hasText(footer.couple);
}

export function isValidDateString(value) {
  if (!hasText(value)) return false;
  const d = new Date(`${String(value).trim()}T12:00:00`);
  return !Number.isNaN(d.getTime());
}

/** Hide pasted map URLs from address copy when a maps button is shown separately. */
export function formatVenueAddressDisplay(address, mapsUrl) {
  if (!hasText(address)) return address;
  if (!hasText(mapsUrl)) return address;
  return String(address)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\b(?:maps\.google[^\s]*|goo\.gl\/maps[^\s]*)/gi, '')
    .split('\n')
    .map((line) => line.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}
