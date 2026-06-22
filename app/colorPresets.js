import paletteFile from '../colorPalettes.json';

export const DEFAULT_PALETTE_ID = paletteFile.defaultId || 'blush-gold';
export const TOKEN_SCHEMA = paletteFile.tokenSchema || [];

const CREAM = [253, 251, 247];
const CREAM_3_BASE = [242, 234, 225];
const BORDER_BASE = [240, 229, 219];
const WHITE = [255, 255, 255];

const TOKEN_TO_CSS = {
  cream: '--cream',
  cream2: '--cream-2',
  cream3: '--cream-3',
  heroBg: '--hero-bg',
  sage: '--sage',
  sageDark: '--sage-dark',
  sageDeep: '--sage-deep',
  sageLight: '--sage-light',
  sagePale: '--sage-pale',
  sageBorder: '--sage-border',
  gold: '--gold',
  goldLight: '--gold-light',
  goldPale: '--gold-pale',
  border: '--border',
  textDark: '--text-dark',
  textMid: '--text-mid',
  textLight: '--text-light',
  scratchStart: '--scratch-start',
  scratchMid: '--scratch-mid',
  scratchEnd: '--scratch-end',
  heroGlowOpacity: '--hero-glow-opacity',
};

const PRESET_MAP = Object.fromEntries(
  (paletteFile.presets || []).map((p) => [p.id, p]),
);

/** Accept preset id ("blush-gold") or label ("Blush & Gold") from data.json / editor. */
export function resolvePaletteId(raw) {
  if (!raw) return DEFAULT_PALETTE_ID;
  const value = String(raw).trim();
  if (!value) return DEFAULT_PALETTE_ID;
  if (value === 'custom') return 'custom';
  if (PRESET_MAP[value]) return value;

  const lower = value.toLowerCase();
  const presets = paletteFile.presets || [];

  const byId = presets.find((p) => p.id.toLowerCase() === lower);
  if (byId) return byId.id;

  const byLabel = presets.find((p) => String(p.label || '').trim().toLowerCase() === lower);
  if (byLabel) return byLabel.id;

  const slug = lower.replace(/&/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  const bySlug = presets.find((p) => p.id === slug);
  if (bySlug) return bySlug.id;

  return DEFAULT_PALETTE_ID;
}

export function getPalettePresets() {
  return paletteFile.presets || [];
}

export function parseHex(hex) {
  const raw = String(hex || '').replace('#', '').trim();
  if (raw.length === 3) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16),
    ];
  }
  if (raw.length !== 6) {
    return parseHex(PRESET_MAP[DEFAULT_PALETTE_ID]?.tokens?.sage || '#E2B4B1');
  }
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

