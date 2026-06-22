'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isSectionVisible } from '../lib/sectionVisibility';
import { ensureArray } from '../mergeSiteData';
import { hasMediaUrl, hasText, storyItemHasContent, storySlideHasContent } from '../lib/fieldPresent';
import { shouldShowSectionPlaceholder, storyHasContent } from '../lib/editorPreviewHelpers';
import EditorSectionPlaceholder from './EditorSectionPlaceholder';
import MultilineBlock from './MultilineBlock';
import DeferredImg from './DeferredImg';

const FRAME_LOOP_MS = 4500;
const POLAROID_ROTATIONS = [-3.5, 4.8, -2.6, 5.2, -4.2];

function isVideoUrl(src) {
  if (!src || typeof src !== 'string') return false;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(src);
}

function StoryFrameHeader({ story }) {
  return (
    <div className="text-center reveal revealed">
      {hasText(story?.subheading) ? <span className="sec-label">{story.subheading}</span> : null}
      {hasText(story?.heading) ? <h2 className="sec-heading">{story.heading}</h2> : null}
    </div>
  );
}

function StoryFrameMedia({ src, active, eager, defer = true }) {
  if (!hasMediaUrl(src)) return null;
  if (isVideoUrl(src)) {
    if (!defer) {
      return (
        <video autoPlay={active} loop muted playsInline src={src} preload={eager ? 'auto' : 'metadata'} />
      );
    }
    return (
      <video
        autoPlay={active}
        loop
        muted
        playsInline
        preload="none"
        data-seq
        {...(active ? { 'data-autoplay': true } : {})}
      >
        <source data-src={src} type="video/mp4" />
      </video>
    );
  }
  return <DeferredImg src={src} alt="" sequential defer={defer} loading={undefined} />;
}

function StoryFrameView({ story, eagerImages }) {
  const mediaList = useMemo(
    () => ensureArray(story?.slides).filter(storySlideHasContent).map((s) => s.media).filter(hasMediaUrl),
    [story?.slides]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [mediaList.length, mediaList.join('|')]);

  useEffect(() => {
    if (mediaList.length < 2) return undefined;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % mediaList.length);
    }, FRAME_LOOP_MS);
    return () => window.clearInterval(id);
  }, [mediaList]);

  if (mediaList.length === 0) return null;

  return (
    <section id="story-frame-section">
      <StoryFrameHeader story={story} />

      <div className="story-frame-wrap reveal revealed">
        <div className="story-frame-inner">
          <div className="story-frame-stack">
            {mediaList.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className={`story-frame-layer${i === index ? ' active' : ''}`}
                aria-hidden={i !== index}
              >
                <StoryFrameMedia
                  src={src}
                  active={i === index}
                  eager={eagerImages && i === 0}
                  defer={!(eagerImages && i === 0)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasText(story?.footnote) ? (
        <p className="story-frame-footnote reveal revealed">{story.footnote}</p>
      ) : null}
    </section>
  );
}

/** Platform preview — all polaroids visible; scroll animation runs on the live site only. */
function StoryPolaroidsPreviewView({ story, visibility, editorPreview }) {
  const sectionOn = isSectionVisible('story', story, visibility);
  const items = ensureArray(story?.items).filter(storyItemHasContent);

  if (!sectionOn) return null;
  if (items.length === 0) {
    if (shouldShowSectionPlaceholder(editorPreview, 'story', story, visibility, false)) {
      return <EditorSectionPlaceholder sectionId="story" />;
    }
    return null;
  }

  return (
    <section id="story-section" className="story-section--preview">
      <div className="story-preview-layout">
        {hasText(story?.subheading) ? <span className="sec-label">{story.subheading}</span> : null}
        {hasText(story?.heading) ? <h2 className="sec-heading">{story.heading}</h2> : null}

        <p className="story-preview-hint">
          Preview shows all cards at once. The scroll animation plays on your published website.
        </p>

        <ul className="story-preview-cards">
          {items.map((item, i) => (
            <li
              key={`${item.image || 'card'}-${i}`}
              className="story-preview-card"
              style={{ '--r': `${POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]}deg` }}
            >
              {item.image ? (
                <DeferredImg src={item.image} alt={item.caption || ''} sequential defer={false} />
              ) : (
                <div className="story-preview-card-placeholder" aria-hidden />
              )}
              {hasText(item.caption) ? (
                <p className="story-preview-card-caption">{item.caption}</p>
              ) : null}
              {hasText(item.text) ? (
                <p className="story-preview-card-text">
                  <MultilineBlock text={item.text} limitsKey="story.items.text" inline />
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StoryPolaroidsView({ story, visibility, eagerImages }) {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionOn = isSectionVisible('story', story, visibility);
  const items = ensureArray(story?.items).filter(storyItemHasContent);

  useEffect(() => {
    if (!sectionOn || items.length === 0) return undefined;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const section = sectionRef.current;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const stableVh = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--stable-vh')
      );
      const innerH = stableVh > 0 ? stableVh : window.innerHeight;
      const range = Math.max(1, section.offsetHeight - innerH);
      const raw = (window.scrollY - top) / range;
      const idx = Math.round(Math.max(0, Math.min(1, raw)) * (items.length - 1));
      setActiveIndex(idx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionOn, items.length]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(Math.max(0, items.length - 1));
  }, [activeIndex, items.length]);

  if (!sectionOn || items.length === 0) return null;

  const active = items[activeIndex] || items[0];

  return (
    <section id="story-section" ref={sectionRef}>
      <div className="story-sticky">
        <div className="story-text">
          {hasText(story?.subheading) ? <span className="sec-label">{story.subheading}</span> : null}
          {hasText(story?.heading) ? <h2 className="sec-heading">{story.heading}</h2> : null}
          {hasText(active?.caption) ? <span className="story-chapter">{active.caption}</span> : null}
          <p className="story-p">
            <MultilineBlock text={active?.text} limitsKey="story.items.text" inline />
          </p>
        </div>

        <div className="ls-stack">
          {items.map((item, i) => {
            let className = 'ls-card';
            const style = {};

            if (i < activeIndex) {
              className += ' stacked';
              style['--d'] = activeIndex - i;
            } else if (i === activeIndex) {
              className += ' visible';
            }

            return (
              <div key={i} className={className} style={style}>
                {item.image ? (
                  <DeferredImg src={item.image} alt={item.caption || ''} sequential />
                ) : null}
                {hasText(item.caption) ? (
                  <div className="ls-caption">
                    <span>{item.caption}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function StorySection({ story, visibility, eagerImages = false, editorPreview = false }) {
  const sectionOn = isSectionVisible('story', story, visibility);
  const mode = story?.displayMode === 'swiper' ? 'swiper' : 'polaroids';
  const isPlatformPreview = eagerImages;

  if (!sectionOn) return null;

  if (shouldShowSectionPlaceholder(
    editorPreview,
    'story',
    story,
    visibility,
    storyHasContent(story, ensureArray, storyItemHasContent, storySlideHasContent),
  )) {
    return <EditorSectionPlaceholder sectionId="story" />;
  }

  if (mode === 'swiper') {
    const mediaList = ensureArray(story?.slides).filter(storySlideHasContent);
    const hasHeader = hasText(story?.subheading) || hasText(story?.heading);
    if (!hasHeader && mediaList.length === 0) return null;
    return <StoryFrameView story={story} eagerImages={eagerImages} />;
  }

  if (isPlatformPreview) {
    return <StoryPolaroidsPreviewView story={story} visibility={visibility} editorPreview={editorPreview} />;
  }

  return <StoryPolaroidsView story={story} visibility={visibility} eagerImages={eagerImages} />;
}
