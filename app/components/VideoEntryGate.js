'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isSectionVisible } from '../lib/sectionVisibility';
import { hasMediaUrl, hasText } from '../lib/fieldPresent';
import { beginDeferredMediaLoad, dispatchGateEnded } from '../lib/deferredMedia';

export const DEFAULT_ENTRY_GATE_MESSAGE =
  'With love and blessings,\nwe invite you to join our celebration.';

const MESSAGE_HIDE_MS = 3500;
const OVERLAY_STYLES = new Set(['light', 'dark']);

export default function VideoEntryGate({ entry, onOpen, onPlayStart, visibility }) {
  const gateRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const messageTimerRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [messageHidden, setMessageHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const openedRef = useRef(false);

  const videoUrl = entry?.videoUrl;
  const overlay = OVERLAY_STYLES.has(entry?.overlayStyle) ? entry.overlayStyle : 'dark';
  const gateMessage = hasText(entry?.message) ? entry.message.trim() : '';

  const drawPoster = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    try {
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setVideoReady(true);
    } catch {
      setVideoReady(true);
    }
  }, []);

  const finishOpen = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    gateRef.current?.classList.add('fade-out');
    setTimeout(() => {
      if (gateRef.current) gateRef.current.style.display = 'none';
    }, 800);
    onOpen?.();
    dispatchGateEnded();
  }, [onOpen]);

  useEffect(() => {
    if (!isSectionVisible('entry', entry, visibility)) {
      beginDeferredMediaLoad();
      onOpen?.();
    }
  }, [entry, visibility, onOpen]);

  useEffect(() => {
    if (!hasMediaUrl(videoUrl)) {
      beginDeferredMediaLoad();
      onOpen?.();
    }
  }, [videoUrl, onOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const onLoaded = () => drawPoster();
    video.addEventListener('loadeddata', onLoaded);
    video.load();
    if (video.readyState >= 2) drawPoster();
    return () => video.removeEventListener('loadeddata', onLoaded);
  }, [drawPoster, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const onEnded = () => finishOpen();
    const onError = () => {
      if (!openedRef.current) setTimeout(finishOpen, 500);
    };
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [finishOpen, videoUrl]);

  useEffect(() => () => clearTimeout(messageTimerRef.current), []);

  const handleGateClick = () => {
    if (openedRef.current || playing) return;
    setPlaying(true);
    beginDeferredMediaLoad();

    messageTimerRef.current = setTimeout(() => {
      setMessageHidden(true);
    }, MESSAGE_HIDE_MS);

    const video = videoRef.current;
    if (!video) {
      onPlayStart?.();
      finishOpen();
      return;
    }

    video.currentTime = 0;
    video.loop = false;
    video.muted = true;
    const playAttempt = video.play();
    onPlayStart?.();
    if (playAttempt !== undefined) {
      playAttempt.catch(() => {
        gateRef.current?.addEventListener(
          'click',
          () => {
            video.play();
          },
          { once: true },
        );
      });
    }
  };

  if (!isSectionVisible('entry', entry, visibility) || !hasMediaUrl(videoUrl)) {
    return null;
  }

  const src = videoUrl.includes('#') ? videoUrl : `${videoUrl}#t=0.001`;

  return (
    <div
      id="entry-gate"
      ref={gateRef}
      className={`entry-overlay--${overlay}${videoReady ? ' video-ready' : ''}`}
      onClick={handleGateClick}
      role="button"
      tabIndex={0}
      aria-label="Tap to open invitation"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleGateClick();
        }
      }}
    >
      <canvas id="entry-gate-poster" ref={canvasRef} aria-hidden />
      <video id="entry-video" ref={videoRef} playsInline preload="metadata" muted data-autoplay-fix="true">
        <source src={src} type="video/mp4" />
      </video>
      {gateMessage ? (
        <div className={`entry-gate-message${messageHidden ? ' hidden' : ''}`} aria-hidden="true">
          {gateMessage}
        </div>
      ) : null}
    </div>
  );
}