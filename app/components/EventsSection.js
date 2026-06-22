'use client';

import { useLayoutEffect, useRef } from 'react';
import { isSectionVisible } from '../lib/sectionVisibility';
import { eventItemHasContent, hasText } from '../lib/fieldPresent';
import { ensureArray } from '../mergeSiteData';
import { eventsHasContent, shouldShowSectionPlaceholder } from '../lib/editorPreviewHelpers';
import EditorSectionPlaceholder from './EditorSectionPlaceholder';
import { formatMultilineText, getFieldLimits } from '../lib/textLayout';
import MultilineBlock from './MultilineBlock';
import DeferredImg from './DeferredImg';
import DeferredEventVideo from './DeferredEventVideo';

const INVITE_STYLES = new Set(['arch', 'sunset', 'light', 'dark']);

function formatEventTitle(title) {
  const lines = formatMultilineText(title, getFieldLimits('events.items.title'));
  return lines[0] ?? '';
}

function eventTitleIsMultiline(el) {
  if (!el?.textContent?.trim()) return false;
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getClientRects().length > 1;
}

function EventInviteTitle({ children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      el.classList.toggle('is-multiline', eventTitleIsMultiline(el));
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <h3 ref={ref} className="event-invite-title">
      {children}
    </h3>
  );
}

function dressCodeNamesDisplay(names) {
  if (names == null || names === '') return '';
  if (typeof names === 'string') return names;
  if (Array.isArray(names)) return names.filter(Boolean).map(String).join(' · ');
  return '';
}

function isVideoSrc(src) {
  if (!src || typeof src !== 'string') return false;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(src);
}

function formatEventDateParts(dateStr) {
  if (!dateStr) return { weekday: '', dateNumber: '', monthYear: '' };
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { weekday: '', dateNumber: '', monthYear: '' };
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    dateNumber: String(d.getDate()),
    monthYear: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  };
}

function EventCard({ item }) {
  const style = INVITE_STYLES.has(item.inviteStyle) ? item.inviteStyle : 'light';
  const frameClass = `event-invite-frame event-invite--${style}`;
  const derived = formatEventDateParts(item.date);
  const weekday = item.weekday || derived.weekday;
  const dateNumber = item.dateNumber || derived.dateNumber;
  const monthYear = item.monthYear || derived.monthYear;
  const showVideo = item.image && isVideoSrc(item.image);
  const titleText = formatEventTitle(item.title);
  const showDateRow = weekday || dateNumber || monthYear;
  const showDressCode =
    item.dressCode?.enabled &&
    (item.dressCode.colors?.length > 0 ||
      hasText(dressCodeNamesDisplay(item.dressCode.names)) ||
      hasText(item.dressCode.label));
  const showVenue = hasText(item.venue) || hasText(item.mapsUrl);

  return (
    <div className="event-block reveal revealed">
      <div className={frameClass}>
        {item.image && showVideo ? (
          <DeferredEventVideo className="event-invite-bg" src={item.image} />
        ) : item.image ? (
          <DeferredImg className="event-invite-bg" src={item.image} alt="" sequential />
        ) : null}

        <div className="event-invite-overlay">
          <div className="event-invite-stack">
            {titleText ? <EventInviteTitle>{titleText}</EventInviteTitle> : null}

            {showDateRow ? (
              <div className="event-date-row">
                {weekday ? <span>{weekday}</span> : null}
                {weekday && dateNumber ? <span className="event-date-bar">|</span> : null}
                {dateNumber ? <span className="event-date-num">{dateNumber}</span> : null}
                {dateNumber && monthYear ? <span className="event-date-bar">|</span> : null}
                {monthYear ? <span>{monthYear}</span> : null}
              </div>
            ) : null}

            {item.time ? <p className="event-invite-time">{item.time}</p> : null}
          </div>
        </div>
      </div>

      <div
        className="evt-details reveal reveal-d1"
        style={
          item.highlighted
            ? { borderColor: 'var(--gold-light)', background: 'linear-gradient(135deg, var(--sage-pale), var(--white))' }
            : {}
        }
      >
        <MultilineBlock
          text={item.description}
          limitsKey="events.items.description"
          asParagraph
          wrapperClassName="evt-tagline"
        />

        {showDressCode ? (
          <div className="evt-dresscode">
            <span className="evt-dresscode-lbl">Dress code</span>
            <div className="evt-dresscode-dots">
              {item.dressCode.colors?.map((color, i) => (
                <span key={i} className="evt-dresscode-dot" style={{ background: color }} />
              ))}
            </div>
            <span className="evt-dresscode-names">{dressCodeNamesDisplay(item.dressCode.names)}</span>
            {item.dressCode.label ? <span className="evt-dresscode-note">{item.dressCode.label}</span> : null}
          </div>
        ) : null}

        {showVenue ? (
          <div className="evt-venue">
            {item.venue ? <span className="evt-venue-name">{item.venue}</span> : null}
            {item.mapsUrl ? (
              <a className="evt-dir-btn" href={item.mapsUrl} target="_blank" rel="noopener noreferrer">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Get Directions
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function EventsSection({ events, visibility, editorPreview = false }) {
  const items = (events?.items || []).filter(eventItemHasContent);

  if (!isSectionVisible('events', events, visibility)) return null;
  if (items.length === 0) {
    if (shouldShowSectionPlaceholder(
      editorPreview,
      'events',
      events,
      visibility,
      eventsHasContent(events, ensureArray, eventItemHasContent),
    )) {
      return <EditorSectionPlaceholder sectionId="events" />;
    }
    return null;
  }

  const showHeader = hasText(events?.subheading) || hasText(events?.heading);

  return (
    <section id="events-section">
      {showHeader ? (
        <div className="tc reveal revealed" style={{ marginBottom: '1rem' }}>
          {hasText(events.subheading) ? <span className="sec-label">{events.subheading}</span> : null}
          {hasText(events.heading) ? <h2 className="sec-heading">{events.heading}</h2> : null}
        </div>
      ) : null}

      {items.map((item, i) => (
        <EventCard key={i} item={item} />
      ))}
    </section>
  );
}
