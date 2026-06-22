'use client';

import { useState, useEffect, useRef, Suspense, useCallback, useLayoutEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { prepareSiteData } from './mergeSiteData';
import { isSectionVisible } from './lib/sectionVisibility';
import { resolveSaveTheDateFlags } from './lib/saveTheDateFlags';
import { isValidDateString } from './lib/fieldPresent';
import { installStableViewport } from './lib/stableViewport';
import { beginDeferredMediaLoad, hydrateAllDeferredMedia, scheduleCompleteDeferredMediaLoad } from './lib/deferredMedia';
import { fireConfetti } from './lib/loadConfetti';
import defaultData from '../data.json';

import Petals from './components/Petals';
import VideoEntryGate from './components/VideoEntryGate';
import AudioControl from './components/AudioControl';
import HeroSection from './components/HeroSection';
import ScratchRevealSection from './components/ScratchRevealSection';
import CountdownSection from './components/CountdownSection';
import StorySection from './components/StorySection';
import VenueSection from './components/VenueSection';
import EventsSection from './components/EventsSection';
import RSVPSection from './components/RSVPSection';
import FooterSection from './components/FooterSection';
import RsvpModal from './components/RsvpModal';
import HeadingFontStyle from './components/HeadingFontStyle';
import EditorPreviewBanner from './components/EditorPreviewBanner';
import EditorSectionPlaceholder from './components/EditorSectionPlaceholder';
import { applyThemeFromSiteData, resolveThemeFromSiteData } from './colorPresets';
import { smoothScrollToElement } from './lib/smoothScrollTo';
import { applySiteDocumentMeta, SITE_META_PRESETS } from './lib/siteMetadata.js';
import { applyLiveDraftSiteData, shouldSkipEditorEntryLock } from './lib/liveEditorGate';
import { fetchPreviewProjectData } from './lib/previewDataApi';
import { isAllowedPlatformOrigin, postReadyToPlatform } from '../shared/platformPreviewBridge.js';
import { fetchDevPreviewData } from '../shared/fetchDevPreviewData.js';

const API = process.env.NEXT_PUBLIC_PLATFORM_API_URL || 'http://localhost:5000';

const HERO_IDLE_MS = 8000;
const POST_SCRATCH_IDLE_MS = 2000;
const AUTO_SCROLL_MIN_DURATION_MS = 2500;
const AUTO_SCROLL_MAX_DURATION_MS = 5000;
const AUTO_SCROLL_OFFSET = 64;

function WeddingPageInner() {
  const searchParams = useSearchParams();
  const pid = searchParams?.get('pid');
  const editor = searchParams?.get('editor') === '1';
  const pt = searchParams?.get('pt');
  const gateOpenedRef = useRef(false);
  const scratchCelebratedRef = useRef(false);

  const [siteData, setSiteData] = useState(() => prepareSiteData(pid ? {} : defaultData, defaultData));
  const [dataReady, setDataReady] = useState(!pid || editor);

  useEffect(() => {
    applySiteDocumentMeta(siteData, SITE_META_PRESETS.blushtheme);
  }, [siteData]);

  const colorPalette = siteData.colorPalette;
  const customPrimaryColor = siteData.customPrimaryColor;
  const customAccentColor = siteData.customAccentColor;
  const activeTheme = useMemo(
    () => resolveThemeFromSiteData(siteData),
    [colorPalette, customPrimaryColor, customAccentColor],
  );

  useLayoutEffect(() => {
    applyThemeFromSiteData(siteData);
  }, [siteData, colorPalette, customPrimaryColor, customAccentColor]);

  // Dev-only: reload data.json on each visit (import is cached by the bundler).
  useEffect(() => {
    if (pid || process.env.NODE_ENV === 'production') return;
    let cancelled = false;
    fetchDevPreviewData()
      .then((data) => {
        if (!cancelled && data) {
          const resolved = prepareSiteData(data, defaultData);
          applyThemeFromSiteData(resolved);
          setSiteData(resolved);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pid]);

  // Live editor bridge — receives draft formData from the platform form page via postMessage.
  useEffect(() => {
    if (!pid) return;

    const handler = (e) => {
      if (!isAllowedPlatformOrigin(e.origin)) return;
      if (e.data?.type === 'WEDDING_DRAFT_UPDATE' && e.data.data) {
        try {
          const resolved = prepareSiteData(e.data.data, defaultData);
          applyLiveDraftSiteData({
            editor,
            gateOpenedRef,
            resolved,
            applyTheme: applyThemeFromSiteData,
            setSiteData,
          });
        } catch { /* ignore malformed messages */ }
      }
      if (e.data?.type === 'WEDDING_PREVIEW_PING') {
        postReadyToPlatform()
      }
    };

    window.addEventListener('message', handler);
    if (window.parent !== window) {
      postReadyToPlatform()
    }

    return () => window.removeEventListener('message', handler);
  }, [pid, editor]);
  const saveTheDate = resolveSaveTheDateFlags(siteData.saveTheDate, siteData._visibility);
  const hasWeddingDate = isValidDateString(siteData.saveTheDate?.weddingDate);
  const showCountdown = saveTheDate.countdownOn && hasWeddingDate;
  const [unlocked, setUnlocked] = useState(() => !saveTheDate.useScratchGate);
  const [modalType, setModalType] = useState(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [mainRevealed, setMainRevealed] = useState(false);
  const autoScrollEnabledRef = useRef(true);
  const isAutoScrollingRef = useRef(false);
  const autoScrollCancelRef = useRef(null);
  const heroAutoScrollTimerRef = useRef(null);
  const postScratchAutoScrollTimerRef = useRef(null);
  const showCountdownRef = useRef(showCountdown);
  showCountdownRef.current = showCountdown;

  const clearAutoScrollTimers = useCallback(() => {
    if (heroAutoScrollTimerRef.current) {
      clearTimeout(heroAutoScrollTimerRef.current);
      heroAutoScrollTimerRef.current = null;
    }
    if (postScratchAutoScrollTimerRef.current) {
      clearTimeout(postScratchAutoScrollTimerRef.current);
      postScratchAutoScrollTimerRef.current = null;
    }
  }, []);

  const cancelAutoScrollAnimation = useCallback(() => {
    autoScrollCancelRef.current?.();
    autoScrollCancelRef.current = null;
  }, []);

  const disableAutoScroll = useCallback(() => {
    if (!autoScrollEnabledRef.current) return;
    autoScrollEnabledRef.current = false;
    clearAutoScrollTimers();
    cancelAutoScrollAnimation();
  }, [clearAutoScrollTimers, cancelAutoScrollAnimation]);

  const startSlowAutoScroll = useCallback((element, offset = AUTO_SCROLL_OFFSET) => {
    if (!autoScrollEnabledRef.current || !element) return;
    cancelAutoScrollAnimation();
    isAutoScrollingRef.current = true;
    autoScrollCancelRef.current = smoothScrollToElement(element, {
      minDuration: AUTO_SCROLL_MIN_DURATION_MS,
      maxDuration: AUTO_SCROLL_MAX_DURATION_MS,
      offset,
      onComplete: () => {
        isAutoScrollingRef.current = false;
        autoScrollCancelRef.current = null;
      },
    });
  }, [cancelAutoScrollAnimation]);

  const startSlowAutoScrollRef = useRef(startSlowAutoScroll);
  startSlowAutoScrollRef.current = startSlowAutoScroll;

  const listenForUserScroll = useCallback(() => {
    const scrollKeys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
    let lastScrollY = window.scrollY;

    const onWheel = () => disableAutoScroll();
    const onTouchMove = (e) => {
      if (e.target.closest?.('.scratch-canvas')) return;
      disableAutoScroll();
    };
    const onKeyDown = (e) => {
      if (scrollKeys.has(e.key)) disableAutoScroll();
    };
    const onScroll = () => {
      if (isAutoScrollingRef.current) {
        lastScrollY = window.scrollY;
        return;
      }
      if (Math.abs(window.scrollY - lastScrollY) > 4) disableAutoScroll();
      lastScrollY = window.scrollY;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [disableAutoScroll]);

  useEffect(() => {
    if (!pid) return;
    document.documentElement.classList.add('platform-preview');
    return () => document.documentElement.classList.remove('platform-preview');
  }, [pid]);

  useEffect(() => {
    if (!pid || editor || !pt) return;
    let cancelled = false;

    fetchPreviewProjectData(API, pid, pt)
      .then(async (res) => {
        if (cancelled || !res.success) return;
        const resolved = prepareSiteData(res.project?.data || {}, defaultData);
        if (cancelled) return;
        applyThemeFromSiteData(resolved);
        setSiteData(resolved);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDataReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pid, pt, editor]);

  useEffect(() => installStableViewport(), []);

  useEffect(() => {
    if (!dataReady || !pid) return undefined;
    const t = setTimeout(() => hydrateAllDeferredMedia(), 150);
    return () => clearTimeout(t);
  }, [dataReady, pid, siteData]);

  const handleEntryPlayStart = useCallback(() => {
    setAudioStarted(true);
  }, []);

  const handleEntryOpen = useCallback(() => {
    gateOpenedRef.current = true;
    setAudioStarted(true);
    document.getElementById('main-content')?.classList.add('visible');
    document.body.style.overflow = 'auto';

    const items = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => io.observe(el));
    setMainRevealed(true);
    scheduleCompleteDeferredMediaLoad();
  }, []);

  useEffect(() => {
    if (!mainRevealed) return;
    return listenForUserScroll();
  }, [mainRevealed, listenForUserScroll]);

  useEffect(() => {
    if (!mainRevealed) return undefined;

    heroAutoScrollTimerRef.current = setTimeout(() => {
      heroAutoScrollTimerRef.current = null;
      if (!autoScrollEnabledRef.current) return;

      const hero = document.getElementById('hero');
      if (!hero) return;

      const heroRect = hero.getBoundingClientRect();
      const stillOnHero = heroRect.top >= -80 && heroRect.bottom > window.innerHeight * 0.45;
      if (!stillOnHero) return;

      let target = null;
      if (saveTheDate.scratchOn) {
        target = document.getElementById('scratch-section');
      } else if (showCountdownRef.current) {
        target = document.getElementById('countdown-section');
      } else {
        target = document.querySelector('#locked section, #main-content > section:not(#hero)');
      }

      startSlowAutoScrollRef.current(target);
    }, HERO_IDLE_MS);

    return () => {
      if (heroAutoScrollTimerRef.current) {
        clearTimeout(heroAutoScrollTimerRef.current);
        heroAutoScrollTimerRef.current = null;
      }
    };
  }, [mainRevealed, saveTheDate.scratchOn, showCountdown]);

  useEffect(() => {
    if (!dataReady) return;
    if (shouldSkipEditorEntryLock(editor, gateOpenedRef)) return;
    if (!isSectionVisible('entry', siteData.entry, siteData._visibility)) {
      beginDeferredMediaLoad();
      handleEntryOpen();
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [dataReady, siteData.entry, siteData._visibility, handleEntryOpen, editor]);

  // Scratch gate only when scratch reveal is on; otherwise show countdown + rest immediately.
  useEffect(() => {
    if (!dataReady) return;
    if (!saveTheDate.useScratchGate) setUnlocked(true);
  }, [dataReady, saveTheDate.useScratchGate]);

  const handleAllScratched = useCallback(() => {
    setUnlocked(true);
    if (scratchCelebratedRef.current) return;
    scratchCelebratedRef.current = true;
    const theme = resolveThemeFromSiteData(siteData);
    const opts = { colors: theme.confettiColors, zIndex: 99999 };
    setTimeout(() => fireConfetti({ ...opts, particleCount: 200, spread: 100, origin: { x: 0.5, y: 0.65 } }), 100);
    setTimeout(() => fireConfetti({ ...opts, particleCount: 120, angle: 60, spread: 65, origin: { x: 0, y: 0.7 } }), 400);
    setTimeout(() => fireConfetti({ ...opts, particleCount: 120, angle: 120, spread: 65, origin: { x: 1, y: 0.7 } }), 600);
    postScratchAutoScrollTimerRef.current = setTimeout(() => {
      postScratchAutoScrollTimerRef.current = null;
      if (!autoScrollEnabledRef.current) return;
      const target = showCountdownRef.current
        ? document.getElementById('countdown-section')
        : document.getElementById('story-section') || document.getElementById('story-frame-section');
      startSlowAutoScroll(target);
    }, POST_SCRATCH_IDLE_MS);
  }, [siteData, startSlowAutoScroll]);

  const handleScrollToReveal = useCallback(() => {
    disableAutoScroll();
    if (saveTheDate.scratchOn) {
      document.getElementById('scratch-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (showCountdown) {
      document.getElementById('countdown-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const firstBelow = document.querySelector('#locked section, #main-content > section:not(#hero)');
    firstBelow?.scrollIntoView({ behavior: 'smooth' });
  }, [disableAutoScroll, saveTheDate.scratchOn, showCountdown]);

  const themeKey = `${siteData.colorPalette || 'blush-gold'}-${siteData.customPrimaryColor || ''}-${siteData.customAccentColor || ''}-${activeTheme.scratchGradient.start}-${activeTheme.scratchGradient.mid}`;
  const editorPreview = Boolean(pid);

  if (!dataReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        Loading…
      </div>
    );
  }

  return (
    <main>
      <HeadingFontStyle fontId={siteData.headingFont} />
      <AudioControl audio={siteData.audio} autoPlayTrigger={audioStarted} />
      <Petals enabled={siteData.petalsEnabled} themeKey={themeKey} />

      <VideoEntryGate
        entry={siteData.entry}
        onPlayStart={handleEntryPlayStart}
        onOpen={handleEntryOpen}
        visibility={siteData._visibility}
      />

      <div id="main-content">
        {editorPreview ? <EditorPreviewBanner /> : null}
        <HeroSection
          hero={siteData.hero}
          onScrollDown={handleScrollToReveal}
          visibility={siteData._visibility}
          editorPreview={editorPreview}
        />

        {saveTheDate.scratchOn && (
          <ScratchRevealSection
            saveTheDate={siteData.saveTheDate}
            onAllScratched={handleAllScratched}
            visibility={siteData._visibility}
            themeKey={themeKey}
            scratchGradient={activeTheme.scratchGradient}
          />
        )}

        {showCountdown && !saveTheDate.scratchOn && (
          <CountdownSection weddingDate={siteData.saveTheDate.weddingDate} className="reveal revealed" />
        )}

        {!showCountdown && !saveTheDate.scratchOn && editorPreview && saveTheDate.sectionOn ? (
          <EditorSectionPlaceholder sectionId="saveTheDate" />
        ) : null}

        <div id="locked" className={`${unlocked ? 'unlocked visible' : ''}`}>
          {showCountdown && saveTheDate.scratchOn && (
            <CountdownSection weddingDate={siteData.saveTheDate.weddingDate} />
          )}
          <StorySection
            story={siteData.story}
            visibility={siteData._visibility}
            eagerImages={Boolean(pid)}
            editorPreview={editorPreview}
          />
          <VenueSection venue={siteData.venue} visibility={siteData._visibility} editorPreview={editorPreview} />
          <EventsSection events={siteData.events} visibility={siteData._visibility} editorPreview={editorPreview} />
          <RSVPSection rsvp={siteData.rsvp} events={siteData.events} onShowModal={(type) => setModalType(type)} visibility={siteData._visibility} />
          <FooterSection footer={siteData.footer} visibility={siteData._visibility} />
        </div>
      </div>

      <RsvpModal type={modalType} onClose={() => setModalType(null)} />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--cream)' }} />}>
      <WeddingPageInner />
    </Suspense>
  );
}
