// notes/2025-04-30-15-backend-headers/backend/server.js
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
require('dotenv').config();

const sessionRoutes = require('./routes/sessions');

const app = express();
app.use(helmet());

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));

app.use(express.json());
app.use('/api/sessions', sessionRoutes);

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workouts';

mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(() => {
  console.log('[api] Mongo connected →', MONGO_URI);
  app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
}).catch(err => {
  console.error('[api] Mongo connection error:', err.message);
  process.exit(1);
});
