// apps/api/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const sessionRoutes = require('./routes/sessions');

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/sessions', sessionRoutes);

// Swagger/OpenAPI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// 500
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workouts';

async function start() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);
  console.log('[api] Mongo connected');
  app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
}

// Only start if called directly
if (require.main === module) {
  start().catch((e) => {
    console.error('[api] Startup error:', e);
    process.exit(1);
  });
}

module.exports = { app, start };
