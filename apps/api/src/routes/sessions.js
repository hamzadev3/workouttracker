const express = require('express');
const { z } = require('zod');
const Session = require('../models/Session');
const { requireUser } = require('../middleware/auth');
const router = express.Router();

const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.coerce.date().optional(),
  userId: z.string().min(1),
  userName: z.string().optional(),
  isPublic: z.boolean().optional()
});

const exerciseSchema = z.object({
  title: z.string().min(1).max(100),
  sets: z.coerce.number().int().min(1).max(50),
  reps: z.coerce.number().int().min(1).max(1000),
  weight: z.coerce.number().min(0).max(2000)
});

router.get('/', async (req, res) => {
  try {
    const { userId, before, limit } = req.query;
    const lmt = Math.min(Number(limit) || 10, 50);
    const base = userId ? { $or: [{ userId }, { isPublic: true }] } : { isPublic: true };
    const dateFilter = before ? { date: { $lt: new Date(before) } } : {};
    const sessions = await Session.find({ ...base, ...dateFilter }).sort({ date: -1 }).limit(lmt);
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireUser, async (req, res) => {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  try {
    const session = await Session.create({ ...parsed.data, exercises: [] });
    res.status(201).json(session);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', requireUser, async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).end();
  if (s.userId !== req.userId) return res.status(403).json({ error: 'Not owner' });
  await s.deleteOne();
  res.json({ ok: true, deletedId: req.params.id });
});

router.post('/:id/exercise', requireUser, async (req, res) => {
  const ex = exerciseSchema.safeParse(req.body);
  if (!ex.success) return res.status(400).json({ error: ex.error.issues[0].message });
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).end();
  if (s.userId !== req.userId) return res.status(403).json({ error: 'Not owner' });
  s.exercises.push(ex.data);
  await s.save();
  res.json(s);
});

router.delete('/:id/exercise/:idx', requireUser, async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).end();
  if (s.userId !== req.userId) return res.status(403).json({ error: 'Not owner' });
  s.exercises.splice(Number(req.params.idx), 1);
  await s.save();
  res.json(s);
});

module.exports = router;
