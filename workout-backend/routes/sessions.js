import { Router } from 'express';
import Session from '../models/Session.js';
const r = Router();

r.get('/', async (req, res) => {
  const { mine, userId } = req.query;
  const q = mine === '1' && userId ? { userId } : { isPublic: true };
  const items = await Session.find(q).sort({ date: -1 }).limit(50);
  res.json(items);
});

r.post('/', async (req, res) => {
  const { name, date, isPublic = true, displayName, userId } = req.body;
  const s = await Session.create({
    name,
    date: date ? new Date(date) : new Date(),
    isPublic,
    userId,
    userName: isPublic ? (displayName || 'Anonymous') : undefined,
    exercises: []
  });
  res.status(201).json(s);
});

r.delete('/:id', async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

r.post('/:id/exercises', async (req, res) => {
  const { title, sets, reps, weight } = req.body;
  const s = await Session.findById(req.params.id);
  s.exercises.push({ title, sets: +sets, reps: +reps, weight: +weight || 0 });
  await s.save();
  res.json(s);
});

r.patch('/:id/exercises/:idx', async (req, res) => {
  const s = await Session.findById(req.params.id);
  const idx = +req.params.idx;
  Object.assign(s.exercises[idx], req.body);
  await s.save();
  res.json(s);
});

r.delete('/:id/exercises/:idx', async (req, res) => {
  const s = await Session.findById(req.params.id);
  s.exercises.splice(+req.params.idx, 1);
  await s.save();
  res.json(s);
});

export default r;