export function rgbToHex(rgb) {
  return `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;
}

function mixRgb(a, b, weightA) {
  const w = weightA;
  return [
    a[0] * w + b[0] * (1 - w),
    a[1] * w + b[1] * (1 - w),
    a[2] * w + b[2] * (1 - w),
  ];
}

function luminance(rgb) {
  const [rs, gs, bs] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbaString(rgb, alpha) {
  const [r, g, b] = rgb.map((c) => Math.round(c));
  return `rgba(${r},${g},${b},${alpha})`;
}

function rgbCsv(rgb) {
  return rgb.map((c) => Math.round(c)).join(',');
}

function normalizeTokenHex(hex) {
  const rgb = parseHex(hex);
  return rgbToHex(rgb);
}

function tokensFromRecord(record) {
  const out = {};
  for (const key of TOKEN_SCHEMA) {
    if (record?.[key] != null && record[key] !== '') {
      out[key] = key === 'heroGlowOpacity' ? String(record[key]) : normalizeTokenHex(record[key]);
    }
  }
  return out;
}

function validateTokens(tokens, presetId = 'unknown') {
  const missing = TOKEN_SCHEMA.filter((key) => tokens[key] == null || tokens[key] === '');
  if (missing.length) {
    console.warn(`[blushtheme] Palette "${presetId}" missing tokens: ${missing.join(', ')}`);
  }
  return tokens;
}

function pickDisplayOn(backgroundRgb, darkRgb) {
  if (contrastRatio(WHITE, backgroundRgb) >= 3) return rgbToHex(WHITE);
  return rgbToHex(darkRgb);
}

function pickLabelColor(accent, primary, background) {
  const candidates = [
    accent,
    mixRgb(primary, [0, 0, 0], 0.55),
    mixRgb(primary, [0, 0, 0], 0.35),
    mixRgb(accent, [0, 0, 0], 0.45),
  ];
  for (const candidate of candidates) {
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return mixRgb(primary, [0, 0, 0], 0.55);
}

function pickLightAccentColor(accent, primary, darkBackground) {
  const candidates = [
    accent,
    mixRgb(accent, WHITE, 0.35),
    mixRgb(primary, WHITE, 0.78),
    WHITE,
  ];
  for (const candidate of candidates) {
    if (contrastRatio(candidate, darkBackground) >= 4.5) return candidate;
  }
  return mixRgb(accent, WHITE, 0.35);
}

function buildScratchGradient(primary, sageDark, sageBorder) {
  if (luminance(primary) < 0.2) {
    return {
      start: rgbToHex(mixRgb(primary, WHITE, 0.1)),
      mid: rgbToHex(mixRgb(primary, [0, 0, 0], 0.55)),
      end: rgbToHex(mixRgb(primary, [0, 0, 0], 0.35)),
    };
  }
  return {
    start: rgbToHex(sageBorder),
    mid: rgbToHex(sageDark),
    end: rgbToHex(sageBorder),
  };
}

function isDarkPrimary(primary) {
  return luminance(primary) < 0.12;
}

function ensureButtonDepth(rgb) {
  let out = [...rgb];
  let tries = 0;
  while (luminance(out) > 0.28 && tries < 8) {
    out = mixRgb(out, [0, 0, 0], 0.82);
    tries += 1;
  }
  return out;
}

function ensureReadableOnCream(rgb, creamRgb) {
  let out = [...rgb];
  let tries = 0;
  while (contrastRatio(out, creamRgb) < 4.5 && tries < 10) {
    out = mixRgb(out, [0, 0, 0], 0.9);
    tries += 1;
  }
  return out;
}

/** Custom mode only — derived fallback when user picks two colours. */
export function deriveTokens(primaryHex, accentHex) {
  const p = parseHex(primaryHex);
  const a = parseHex(accentHex);
  const black = [0, 0, 0];

  const sage = p;
  const sageDark = mixRgb(p, black, 0.78);
  const sageDeep = ensureButtonDepth(mixRgb(p, black, 0.62));
  const sageLight = mixRgb(p, WHITE, 0.35);
  const sagePale = mixRgb(mixRgb(p, WHITE, 0.93), CREAM, 0.55);
  const sageBorder = mixRgb(p, WHITE, 0.28);

  const cream = CREAM;
  const darkTheme = isDarkPrimary(p);
  const cream2 = darkTheme
    ? mixRgb(mixRgb(p, cream, 0.42), WHITE, 0.04)
    : mixRgb(CREAM, mixRgb(p, WHITE, 0.94), 0.65);
  const cream3 = darkTheme
    ? mixRgb(mixRgb(p, cream, 0.28), CREAM_3_BASE, 0.55)
    : mixRgb(CREAM_3_BASE, mixRgb(p, WHITE, 0.86), 0.4);
  const heroBg = darkTheme ? mixRgb(p, cream, 0.58) : cream2;
  const border = mixRgb(BORDER_BASE, sageBorder, 0.45);
  const scratch = buildScratchGradient(p, sageDark, sageBorder);

  const gold = pickLabelColor(a, p, cream);
  const goldLight = pickLightAccentColor(a, p, sageDeep);
  const goldPale = mixRgb(gold, WHITE, 0.76);

  const textDark = ensureReadableOnCream(
    luminance(p) > 0.35 ? mixRgb(p, black, 0.55) : mixRgb(p, black, 0.25),
    cream,
  );
  const textMid = mixRgb(textDark, border, 0.45);
  const textLight = mixRgb(textMid, cream, 0.35);

  return {
    cream: rgbToHex(cream),
    cream2: rgbToHex(cream2),
    cream3: rgbToHex(cream3),
    heroBg: rgbToHex(heroBg),
    sage: rgbToHex(sage),
    sageDark: rgbToHex(sageDark),
    sageDeep: rgbToHex(sageDeep),
    sageLight: rgbToHex(sageLight),
    sagePale: rgbToHex(sagePale),
    sageBorder: rgbToHex(sageBorder),
    gold: rgbToHex(gold),
    goldLight: rgbToHex(goldLight),
    goldPale: rgbToHex(goldPale),
    border: rgbToHex(border),
    textDark: rgbToHex(textDark),
    textMid: rgbToHex(textMid),
    textLight: rgbToHex(textLight),
    scratchStart: scratch.start,
    scratchMid: scratch.mid,
    scratchEnd: scratch.end,
    heroGlowOpacity: darkTheme ? '0.38' : '0.18',
  };
}

export function resolveTokens(siteData) {
  const data = siteData && typeof siteData === 'object' ? siteData : {};
  const paletteId = resolvePaletteId(data.colorPalette);
  const fallback = PRESET_MAP[DEFAULT_PALETTE_ID] || paletteFile.presets?.[0];

  if (paletteId === 'custom') {
    const primary = data.customPrimaryColor || fallback?.primary || '#E2B4B1';
    const accent = data.customAccentColor || fallback?.accent || '#D4AF37';
    return deriveTokens(primary, accent);
  }

  const preset = PRESET_MAP[paletteId] || fallback;
  return validateTokens(tokensFromRecord(preset?.tokens || {}), preset?.id || paletteId);
}

export function resolvePrimaryAccent(siteData) {
  const data = siteData && typeof siteData === 'object' ? siteData : {};
  const paletteId = resolvePaletteId(data.colorPalette);
  const fallback = PRESET_MAP[DEFAULT_PALETTE_ID] || paletteFile.presets?.[0];

  if (paletteId === 'custom') {
    return {
      primary: data.customPrimaryColor || fallback?.primary || '#E2B4B1',
      accent: data.customAccentColor || fallback?.accent || '#D4AF37',
    };
  }

  const preset = PRESET_MAP[paletteId] || fallback;
  return {
    primary: preset?.primary || '#E2B4B1',
    accent: preset?.accent || '#D4AF37',
  };
}

export function buildThemeFromTokens(tokens, accentHex) {
  const sage = parseHex(tokens.sage);
  const sageDark = parseHex(tokens.sageDark);
  const sageDeep = parseHex(tokens.sageDeep);
  const textDark = parseHex(tokens.textDark);
  const accent = parseHex(accentHex || tokens.gold);

  const cssVars = {
    [TOKEN_TO_CSS.cream]: tokens.cream,
    [TOKEN_TO_CSS.cream2]: tokens.cream2,
    [TOKEN_TO_CSS.cream3]: tokens.cream3,
    [TOKEN_TO_CSS.heroBg]: tokens.heroBg,
    [TOKEN_TO_CSS.heroGlowOpacity]: tokens.heroGlowOpacity,
    [TOKEN_TO_CSS.sage]: tokens.sage,
    [TOKEN_TO_CSS.sageDark]: tokens.sageDark,
    [TOKEN_TO_CSS.sageDeep]: tokens.sageDeep,
    [TOKEN_TO_CSS.sageLight]: tokens.sageLight,
    [TOKEN_TO_CSS.sagePale]: tokens.sagePale,
    [TOKEN_TO_CSS.sageBorder]: tokens.sageBorder,
    [TOKEN_TO_CSS.gold]: tokens.gold,
    [TOKEN_TO_CSS.goldLight]: tokens.goldLight,
    [TOKEN_TO_CSS.goldPale]: tokens.goldPale,
    [TOKEN_TO_CSS.border]: tokens.border,
    [TOKEN_TO_CSS.textDark]: tokens.textDark,
    [TOKEN_TO_CSS.textMid]: tokens.textMid,
    [TOKEN_TO_CSS.textLight]: tokens.textLight,
    [TOKEN_TO_CSS.scratchStart]: tokens.scratchStart,
    [TOKEN_TO_CSS.scratchMid]: tokens.scratchMid,
    [TOKEN_TO_CSS.scratchEnd]: tokens.scratchEnd,
    '--primary-rgb': rgbCsv(sage),
    '--primary-dark-rgb': rgbCsv(sageDark),
    '--primary-deep-rgb': rgbCsv(sageDeep),
    '--accent-rgb': rgbCsv(accent),
    '--on-deep-color': pickDisplayOn(sageDeep, textDark),
    '--focus-ring': rgbaString(accent, 0.18),
    '--shadow': `0 24px 64px -12px ${rgbaString(sageDeep, 0.12)}`,
    '--shadow-sm': `0 8px 24px ${rgbaString(sageDeep, 0.06)}`,
    '--shadow-md': `0 16px 48px -8px ${rgbaString(sageDeep, 0.14)}`,
  };

  const scratchGradient = {
    start: tokens.scratchStart,
    mid: tokens.scratchMid,
    end: tokens.scratchEnd,
  };

  return {
    cssVars,
    confettiColors: [tokens.sage, tokens.cream, tokens.gold, tokens.sageDark],
    petalColors: [tokens.sageLight, tokens.sageBorder, tokens.sage, '#FFFFFF', tokens.goldPale],
    scratchGradient,
  };
}

export function resolveThemeFromSiteData(siteData) {
  const tokens = resolveTokens(siteData);
  const { accent } = resolvePrimaryAccent(siteData);
  return buildThemeFromTokens(tokens, accent);
}

export function applyThemeFromSiteData(siteData) {
  if (typeof document === 'undefined') return resolveThemeFromSiteData(siteData);
  const theme = resolveThemeFromSiteData(siteData);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.cssVars)) {
    root.style.setProperty(key, value);
  }
  return theme;
}

/** Inline <head> script — apply palette before React hydrates (reads data.json on the server). */
export function buildBlockingThemeScript(siteData) {
  const theme = resolveThemeFromSiteData(siteData);
  const assignments = Object.entries(theme.cssVars)
    .map(([key, value]) => `document.documentElement.style.setProperty(${JSON.stringify(key)},${JSON.stringify(value)});`)
    .join('');
  return `(function(){${assignments}})();`;
}

/** @deprecated use resolveThemeFromSiteData */
export function buildThemeFromColors(primaryHex, accentHex) {
  const tokens = deriveTokens(primaryHex, accentHex);
  return buildThemeFromTokens(tokens, accentHex);
}

/** @deprecated use resolveThemeFromSiteData */
export function resolveThemeColors(paletteId, customPrimary, customAccent) {
  return resolveThemeFromSiteData({
    colorPalette: paletteId,
    customPrimaryColor: customPrimary,
    customAccentColor: customAccent,
  });
}

/** @deprecated use applyThemeFromSiteData */
export function applyThemeToDocument(paletteId, customPrimary, customAccent) {
  return applyThemeFromSiteData({
    colorPalette: paletteId,
    customPrimaryColor: customPrimary,
    customAccentColor: customAccent,
  });
}
