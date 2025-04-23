const express  = require("express");
const Session  = require("../models/Session");

const router = express.Router();

/* ──────────────────────────────────────────
   GET  /api/sessions      (public read-only)
   Query: ?userId=UID  → returns that user’s sessions
          (no userId) → returns sessions with no userId (demo/public)
   ──────────────────────────────────────────*/
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId
      ? { $or: [{ userId }, { isPublic: true }] }
      : { isPublic: true };
    const sessions = await Session.find(filter).sort({ date: -1 });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ──────────────────────────────────────────
   POST /api/sessions
   Body: { name, date?, userId }   ← userId REQUIRED
   ──────────────────────────────────────────*/
router.post("/", async (req, res) => {
  const { name, date, userId, userName, isPublic = true } = req.body;
  if (!userId) return res.status(401).json({ error: "Missing userId" });
  try {
    const session = await Session.create({
      name, date, userId, userName, isPublic, exercises: [] });
    res.status(201).json(session);
  }  catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* DELETE /api/sessions/:id */
router.delete("/:id", async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

/* POST /api/sessions/:id/exercise */
router.post("/:id/exercise", async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { $push: { exercises: req.body } },
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).end();
    res.json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* DELETE /api/sessions/:id/exercise/:idx */
router.delete("/:id/exercise/:idx", async (req, res) => {
  const { id, idx } = req.params;
  try {
    const session = await Session.findById(id);
    if (!session) return res.status(404).end();
    session.exercises.splice(Number(idx), 1);
    await session.save();
    res.json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
