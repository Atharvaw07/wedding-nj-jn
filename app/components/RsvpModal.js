'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function RsvpModal({ type, onClose }) {
  const [mounted, setMounted] = useState(false);
  const isSuccess = type === 'success';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!type) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [type, onClose]);

  if (!mounted || !type) return null;

  return createPortal(
    <div
      id="rsvp-modal"
      className="open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rsvp-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-dismiss"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div
          className="modal-icon"
          style={{ background: isSuccess ? 'rgba(138,79,76,0.1)' : 'rgba(220,38,38,0.08)' }}
        >
          {isSuccess ? (
            <svg fill="none" stroke="var(--sage-deep)" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h3
          id="rsvp-modal-title"
          className="modal-title"
          style={{ color: isSuccess ? 'var(--sage-deep)' : '#dc2626' }}
        >
          {isSuccess ? 'Thank you!' : 'Oops!'}
        </h3>

        <p className="modal-msg">
          {isSuccess
            ? "We can't wait to celebrate with you on our special day!"
            : 'There was an error submitting your RSVP. Please try again.'}
        </p>

        <button type="button" className="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
