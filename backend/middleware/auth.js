const admin = require('firebase-admin');

/**
 * Initialize Admin SDK from env:
 * - GOOGLE_APPLICATION_CREDENTIALS (JSON file path) or
 * - FIREBASE_SERVICE_ACCOUNT (base64 JSON)
 */
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const creds = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  } else {
    // falls back to ADC if GOOGLE_APPLICATION_CREDENTIALS is set
    admin.initializeApp();
  }
}

async function requireUser(req, res, next) {
  const authHeader = req.header('authorization') || req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Bearer token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { requireUser };
