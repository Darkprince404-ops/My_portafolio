import { neon } from '@neondatabase/serverless';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported content type.' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > 12000) {
    return res.status(413).json({ error: 'Request is too large.' });
  }

  const origin = req.headers.origin;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return res.status(403).json({ error: 'Cross-origin submission blocked.' });
      }
    } catch {
      return res.status(403).json({ error: 'Invalid request origin.' });
    }
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Contact service is not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body ||= {};

  // Honeypot: quietly accept bot submissions without storing them.
  if (String(body.website || '').trim()) {
    return res.status(200).json({ ok: true });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ error: 'Please enter a valid name.' });
  }
  if (!emailPattern.test(email) || email.length > 180) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (subject.length > 180) {
    return res.status(400).json({ error: 'Subject is too long.' });
  }
  if (message.length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'Message must be between 10 and 5,000 characters.' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (${name}, ${email}, ${subject || null}, ${message})
    `;

    await sql`
      INSERT INTO portfolio_events (event_name, metadata)
      VALUES ('contact_submitted', ${JSON.stringify({ source: 'portfolio_contact_form' })}::jsonb)
    `;

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Contact form database error', error);
    return res.status(500).json({ error: 'Message could not be saved. Please email me directly.' });
  }
}
