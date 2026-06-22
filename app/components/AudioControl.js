'use client';

import { useEffect, useRef, useState } from 'react';

/** Fixed playback behavior — not editable in the form. */
const PLAYBACK = {
  volume: 0.51,
  loop: true,
  fade: true,
  autoplayOnOpen: true,
};

export default function AudioControl({ audio, autoPlayTrigger }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const stopFadeTimer = () => {
    if (!fadeTimerRef.current) return;
    window.clearInterval(fadeTimerRef.current);
    fadeTimerRef.current = null;
  };

  const clampVolume = (v) => Math.max(0, Math.min(1, v));

  const { volume, loop, fade, autoplayOnOpen } = PLAYBACK;

  const playWithOptionalFade = async () => {
    const el = audioRef.current;
    if (!el) return;
    stopFadeTimer();
    if (el.readyState === 0) el.load();
    if (fade) {
      el.volume = 0;
      await el.play();
      setPlaying(true);
      const steps = 8;
      const step = volume / steps;
      let current = 0;
      fadeTimerRef.current = window.setInterval(() => {
        current += 1;
        el.volume = Math.min(volume, step * current);
        if (current >= steps) stopFadeTimer();
      }, 35);
      return;
    }
    el.volume = volume;
    await el.play();
    setPlaying(true);
  };

  const pauseWithOptionalFade = () => {
    const el = audioRef.current;
    if (!el) return;
    stopFadeTimer();
    if (!fade) {
      el.pause();
      setPlaying(false);
      return;
    }
    const start = clampVolume(el.volume);
    const steps = 6;
    const step = start / steps;
    let current = 0;
    fadeTimerRef.current = window.setInterval(() => {
      current += 1;
      const next = Math.max(0, start - (step * current));
      el.volume = next;
      if (current >= steps) {
        stopFadeTimer();
        el.pause();
        el.volume = volume;
        setPlaying(false);
      }
    }, 35);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = loop;
    if (!playing) el.volume = volume;
  }, [loop, volume, playing]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onEnded = () => setPlaying(false);
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, []);

  useEffect(() => {
    if (autoPlayTrigger && audio?.enabled !== false && audio?.src && autoplayOnOpen) {
      playWithOptionalFade().catch(() => {});
    }
  }, [autoPlayTrigger, audio?.enabled, audio?.src, autoplayOnOpen]);

  useEffect(() => () => {
    stopFadeTimer();
  }, []);

  if (audio?.enabled === false || !audio?.src) return null;

  const toggle = () => {
    if (playing) {
      pauseWithOptionalFade();
    } else {
      playWithOptionalFade().catch(() => {});
    }
  };

  return (
    <>
      <audio ref={audioRef} src={audio.src} loop={loop} preload="none" />
      <button id="audio-btn" onClick={toggle} title="Toggle music">
        {playing ? (
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>
    </>
  );
}
