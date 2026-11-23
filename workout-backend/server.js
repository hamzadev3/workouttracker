// Express API (sessions) with Firebase token auth, Swagger and CORS

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger');

const sessionRoutes = require('./routes/sessions');

const app = express();

// ----- CORS -----
const allow = (process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allow.length ? { origin: allow, credentials: true } : { origin: true }));

app.use(express.json());

// ----- health/docs -----
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ----- routes -----
app.use('/api/sessions', sessionRoutes);

// optional root
app.get('/', (_req, res) => res.status(200).json({ ok: true, service: 'workout-api' }));

// ----- errors -----
// Express 5 forwards errors thrown in async handlers here.
// Always answer with JSON instead of Express's default HTML error page.
app.use((err, _req, res, _next) => {
  if (err.code === 11000) {
    return res.status(409).json({ error: 'You already have a session with that name on that date' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message }); // e.g. malformed JSON body
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

// ----- start if run directly -----
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;

  (async () => {
    if (!MONGO) {
      console.error('Missing MONGO_URI'); process.exit(1);
    }
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('Missing FIREBASE_PROJECT_ID'); process.exit(1);
    }
    try {
      await mongoose.connect(MONGO);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('Mongo error:', err); process.exit(1);
    }
    app.listen(PORT, '0.0.0.0', () => console.log(`API listening on ${PORT}`));
  })();
}
