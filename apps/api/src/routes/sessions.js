// apps/api/src/routes/sessions.js
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
  isPublic: z.boolean().optional(),
});

const exerciseSchema = z.object({
  title: z.string().min(1).max(100),
  sets: z.coerce.number().int().min(1).max(50),
  reps: z.coerce.number().int().min(1).max(1000),
  weight: z.coerce.number().min(0).max(2000),
});

/**
 * @openapi
 * /api/sessions:
 *   get:
 *     summary: List sessions (public feed + optional user’s)
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Include this user’s private sessions in the feed
 *       - in: query
 *         name: before
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: A page of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Session' }
 */
router.get('/', async (req, res) => {
  try {
    const { userId, before, limit } = req.query;
    const lmt = Math.min(Number(limit) || 10, 50);
    const base = userId ? { $or: [{ userId }, { isPublic: true }] } : { isPublic: true };
    const dateFilter = before ? { date: { $lt: new Date(before) } } : {};
    const sessions = await Session.find({ ...base, ...dateFilter }).sort({ date: -1 }).limit(lmt);
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: Create a session (authenticated)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Session' }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 */
router.post('/', requireUser, async (req, res) => {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  try {
    const session = await Session.create({ ...parsed.data, exercises: [] });
    res.status(201).json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * @openapi
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session (owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Not owner }
 *       404: { description: Not found }
 */
router.delete('/:id', requireUser, async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).end();
  if (s.userId !== req.userId) return res.status(403).json({ error: 'Not owner' });
  await s.deleteOne();
  res.json({ ok: true, deletedId: req.params.id });
});

/**
 * @openapi
 * /api/sessions/{id}/exercise:
 *   post:
 *     summary: Add an exercise (owner only)
 *     security: [{ bearerAuth: [] }]
 */
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

/**
 * @openapi
 * /api/sessions/{id}/exercise/{idx}:
 *   delete:
 *     summary: Remove an exercise (owner only)
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id/exercise/:idx', requireUser, async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).end();
  if (s.userId !== req.userId) return res.status(403).json({ error: 'Not owner' });
  s.exercises.splice(Number(req.params.idx), 1);
  await s.save();
  res.json(s);
});

module.exports = router;
