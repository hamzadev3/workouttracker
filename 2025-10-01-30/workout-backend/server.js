require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const swaggerUi  = require('swagger-ui-express');
const swaggerDoc = require('./swagger');

const app = express();

const allowList = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = allowList.length ? { origin: allowList, credentials: true } : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const sessionRoutes = require('./routes/sessions');
const workoutRoutes = require('./routes/workouts');
app.use('/api/sessions', sessionRoutes);
app.use('/api/workouts', workoutRoutes);

module.exports = app;

if (require.main === module) {
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
  const start = async () => {
    const port = process.env.PORT || 8080;
    if (!isTest) {
      const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (!MONGO) { console.error('Missing MONGO_URI or MONGODB_URI'); process.exit(1); }
      try { await mongoose.connect(MONGO); console.log('MongoDB connected'); }
      catch (err) { console.error('Mongo error:', err); process.exit(1); }
    }
    app.listen(port, () => console.log(`API on http://localhost:${port}`));
  };
  start();
}
