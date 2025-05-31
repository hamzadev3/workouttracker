// notes/2025-04-29-14-pagination/backend/routes/sessions.js
const express  = require("express");
const Session  = require("../models/Session");
const { requireUser } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, before, limit } = req.query;
    const lmt = Math.min(Number(limit) || 10, 50);
    const base = userId ? { $or: [{ userId }, { isPublic: true }] } : { isPublic: true };
    const dateFilter = before ? { date: { $lt: new Date(before) } } : {};
    const filter = { ...base, ...dateFilter };
    const sessions = await Session.find(filter).sort({ date: -1 }).limit(lmt);
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", requireUser, async (req, res) => {
  const { name, date, userId, userName, isPublic = true } = req.body;
  if (!userId) return res.status(401).json({ error: "Missing userId" });
  try {
    const session = await Session.create({ name, date, userId, userName, isPublic, exercises: [] });
    res.status(201).json(session);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete("/:id", requireUser, async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s) return res.status(404).end();
  if (s.userId !== req.userId) return res.status(403).json({ error: "Not owner" });
  await s.deleteOne();
  res.json({ ok: true, deletedId: req.params.id });
});

router.post("/:id/exercise", requireUser, async (req, res) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).end();
    if (s.userId !== req.userId) return res.status(403).json({ error: "Not owner" });
    s.exercises.push(req.body);
    await s.save();
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete("/:id/exercise/:idx", requireUser, async (req, res) => {
  const { id, idx } = req.params;
  try {
    const s = await Session.findById(id);
    if (!s) return res.status(404).end();
    if (s.userId !== req.userId) return res.status(403).json({ error: "Not owner" });
    s.exercises.splice(Number(idx), 1);
    await s.save();
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
