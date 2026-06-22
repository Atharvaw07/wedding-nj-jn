'use client';

import { useEffect, useState } from 'react';
import { isValidDateString } from '../lib/fieldPresent';

export default function CountdownSection({ weddingDate, className = '' }) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });
  const [isStarted, setIsStarted] = useState(false);
  const valid = isValidDateString(weddingDate);

  useEffect(() => {
    if (!valid) {
      setIsStarted(false);
      return undefined;
    }

    setIsStarted(false);
    const target = new Date(`${weddingDate}T11:00:00+05:30`);

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setIsStarted(true);
        return;
      }
      setIsStarted(false);
      const fmt = (n) => String(n).padStart(2, '0');
      setTimeLeft({
        days: fmt(Math.floor(diff / 86400000)),
        hours: fmt(Math.floor((diff % 86400000) / 3600000)),
        mins: fmt(Math.floor((diff % 3600000) / 60000)),
        secs: fmt(Math.floor((diff % 60000) / 1000)),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [weddingDate, valid]);

  if (!valid) return null;

  const dateStr = new Date(weddingDate)
    .toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
    .replace(/\//g, ' · ');

  return (
    <section id="countdown-section" className={className}>
      <div className="cd-card">
        <p className="cd-quote">A lifetime of togetherness begins with one sacred step</p>
        <span className="cd-script">The Wedding</span>
        <span className="cd-date">{dateStr}</span>

        {isStarted ? (
          <p style={{ fontFamily: '"Pinyon Script", cursive', fontSize: '3rem', color: 'var(--sage-dark)' }}>
            The Celebration Begins! 🌸
          </p>
        ) : (
          <div className="cd-grid">
            <div className="cd-unit">
              <span className="cd-num">{timeLeft.days}</span>
              <span className="cd-lbl">Days</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{timeLeft.hours}</span>
              <span className="cd-lbl">Hours</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{timeLeft.mins}</span>
              <span className="cd-lbl">Mins</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{timeLeft.secs}</span>
              <span className="cd-lbl">Secs</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
