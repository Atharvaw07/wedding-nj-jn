import { readFileSync } from 'fs';
import path from 'path';
import './globals.css';
import { mussicaSwash } from './fonts/mussicaSwash';
import { HEADING_FONTS_GOOGLE_URL } from './headingFonts';
import { STABLE_VIEWPORT_INLINE_SCRIPT } from './lib/stableViewport';
import { buildBlockingThemeScript } from './colorPresets';
import { buildSiteMetadata, finalizeSiteData, SITE_META_PRESETS } from './lib/siteMetadata.js';

function readThemeSiteData() {
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

const siteMetaData = finalizeSiteData(readThemeSiteData(), 'blushtheme');
export const metadata = buildSiteMetadata(siteMetaData, SITE_META_PRESETS.blushtheme);

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  const themeScript = buildBlockingThemeScript(readThemeSiteData());

  return (
    <html lang="en" className={mussicaSwash.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: STABLE_VIEWPORT_INLINE_SCRIPT }} />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={HEADING_FONTS_GOOGLE_URL} rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Tenor+Sans&family=Italianno&family=Tangerine:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
