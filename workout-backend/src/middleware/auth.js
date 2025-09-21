// apps/api/src/middleware/auth.js
const admin = require('firebase-admin');

/**
 * Initialize Admin SDK
 * - Prefer FIREBASE_SERVICE_ACCOUNT (base64 JSON) for CI/local
 * - Otherwise fallback to GOOGLE_APPLICATION_CREDENTIALS (file path) via ADC
 */
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    const creds = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  } else {
    admin.initializeApp(); // ADC
  }
}

async function requireUser(req, res, next) {
  // test bypass to keep Supertest simple
  if (process.env.TEST_BYPASS_AUTH === '1') {
    req.userId = req.header('x-test-user-id') || 'test-user';
    return next();
  }

  const authHeader = req.header('authorization') || req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireUser };
