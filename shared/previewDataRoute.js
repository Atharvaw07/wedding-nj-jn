import { readFileSync } from 'fs';
import path from 'path';

function stripSensitiveFields(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const out = { ...data };
  delete out.clientId;
  if (out.rsvp && typeof out.rsvp === 'object') {
    const rsvp = { ...out.rsvp };
    delete rsvp.clientId;
    out.rsvp = rsvp;
  }
  return out;
}

/** Local dev only — reload data.json after palette edits. Disabled on production builds. */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), 'data.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    return Response.json(stripSensitiveFields(data), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
