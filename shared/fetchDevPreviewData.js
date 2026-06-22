/**
 * Dev-only reload of data.json via /api/preview-data.
 * Live couple sites return 404 JSON — must not treat that as site data.
 */
export async function fetchDevPreviewData() {
  const res = await fetch('/api/preview-data', { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.error) {
    return null;
  }
  return data;
}
