// Verifies the Firebase ID token sent as "Authorization: Bearer <token>".
// On success it sets req.user = { uid, email }; otherwise it responds 401.
const admin = require('firebase-admin');

// verifyIdToken only needs the project ID: it checks the token's signature
// against Google's public keys, so no service-account secret is required.
if (!admin.apps.length) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
}

async function requireUser(req, res, next) {
    const [scheme, token] = (req.get('Authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing Bearer token' });
    }
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = { uid: decoded.uid, email: decoded.email || '' };
        return next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireUser };
