/** Editor-only scroll helpers. Deployed sites never pass editor=true. */

export function shouldSkipEditorEntryLock(editor, gateOpenedRef) {
  return Boolean(editor && gateOpenedRef.current);
}

export function applyLiveDraftSiteData({
  editor,
  gateOpenedRef,
  resolved,
  applyTheme,
  setSiteData,
}) {
  const scrollY = editor && gateOpenedRef.current ? window.scrollY : 0;
  applyTheme(resolved);
  setSiteData(resolved);
  if (!editor || !gateOpenedRef.current) return;
  requestAnimationFrame(() => {
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
    window.scrollTo(0, scrollY);
  });
}
