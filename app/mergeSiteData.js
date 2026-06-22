/** Coerce list-like values from the editor / API into a real array. */
import { finalizeSiteData } from './lib/siteMetadata.js';

export function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

/** Story polaroids vs frame swiper — coerce list fields. */
export function normalizeStoryData(data) {
  if (!data || typeof data !== 'object') return data;
  const story = data.story;
  if (!story || typeof story !== 'object') return data;

  const displayMode = story.displayMode === 'swiper' ? 'swiper' : 'polaroids';
  return {
    ...data,
    story: {
      ...story,
      displayMode,
      items: ensureArray(story.items),
      slides: ensureArray(story.slides),
    },
  };
}

/** Backfill scratch / countdown toggles for projects saved before they were split. */
export function normalizeSaveTheDateSettings(data) {
  if (!data || typeof data !== 'object') return data;
  const std = data.saveTheDate;
  if (!std || typeof std !== 'object') return data;

  const sectionEnabled = std.enabled !== false;
  const scratchEnabled = std.scratchEnabled !== undefined ? std.scratchEnabled !== false : sectionEnabled;
  const countdownEnabled = std.countdownEnabled !== undefined ? std.countdownEnabled !== false : sectionEnabled;

  if (std.scratchEnabled === scratchEnabled && std.countdownEnabled === countdownEnabled) return data;

  return {
    ...data,
    saveTheDate: { ...std, scratchEnabled, countdownEnabled },
  };
}

/** Whitespace-only strings are treated as intentionally empty. */
export function normalizeBlankString(value) {
  if (typeof value !== 'string') return value;
  return value.trim() === '' ? '' : value;
}

/** Backfill theme colour fields for projects saved before palettes existed. */
export function normalizeColorSettings(data, defaults = {}) {
  if (!data || typeof data !== 'object') return data;
  const def = defaults && typeof defaults === 'object' ? defaults : {};
  const has = (key) => Object.prototype.hasOwnProperty.call(data, key);
  const out = { ...data };
  let changed = false;

  for (const key of ['colorPalette', 'customPrimaryColor', 'customAccentColor']) {
    const next = has(key) ? normalizeBlankString(data[key]) : def[key];
    if (next === undefined) continue;
    if (out[key] !== next) {
      out[key] = next;
      changed = true;
    }
  }

  return changed ? out : data;
}

/** If a track is set but "Show music control" was never saved, default it on. */
export function normalizeAudioSettings(data) {
  if (!data || typeof data !== 'object') return data;
  const audio = data.audio;
  if (!audio || typeof audio !== 'object' || !audio.src) return data;
  if (audio.enabled === false) return data;
  if (audio.enabled === true) return data;
  return { ...data, audio: { ...audio, enabled: true } };
}

/** Sync editor _visibility flags into section.enabled for the live template. */
export function applyVisibilityFromMeta(data) {
  if (!data || typeof data !== 'object') return data;
  const vis = data._visibility;
  if (!vis || typeof vis !== 'object') return data;

  const out = { ...data };
  for (const sectionId of Object.keys(vis)) {
    if (vis[sectionId] !== false) continue;
    const sec = out[sectionId];
    if (sec && typeof sec === 'object' && !Array.isArray(sec)) {
      out[sectionId] = { ...sec, enabled: false };
    }
  }
  return out;
}

export function mergeSiteData(defaults, patch) {
  if (patch === undefined || patch === null) return applyVisibilityFromMeta(defaults);
  if (typeof patch !== 'object' || Array.isArray(patch)) return patch;

  const base = defaults && typeof defaults === 'object' && !Array.isArray(defaults) ? defaults : {};
  const out = { ...base };

  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = base[key];

    if (Array.isArray(pv)) {
      out[key] = pv;
      continue;
    }
    if (pv !== null && typeof pv === 'object' && bv !== null && typeof bv === 'object' && !Array.isArray(bv)) {
      out[key] = mergeSiteData(bv, pv);
    } else {
      out[key] = typeof pv === 'string' ? normalizeBlankString(pv) : pv;
    }
  }

  return normalizeColorSettings(
    normalizeStoryData(normalizeSaveTheDateSettings(normalizeAudioSettings(applyVisibilityFromMeta(out)))),
    defaults,
  );
}

function runSiteNormalizers(data, defaults) {
  return normalizeColorSettings(
    normalizeStoryData(normalizeSaveTheDateSettings(normalizeAudioSettings(applyVisibilityFromMeta(data)))),
    defaults,
  );
}

/** Live site + project preview. Pass `defaults` (e.g. data.json) to backfill theme colour keys. */
export function prepareSiteData(data, defaults) {
  const base = data && typeof data === 'object' ? data : {};
  const def = defaults && typeof defaults === 'object' ? defaults : {};
  return finalizeSiteData(runSiteNormalizers(base, def), 'blushtheme');
}
