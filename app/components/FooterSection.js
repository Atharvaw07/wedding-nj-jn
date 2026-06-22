'use client';

import { isSectionVisible } from '../lib/sectionVisibility';
import { footerHasContent, hasText } from '../lib/fieldPresent';
import MultilineBlock from './MultilineBlock';

export default function FooterSection({ footer, visibility }) {
  if (!isSectionVisible('footer', footer, visibility) || !footerHasContent(footer)) return null;

  return (
    <section id="footer-section">
      <div className="tc reveal revealed">
        <MultilineBlock
          text={footer.message}
          limitsKey="footer.message"
          asParagraph
          wrapperClassName="footer-msg"
        />
        {hasText(footer.regards) ? <span className="footer-regards">Warm regards,</span> : null}
        <MultilineBlock
          text={footer.regards}
          limitsKey="footer.regards"
          inline
          wrapperClassName="footer-subheading"
        />
        {footer.couple ? (
          <span className="footer-name" style={{ marginTop: '3rem' }}>
            {footer.couple}
          </span>
        ) : null}
        <div className="footer-credit">
          <a href="https://www.instagram.com/invitevibes_" target="_blank" rel="noopener noreferrer">
            Made with ❤️ by Invite Vibes
          </a>
        </div>
      </div>
    </section>
  );
}
