'use client';

import { useEffect } from 'react';
import { resolveHeadingFontFamily, DEFAULT_HEADING_FONT_ID } from '../headingFonts';

export default function HeadingFontStyle({ fontId }) {
  useEffect(() => {
    const family = resolveHeadingFontFamily(fontId || DEFAULT_HEADING_FONT_ID);
    document.documentElement.style.setProperty('--heading-font', family);
  }, [fontId]);

  return null;
}
