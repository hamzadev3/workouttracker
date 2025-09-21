import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import sessions from './routes/sessions.js';
import workouts from './routes/workouts.js';
import swagger from './swagger.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json());

app.use('/api/sessions', sessions);
app.use('/api/workouts', workouts);
app.use('/api/docs', swagger);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
const uri  = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workouts';

mongoose.connect(uri).then(() => {
  app.listen(port, () => console.log(`API on :${port}`));
});

export default app;
