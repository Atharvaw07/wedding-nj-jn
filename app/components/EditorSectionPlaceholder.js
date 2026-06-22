'use client';

import { SECTION_COPY } from '../lib/editorPreviewHelpers';

function Skeleton({ variant }) {
  if (variant === 'story-cards') {
    return (
      <div className="iv-editor-placeholder__story">
        <div className="iv-editor-placeholder__polaroid" />
        <div className="iv-editor-placeholder__polaroid iv-editor-placeholder__polaroid--alt" />
        <div className="iv-editor-placeholder__polaroid" />
      </div>
    );
  }

  if (variant === 'venue-card') {
    return (
      <div className="iv-editor-placeholder__venue">
        <div className="iv-editor-placeholder__venue-img" />
        <div className="iv-editor-placeholder__line iv-editor-placeholder__line--short" />
        <div className="iv-editor-placeholder__line" />
      </div>
    );
  }

  if (variant === 'event-cards') {
    return (
      <div className="iv-editor-placeholder__events">
        <div className="iv-editor-placeholder__event-card" />
        <div className="iv-editor-placeholder__event-card" />
      </div>
    );
  }

  if (variant === 'countdown') {
    return (
      <div className="iv-editor-placeholder__countdown">
        {['Days', 'Hrs', 'Mins', 'Secs'].map((label) => (
          <div key={label} className="iv-editor-placeholder__countdown-block">
            <div className="iv-editor-placeholder__countdown-num">00</div>
            <div className="iv-editor-placeholder__countdown-label">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="iv-editor-placeholder__text">
      <div className="iv-editor-placeholder__line iv-editor-placeholder__line--short" />
      <div className="iv-editor-placeholder__line" />
      <div className="iv-editor-placeholder__line iv-editor-placeholder__line--medium" />
    </div>
  );
}

export default function EditorSectionPlaceholder({ sectionId, copy, className = '' }) {
  const meta = copy || SECTION_COPY[sectionId] || {
    title: 'Section',
    hint: 'Fill in this section in your form.',
    variant: 'text-block',
  };

  return (
    <section
      className={`iv-editor-placeholder iv-editor-placeholder--${meta.variant} ${className}`.trim()}
      data-section={sectionId}
      aria-label={`${meta.title} placeholder`}
    >
      <div className="iv-editor-placeholder__inner">
        <p className="iv-editor-placeholder__eyebrow">Waiting for your content</p>
        <h2 className="iv-editor-placeholder__title">{meta.title}</h2>
        <p className="iv-editor-placeholder__hint">{meta.hint}</p>
        <Skeleton variant={meta.variant} />
      </div>
    </section>
  );
}
