const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sessionRoutes = require('./routes/sessions');

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// tiny, safe default
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.use('/api/sessions', sessionRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workouts';
mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(() => {
  console.log('[api] Mongo connected');
  app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
}).catch(err => {
  console.error('[api] Mongo connection error:', err.message);
  process.exit(1);
});

module.exports = app; // for tests
