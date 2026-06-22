/**
 * Blush & Gold — strict JSON extraction (shared structure via themePromptCommon).
 */
const path = require('path');
const { buildStrictThemeInstructions } = require(path.join(
  __dirname,
  '../../backend/src/services/ai/themePromptCommon',
));
const { createThemePromptExport } = require(path.join(
  __dirname,
  '../../backend/src/services/ai/themePromptConfig',
));

const topLevelKeys = [
  'petalsEnabled', 'headingFont', 'audio', 'entry', 'hero',
  'saveTheDate', 'story', 'venue', 'events', 'rsvp', 'footer',
];

const fieldMapping = `
AUDIO / ENTRY / GLOBAL
• Keep template audio.src, entry.videoUrl, petalsEnabled, headingFont
• entry.initials: one letter each from couple names
• entry.message: SHORT envelope only (see ENTRY rules above)

HERO (hero)
• godQuote (Category A): preserve mantra/blessing script; template default if absent
• introLine1 (Category B): invitation MESSAGE ONLY — no bride/groom/parent names
  Example: "request your gracious presence and blessings on the auspicious occasion of the wedding ceremony of their beloved daughter"
• bride.name, groom.name: exactly as printed
• bride.familyLine, groom.familyLine: "Daughter/Son of Mr. … & Mrs. …" — one line each
• connector: "with", "&", or "and"
• displayOrder: bride-first | groom-first from patrika layout
• ganeshImageUrl: always ""

SAVE THE DATE (saveTheDate)
• weddingDate YYYY-MM-DD; scratchEnabled & countdownEnabled true unless patrika omits
• wording: short English scratch line

STORY (story)
• heading/subheading: Category C template defaults
• displayMode polaroids unless patrika implies video slider
• items[]: copy from template including dummy preview image URLs; slides[]: copy from template (video slider if present)

VENUE (venue)
• name, address, mapsUrl; venue.image ""

EVENTS (events.items[])
• Rebuild from patrika — one item per ceremony; sort by date then time
• title: exact ceremony name; eventType: catalog slug for card art only; image: ""

RSVP · FOOTER
• rsvp.wording, formFields, customQuestions as in template
• footer.message, regards, couple names`;

const extraBlocks = `
MULTI-FILE: merge names from one file and event dates from another into one events.items[].

CHAT SCREENSHOTS: extract wedding message text only — never put timestamps or sender names in hero, footer, or events.`;

module.exports = createThemePromptExport({
  templateId: 'blushtheme',
  displayName: 'Blush & Gold',
  topLevelKeys,
  fieldMapping,
  extraBlocks,
  preset: 'eventsItems',
  skipFieldTypes: ['entry-variant'],
  buildInstructions: buildStrictThemeInstructions,
  languagePolicy: {
    preserveOriginalLanguage: ['hero.godQuote'],
    templateHeadingIfNotEnglish: [
      'story.heading', 'story.subheading',
      'events.heading', 'events.subheading',
      'venue.heading', 'venue.subheading',
    ],
    templateDefaultIfNotEnglish: ['saveTheDate.wording', 'story.footnote'],
  },
});
