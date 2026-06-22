/**
 * Multiline text layout for the live blush site.
 *
 * Limits are defined per field in schema.json:
 *   maxLength  — editor + stored text cap
 *   maxLines   — max manual line breaks (split on \\n only)
 *
 * Line wrapping within each paragraph is left to CSS (text-align + container width)
 * so copy uses the full card width instead of breaking at a fixed character count.
 *
 * Paths: "entry.message", "hero.introLine1", "story.items.text", etc.
 */

import blushSchema from '../../schema.json';

const DEFAULT_WRAP = { maxLines: 4 };

function hasLayoutLimits(field) {
  return (
    field?.maxLength != null ||
    field?.maxLines != null ||
    field?.maxCharsPerLine != null
  );
}

function extractLimits(field) {
  return {
    maxLength: field.maxLength,
    maxLines: field.maxLines ?? DEFAULT_WRAP.maxLines,
  };
}

function walkFields(fields, prefix, map) {
  for (const field of fields || []) {
    if (field.hidden) continue;

    const path = prefix ? `${prefix}.${field.key}` : field.key;

    if (field.type === 'group') {
      walkFields(field.fields, path, map);
      continue;
    }

    if (field.type === 'subarray') {
      for (const sub of field.fields || []) {
        if (!hasLayoutLimits(sub)) continue;
        map[`${path}.${sub.key}`] = extractLimits(sub);
      }
      continue;
    }

    if (hasLayoutLimits(field)) {
      map[path] = extractLimits(field);
    }
  }
}

function buildLimitsMap() {
  const map = {};
  for (const section of blushSchema.sections || []) {
    const prefix = section.type === 'flat' ? '' : section.id;
    if (section.type === 'flat') {
      for (const field of section.fields || []) {
        if (hasLayoutLimits(field)) map[field.key] = extractLimits(field);
      }
    } else {
      walkFields(section.fields, prefix, map);
    }
  }
  return map;
}

const LIMITS_MAP = buildLimitsMap();

export function getFieldLimits(limitsKey) {
  return LIMITS_MAP[limitsKey] || DEFAULT_WRAP;
}

/** Split text into display lines (manual \\n only + maxLines / maxLength caps). */
export function formatMultilineText(raw, limits = DEFAULT_WRAP) {
  if (!raw?.trim()) return [];

  const maxLines = limits.maxLines ?? DEFAULT_WRAP.maxLines;
  let text = String(raw);
  if (limits.maxLength != null) text = text.slice(0, limits.maxLength);

  const lines = [];
  for (const segment of text.split('\n')) {
    lines.push(segment.trim() ? segment : '');
    if (lines.length >= maxLines) return lines.slice(0, maxLines);
  }

  return lines;
}

export function sanitizeInitial(initial) {
  const trimmed = String(initial ?? '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '';
}
