/** Global section heading fonts — ids match backend/src/data/fontVariants.json */

export const HEADING_FONTS_GOOGLE_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap';

export const DEFAULT_HEADING_FONT_ID = 'pinyon-script';

const BY_ID = {
  'great-vibes': "'Great Vibes', cursive",
  'cormorant-garamond': "'Cormorant Garamond', Georgia, serif",
  'pinyon-script': "'Pinyon Script', cursive",
  'playfair-display': "'Playfair Display', Georgia, serif",
};

export function resolveHeadingFontFamily(fontId) {
  return BY_ID[fontId] || BY_ID[DEFAULT_HEADING_FONT_ID];
}
