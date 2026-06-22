'use client';

import { isSectionVisible } from '../lib/sectionVisibility';
import { hasMediaUrl, hasText, formatVenueAddressDisplay } from '../lib/fieldPresent';
import { shouldShowSectionPlaceholder, venueHasContent } from '../lib/editorPreviewHelpers';
import EditorSectionPlaceholder from './EditorSectionPlaceholder';
import MultilineBlock from './MultilineBlock';
import DeferredImg from './DeferredImg';

export default function VenueSection({ venue, visibility, editorPreview = false }) {
  if (!isSectionVisible('venue', venue, visibility)) return null;
  if (shouldShowSectionPlaceholder(editorPreview, 'venue', venue, visibility, venueHasContent(venue))) {
    return <EditorSectionPlaceholder sectionId="venue" />;
  }

  return (
    <section id="venue-section">
      <div className="text-center reveal revealed">
        <span className="sec-label">{venue?.subheading || 'Where We Gather'}</span>
        <h2 className="sec-heading">{venue?.heading || 'The Venue'}</h2>
      </div>

      <div className="venue-card reveal reveal-delay-1">
        <div className="card-corner tl" />
        <div className="card-corner tr" />
        <div className="card-corner bl" />
        <div className="card-corner br" />

        {hasMediaUrl(venue?.image) ? (
          <div className="venue-img-wrap">
            <DeferredImg src={venue.image} alt={venue?.name || 'Venue'} sequential />
          </div>
        ) : null}

        {venue?.name ? <p className="venue-name">{venue.name}</p> : null}
        <MultilineBlock
          text={formatVenueAddressDisplay(venue?.address, venue?.mapsUrl)}
          limitsKey="venue.address"
          asParagraph
          wrapperClassName="venue-addr"
        />
        {venue?.mapsUrl ? (
          <a className="venue-btn" href={venue.mapsUrl} target="_blank" rel="noopener noreferrer">
            {venue?.buttonLabel || 'View on Maps'}
          </a>
        ) : null}
      </div>
    </section>
  );
}
