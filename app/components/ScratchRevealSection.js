'use client';

import { useEffect, useRef, useState } from 'react';
import { isSectionVisible } from '../lib/sectionVisibility';
import { isValidDateString } from '../lib/fieldPresent';
import MultilineBlock from './MultilineBlock';

function readScratchGradientColors() {
  const root = getComputedStyle(document.documentElement);
  const pick = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
  return {
    start: pick('--scratch-start', pick('--sage-border', '#EAC9C7')),
    mid: pick('--scratch-mid', pick('--sage-dark', '#BA7A76')),
    end: pick('--scratch-end', pick('--sage-border', '#EAC9C7')),
  };
}

function ScratchCard({ label, value, onDone, themeKey, scratchGradient }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cvs || !wrap) return;

    const ctx = cvs.getContext('2d', { WillReadFrequently: true });
    const dpr = window.devicePixelRatio || 1;

    function build() {
      const r = wrap.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      cvs.width = W * dpr;
      cvs.height = H * dpr;
      ctx.scale(dpr, dpr);

      const { start, mid, end } = scratchGradient || readScratchGradientColors();
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, start);
      g.addColorStop(0.5, mid);
      g.addColorStop(1, end);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.font = "italic 600 13px 'Cormorant Garamond'";
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('', W / 2, H / 2);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(42, W * 0.36);
      setReady(true);
    }

    setTimeout(build, 100);
  }, [themeKey, scratchGradient]);

  const handlePointerMove = (e) => {
    if (!ready || done) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const r = cvs.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    const x = s.clientX - r.left;
    const y = s.clientY - r.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    check(cvs, ctx);
  };

  const handlePointerDown = (e) => {
    if (!ready || done) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const r = cvs.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    const x = s.clientX - r.left;
    const y = s.clientY - r.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const check = (cvs, ctx) => {
    if (done) return;
    const d = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] === 0) clear++;
    if (clear / (cvs.width * cvs.height) > 0.48) {
      setDone(true);
      onDone();
    }
  };

  return (
    <div className="scratch-unit">
      <span className="scratch-lbl">{label}</span>
      <div className={`scratch-card ${done ? 'glow' : ''}`} ref={wrapRef}>
        <div className="scratch-inner">
          <div className="sc-val">{value}</div>
          <div className="sc-rule" />
        </div>
        {!done && (
          <canvas
            className="scratch-canvas"
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
          />
        )}
      </div>
      {!done && <span className="scratch-hint">↑ scratch</span>}
    </div>
  );
}

export default function ScratchRevealSection({ saveTheDate, onAllScratched, visibility, themeKey, scratchGradient }) {
  const [doneCount, setDoneCount] = useState(0);
  const allScratchedFiredRef = useRef(false);
  const sectionOn = isSectionVisible('saveTheDate', saveTheDate, visibility);
  const validDate = isValidDateString(saveTheDate?.weddingDate);

  const date = validDate ? new Date(`${saveTheDate.weddingDate}T12:00:00`) : null;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = date ? months[date.getMonth()] : '';
  const day = date ? String(date.getDate()).padStart(2, '0') : '';
  const year = date ? String(date.getFullYear()) : '';

  useEffect(() => {
    if (doneCount !== 3 || allScratchedFiredRef.current) return;
    allScratchedFiredRef.current = true;
    onAllScratched();
  }, [doneCount, onAllScratched]);

  if (!sectionOn || !validDate) return null;

  const handleDone = () => {
    setDoneCount((prev) => prev + 1);
  };

  return (
    <section id="scratch-section" className="reveal revealed">
      <span className="sec-label">The Date</span>
      <h2 className="sec-heading">Save the Date</h2>
      <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '1.05rem', marginTop: '.25rem' }}>
        <MultilineBlock
          text={saveTheDate?.wording}
          limitsKey="saveTheDate.wording"
          inline
        />
      </p>
      <div className="scratch-row">
        <ScratchCard label="Month" value={month} onDone={handleDone} themeKey={themeKey} scratchGradient={scratchGradient} />
        <ScratchCard label="Day" value={day} onDone={handleDone} themeKey={themeKey} scratchGradient={scratchGradient} />
        <ScratchCard label="Year" value={year} onDone={handleDone} themeKey={themeKey} scratchGradient={scratchGradient} />
      </div>
    </section>
  );
}
