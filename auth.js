import crypto from 'crypto';

export function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  const provided = req.get('x-api-key');

  if (!expected) {
    return res.status(500).json({ error: 'Server auth is not configured' });
  }
  if (!provided) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  // Constant-time comparison (hash first so lengths always match)
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}