'use client';

import { useState } from 'react';
import { isSectionVisible } from '../lib/sectionVisibility';
import MultilineBlock from './MultilineBlock';

const RSVP_GUEST_LIMITS = {
  name: 80,
  phone: 20,
  song: 120,
  marriageAdvice: 500,
};

const RSVP_API_BASE =
  process.env.NEXT_PUBLIC_WEDDING_API_URL || 'https://wedding-backend-k67l.onrender.com';
const RSVP_API = `${RSVP_API_BASE.replace(/\/$/, '')}/api/rsvp`;

export default function RSVPSection({ rsvp, events, onShowModal, visibility }) {
  const [loading, setLoading] = useState(false);
  const [attending, setAttending] = useState('yes');

  const formFields = rsvp?.formFields || {};
  const showAttending = formFields.showAttending !== false;
  const showGuestCount = formFields.showGuestCount !== false;
  const showEvents = formFields.showEvents !== false;
  const showSongRequest = formFields.showSongRequest !== false;
  const customQuestions = (rsvp?.customQuestions || []).filter((q) => String(q?.label || '').trim());
  const effectiveAttending = showAttending ? attending : 'yes';

  const fieldNameForQuestion = (q, index) => `custom_${q.id || index}`;

  if (!isSectionVisible('rsvp', rsvp, visibility)) return null;

  const wording = rsvp?.wording;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = {};
    for (let [key, value] of formData.entries()) {
      if (key === 'attending_events') {
        const values = formData.getAll(key);
        data[key] = values.join(', ');
      } else {
        data[key] = value;
      }
    }

    if (!showAttending) data.attending = 'yes';

    if (data.attending === 'no') {
      data.guest_count = "0";
      data.attending_events = "None";
    } else {
      if (!showGuestCount) data.guest_count = data.guest_count || '1';
      if (!showEvents) delete data.attending_events;
      if (!showSongRequest) delete data.song_request;
    }

    const customAnswers = [];
    customQuestions.forEach((q, index) => {
      const key = fieldNameForQuestion(q, index);
      let answer = data[key];
      delete data[key];
      if (answer == null) return;
      if (Array.isArray(answer)) answer = answer[0];
      answer = String(answer).trim();
      if (!answer) return;
      customAnswers.push({
        id: q.id || String(index),
        question: q.label,
        type: q.type || 'short-text',
        answer,
      });
    });
    if (customAnswers.length > 0) {
      data.custom_answers = JSON.stringify(customAnswers);
    }

    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    if (!clientId) {
      onShowModal('error');
      setLoading(false);
      return;
    }
    data.clientId = clientId;

    try {
      const res = await fetch(RSVP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      onShowModal(result.success ? 'success' : 'error');
      if (result.success) e.target.reset();
    } catch (err) {
      console.error(err);
      onShowModal('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="rsvp-section" className="reveal revealed">
      <div className="rsvp-wrap">
        <div className="tc" style={{ marginBottom: '2.5rem' }}>
          <span className="sec-label">Join the Celebration</span>
          <h2 className="sec-heading">RSVP</h2>
          <MultilineBlock
            text={wording}
            limitsKey="rsvp.wording"
            asParagraph
            wrapperClassName="rsvp-intro"
          />
        </div>

        <form onSubmit={handleSubmit} className="rsvp-form">
          <div className="rsvp-card">
            <p className="rsvp-card-title">Your details</p>
            <div className="field-group">
              <label className="field-label" htmlFor="f-name">Your name</label>
              <input className="field-input" type="text" id="f-name" name="name" required placeholder="Full name" maxLength={RSVP_GUEST_LIMITS.name} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="f-phone">Phone number</label>
              <input className="field-input" type="tel" id="f-phone" name="phone" required placeholder="+91 00000 00000" maxLength={RSVP_GUEST_LIMITS.phone} />
            </div>
          </div>

          {showAttending && (
          <div className="rsvp-card">
            <p className="rsvp-card-title">Will you join us?</p>
            <div className="radio-pill-row">
              <label className="radio-pill">
                <input type="radio" name="attending" value="yes" checked={attending === 'yes'} onChange={() => setAttending('yes')} />
                Joyfully accept 🎉
              </label>
              <label className="radio-pill">
                <input type="radio" name="attending" value="no" checked={attending === 'no'} onChange={() => setAttending('no')} />
                Regrettably decline
              </label>
            </div>
          </div>
          )}

          <div id="extra-fields" style={{ opacity: effectiveAttending === 'no' ? 0.4 : 1, pointerEvents: effectiveAttending === 'no' ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
            {showGuestCount && (
            <div className="rsvp-card">
              <p className="rsvp-card-title">Party size</p>
              <div className="field-group">
                <select className="field-input" name="guest_count" required={effectiveAttending === 'yes'}>
                  <option value="1">1 (Just me)</option>
                  <option value="2">2 guests</option>
                  <option value="3">3 guests</option>
                  <option value="4">4 guests</option>
                  <option value="5">5 guests</option>
                  <option value="6+">6+ guests</option>
                </select>
              </div>
            </div>
            )}

            {showEvents && events?.items?.length > 0 && (
            <div className="rsvp-card">
              <p className="rsvp-card-title">Events you'll attend</p>
              <div className="checkbox-row">
                {(events?.items || []).map((item, i) => (
                  <label key={i} className="checkbox-pill">
                    <div>
                      <span style={{ fontWeight: 600, display: 'block' }}>{item.title || 'Event'}</span>
                      {item.date || item.time ? (
                        <small className="checkbox-date">
                          {item.date
                            ? new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: 'long',
                              })
                            : ''}
                          {item.date && item.time ? ' · ' : ''}
                          {item.time || ''}
                        </small>
                      ) : null}
                    </div>
                    <input type="checkbox" name="attending_events" value={item.title} style={{ width: '20px', height: '20px' }} />
                  </label>
                ))}
              </div>
            </div>
            )}

            {showSongRequest && (
            <div className="rsvp-card">
              <p className="rsvp-card-title">A song for the dance floor</p>
              <div className="field-group">
                <input className="field-input" type="text" name="song_request" placeholder="e.g. Kala Chashma" maxLength={RSVP_GUEST_LIMITS.song} />
              </div>
            </div>
            )}

            {customQuestions.map((q, index) => {
              const name = fieldNameForQuestion(q, index);
              const required = !!q.required && effectiveAttending === 'yes';
              const label = String(q.label).trim();
              return (
                <div className="rsvp-card" key={q.id || index}>
                  <p className="rsvp-card-title">{label}</p>
                  <div className="field-group">
                    {q.type === 'long-text' ? (
                      <textarea
                        className="field-textarea"
                        name={name}
                        required={required}
                        placeholder="Your answer"
                        maxLength={500}
                        rows={3}
                      />
                    ) : q.type === 'yes-no' ? (
                      <div className="radio-pill-row">
                        <label className="radio-pill">
                          <input type="radio" name={name} value="Yes" required={required} />
                          Yes
                        </label>
                        <label className="radio-pill">
                          <input type="radio" name={name} value="No" />
                          No
                        </label>
                      </div>
                    ) : (
                      <input
                        className="field-input"
                        type="text"
                        name={name}
                        required={required}
                        placeholder="Your answer"
                        maxLength={200}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="rsvp-card">
              <p className="rsvp-card-title">Marriage advice for us</p>
              <div className="field-group">
                <textarea
                  className="field-textarea"
                  name="marriage_advice"
                  required={effectiveAttending === 'yes'}
                  placeholder="Share something sweet, funny, or wise..."
                  maxLength={RSVP_GUEST_LIMITS.marriageAdvice}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send RSVP'}
          </button>
        </form>
      </div>
    </section>
  );
}
