/** Keep --stable-vh synced with the visible viewport (mobile browser chrome). */
export const STABLE_VIEWPORT_INLINE_SCRIPT = `
(function () {
  function sync() {
    var vv = window.visualViewport;
    var h = Math.round((vv && vv.height) || window.innerHeight);
    var w = Math.round((vv && vv.width) || window.innerWidth);
    var root = document.documentElement;
    root.style.setProperty('--stable-vh', h + 'px');
    root.style.setProperty('--stable-vw', w + 'px');
    root.style.setProperty('--app-vh', h + 'px');
    root.style.setProperty('--app-vw', w + 'px');
  }
  sync();
  var vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
  }
  window.addEventListener('orientationchange', sync);
  window.addEventListener('resize', sync, { passive: true });
})();
`.trim();

export function installStableViewport() {
  if (typeof window === 'undefined') return () => {};

  const update = () => {
    const vv = window.visualViewport;
    const h = Math.round(vv?.height ?? window.innerHeight);
    const w = Math.round(vv?.width ?? window.innerWidth);
    const root = document.documentElement;
    root.style.setProperty('--stable-vh', `${h}px`);
    root.style.setProperty('--stable-vw', `${w}px`);
  };

  update();

  const vv = window.visualViewport;
  vv?.addEventListener('resize', update);
  vv?.addEventListener('scroll', update);
  window.addEventListener('orientationchange', update);
  window.addEventListener('resize', update, { passive: true });

  return () => {
    vv?.removeEventListener('resize', update);
    vv?.removeEventListener('scroll', update);
    window.removeEventListener('orientationchange', update);
    window.removeEventListener('resize', update);
  };
}
