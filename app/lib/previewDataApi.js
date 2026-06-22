/** Authenticated preview-data fetch for platform iframe (?pt= from parent URL). */

export function buildPreviewDataUrl(apiBase, projectId, previewToken) {
  if (!apiBase || !projectId || !previewToken) return null;
  const base = String(apiBase).replace(/\/$/, '');
  const url = new URL(`${base}/api/preview/${encodeURIComponent(projectId)}/data`);
  url.searchParams.set('pt', previewToken);
  return url.toString();
}

export async function fetchPreviewProjectData(apiBase, projectId, previewToken) {
  const url = buildPreviewDataUrl(apiBase, projectId, previewToken);
  if (!url) {
    return { success: false, message: 'Preview token missing' };
  }
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}
