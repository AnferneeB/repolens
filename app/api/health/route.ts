/** Uptime-monitor probe. Deliberately does not touch GitHub or Supabase. */
export function GET() {
  return Response.json({ ok: true, ts: new Date().toISOString() });
}
