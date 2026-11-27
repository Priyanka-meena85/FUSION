const crypto = require('node:crypto');

const EPHEMERAL_DEV_SECRET = crypto.randomBytes(32).toString('hex');
const revokedJtis = new Set();

function getSecurityConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const adminPin = process.env.ADMIN_PIN;
  const sessionSecret = process.env.SESSION_SECRET;

  if (isProd) {
    if (!adminPin || adminPin.length < 4) {
      throw new Error('FATAL: ADMIN_PIN environment variable must be set (min 4 chars) in production.');
    }
    if (!sessionSecret || sessionSecret.length < 16) {
      throw new Error('FATAL: SESSION_SECRET environment variable must be set (min 16 chars) in production.');
    }
  }

  return {
    isProd,
    adminPin: adminPin || '2026',
    sessionSecret: sessionSecret || EPHEMERAL_DEV_SECRET,
  };
}

function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signPayload(payloadObj) {
  const { sessionSecret } = getSecurityConfig();
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const { sessionSecret } = getSecurityConfig();
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  if (!timingSafeMatch(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp <= Date.now()) return null;
    if (data.jti && revokedJtis.has(data.jti)) return null;
    return data;
  } catch {
    return null;
  }
}

function signAdminToken() {
  return signPayload({
    role: 'owner',
    jti: crypto.randomUUID(),
    exp: Date.now() + 24 * 3600 * 1000,
  });
}

function revokeAdminToken(token) {
  const data = verifySignedToken(token);
  if (data?.jti) {
    revokedJtis.add(data.jti);
  }
}

function signBookingToken(bookingId) {
  return signPayload({ role: 'bride', bookingId: Number(bookingId), exp: Date.now() + 90 * 24 * 3600 * 1000 });
}

function extractAdminToken(req) {
  return req.cookies?.fusion_admin_session || '';
}

function isTrustedOrigin(req) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }
  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const origin = req.headers.origin;
  if (origin) {
    return allowed.includes(origin);
  }
  const referer = req.headers.referer;
  if (referer) {
    try {
      return allowed.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  return true; // Non-browser clients without Origin/Referer
}

function requireAdmin(req, res, next) {
  const data = verifySignedToken(extractAdminToken(req));
  if (!data || data.role !== 'owner') {
    return res.status(401).json({ error: 'Unauthorized: Valid owner session required' });
  }
  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden: Untrusted origin for state-changing admin request' });
  }
  req.admin = data;
  next();
}

function requireBookingAccess(req, res, next) {
  const adminData = verifySignedToken(extractAdminToken(req));
  if (adminData && adminData.role === 'owner') {
    if (!isTrustedOrigin(req)) {
      return res.status(403).json({ error: 'Forbidden: Untrusted origin' });
    }
    req.bookingAccess = { role: 'owner' };
    return next();
  }
  const bookingToken = req.headers['x-booking-token'] || req.cookies?.fusion_booking_token || '';
  const data = verifySignedToken(bookingToken);
  const targetId = Number(req.params.id);
  if (!data || data.role !== 'bride' || (targetId && data.bookingId !== targetId)) {
    return res.status(403).json({ error: 'Forbidden: Valid booking access token required' });
  }
  req.bookingAccess = data;
  next();
}

module.exports = {
  getSecurityConfig,
  timingSafeMatch,
  signAdminToken,
  revokeAdminToken,
  signBookingToken,
  verifySignedToken,
  extractAdminToken,
  requireAdmin,
  requireBookingAccess,
};
