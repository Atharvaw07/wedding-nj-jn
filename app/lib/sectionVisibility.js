/**
 * Whether a website section should render.
 * Honors editor `_visibility` map and per-section `enabled` flag.
 */
export function isSectionVisible(sectionId, section, visibilityMap) {
  if (visibilityMap && visibilityMap[sectionId] === false) return false;
  if (!section || typeof section !== 'object' || Array.isArray(section)) return false;
  if (section.enabled === false) return false;
  return true;
}
