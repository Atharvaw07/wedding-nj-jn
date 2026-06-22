'use client';

import { isSectionVisible } from '../lib/sectionVisibility';
import { coupleBlockHasContent, hasMediaUrl, heroHasContent } from '../lib/fieldPresent';
import { getOrderedPartnerKeys } from '../lib/heroCoupleDisplay';
import { shouldShowSectionPlaceholder } from '../lib/editorPreviewHelpers';
import EditorSectionPlaceholder from './EditorSectionPlaceholder';
import MultilineBlock from './MultilineBlock';
import DeferredImg from './DeferredImg';

export default function HeroSection({ hero, onScrollDown, visibility, editorPreview = false }) {
  if (!isSectionVisible('hero', hero, visibility)) return null;
  if (shouldShowSectionPlaceholder(editorPreview, 'hero', hero, visibility, heroHasContent(hero))) {
    return <EditorSectionPlaceholder sectionId="hero" />;
  }

  const {
    ganeshImageUrl,
    godQuote,
    introLine1,
    connector = '&',
  } = hero;

  const partnerOrder = getOrderedPartnerKeys(hero);
  const visiblePartners = partnerOrder.filter((key) => coupleBlockHasContent(hero?.[key]));
  const showAmp = visiblePartners.length > 1;

  return (
    <section id="hero">
      <div className="hero-corner">
        <span />
      </div>
      <div className="hero-card reveal revealed">
        {hasMediaUrl(ganeshImageUrl) ? (
          <DeferredImg
            src={ganeshImageUrl}
            alt="Religious symbol"
            className="hero-icon ganesha-icon"
            width={70}
            height={70}
            sequential={false}
          />
        ) : null}

        <MultilineBlock
          text={godQuote}
          limitsKey="hero.godQuote"
          asParagraph
          wrapperClassName="god-quote"
        />

        <MultilineBlock
          text={introLine1}
          limitsKey="hero.introLine1"
          asParagraph
          wrapperClassName="intro-text"
        />

        {visiblePartners.map((roleKey, index) => {
          const partner = hero?.[roleKey];
          return (
            <div key={roleKey} className="hero-couple-partner">
              {index > 0 && showAmp ? (
                <div className="amp-row">
                  <div className="amp-line" />
                  <span className="amp">{connector}</span>
                  <div className="amp-line" />
                </div>
              ) : null}
              <div className="couple-block">
                {partner?.name ? <span className="couple-name shimmer">{partner.name}</span> : null}
                <MultilineBlock
                  text={partner?.familyLine}
                  limitsKey={`hero.${roleKey}.familyLine`}
                  inline
                  wrapperClassName="parent-sub"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="scroll-indicator" onClick={onScrollDown} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onScrollDown?.()}>
        <span>Scroll to Reveal</span>
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
