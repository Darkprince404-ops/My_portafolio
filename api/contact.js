import { neon } from '@neondatabase/serverless';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
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
    const rows = await sql`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (${name}, ${email}, ${subject || null}, ${message})
      RETURNING id, created_at
    `;

    await sql`
      INSERT INTO portfolio_events (event_name, metadata)
      VALUES ('contact_submitted', ${JSON.stringify({ source: 'portfolio_contact_form' })}::jsonb)
    `;

    return res.status(201).json({ ok: true, id: rows[0]?.id });
  } catch (error) {
    console.error('Contact form database error', error);
    return res.status(500).json({ error: 'Message could not be saved. Please email me directly.' });
  }
}
