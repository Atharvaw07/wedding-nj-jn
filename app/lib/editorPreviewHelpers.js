import { isSectionVisible } from './sectionVisibility';
import { heroHasContent, hasText } from './fieldPresent';

export const SECTION_COPY = {
  hero: {
    title: 'Hero',
    hint: 'Add names, families, and your invite message in Hero.',
    variant: 'text-block',
  },
  story: {
    title: 'Love story',
    hint: 'Add photos and captions in Love Story.',
    variant: 'story-cards',
  },
  venue: {
    title: 'Venue',
    hint: 'Add ceremony details and a map link in Venue.',
    variant: 'venue-card',
  },
  events: {
    title: 'Events',
    hint: 'Add ceremony cards in Events.',
    variant: 'event-cards',
  },
  saveTheDate: {
    title: 'Save the date',
    hint: 'Set your wedding date in Save the Date.',
    variant: 'countdown',
  },
};

export function shouldShowSectionPlaceholder(editorPreview, sectionId, section, visibility, hasContent) {
  if (!editorPreview) return false;
  if (!isSectionVisible(sectionId, section, visibility)) return false;
  return !hasContent;
}

export function venueHasContent(venue) {
  if (!venue || typeof venue !== 'object') return false;
  const textKeys = ['heading', 'subheading', 'name', 'address', 'addressLine1', 'mapsUrl'];
  return textKeys.some((k) => typeof venue[k] === 'string' && venue[k].trim());
}

export function eventsHasContent(events, ensureArray, eventItemHasContent) {
  if (!events || typeof events !== 'object') return false;
  return ensureArray(events.items).some(eventItemHasContent);
}

export function storyHasContent(story, ensureArray, storyItemHasContent, storySlideHasContent) {
  if (!story || typeof story !== 'object') return false;
  if (hasText(story.heading) || hasText(story.subheading)) return true;
  const mode = story.displayMode === 'swiper' ? 'swiper' : 'polaroids';
  if (mode === 'swiper') {
    return ensureArray(story.slides).some(storySlideHasContent);
  }
  return ensureArray(story.items).some(storyItemHasContent);
}

export { heroHasContent };
