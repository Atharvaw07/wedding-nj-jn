'use client';

import { formatMultilineText, getFieldLimits } from '../lib/textLayout';

/**
 * Renders schema-limited multiline copy as stacked lines (live site).
 */
export default function MultilineBlock({
  text,
  limitsKey,
  wrapperClassName,
  lineClassName,
  asParagraph,
  inline,
  ariaHidden,
}) {
  const lines = formatMultilineText(text, getFieldLimits(limitsKey));
  if (!lines.length) return null;

  const ariaProps = ariaHidden ? { 'aria-hidden': true } : {};

  if (inline) {
    return (
      <span className={wrapperClassName} {...ariaProps}>
        {lines.map((line, i) => (
          <span key={i}>
            {line || '\u00A0'}
            {i < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    );
  }

  if (asParagraph) {
    return (
      <p className={wrapperClassName}>
        {lines.map((line, i) => (
          <span key={i}>
            {line || '\u00A0'}
            {i < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={wrapperClassName}>
      {lines.map((line, i) => (
        <span key={i} className={lineClassName}>
          {line || '\u00A0'}
          {i < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </div>
  );
}
