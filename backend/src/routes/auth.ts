import { Router } from 'express';
import { authenticate, createAccessToken, requireAuth, validateAuthConfiguration } from '../auth.js';
import { createRateLimiter } from '../security.js';

export const authRouter = Router();
const loginRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

authRouter.post('/login', loginRateLimit, async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!identifier.trim() || !password || identifier.length > 320 || password.length > 1024) {
    return res.status(400).json({ error: 'An operator account and password are required.' });
  }

  try {
    validateAuthConfiguration();
    const user = await authenticate(identifier, password);
    if (!user) return res.status(401).json({ error: 'Invalid account or password.' });
    return res.json({ token: createAccessToken(user), user });
  } catch (error) {
    console.error('Authentication configuration error:', error);
    return res.status(503).json({ error: 'Authentication is not configured. Contact an administrator.' });
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.auth });
});
