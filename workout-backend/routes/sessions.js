const express  = require("express");
const Session  = require("../models/Session");
const router   = express.Router();

// GET /api/sessions
router.get("/", async (req, res) => {
  const { userId, scope = "community" } = req.query;
  const filter = scope === "mine" ? { userId } : { isPublic: true };
  try {
    const sessions = await Session.find(filter).sort({ date: -1 });
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/sessions
router.post("/", async (req, res) => {
  const { name, date, userId, userName, isPublic } = req.body;
  if (!userId) return res.status(401).json({ error: "Missing userId" });
  try {
    const cleanedName = (userName || "").trim();
    const display = cleanedName || "Anonymous";
    const s = await Session.create({
      name,
      date,
      userId,
      userName: display,   // keep original casing; no forced lowercase
      isPublic,
      exercises: []
    });
    res.status(201).json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/sessions/:id
router.delete("/:id", async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// POST /api/sessions/:id/exercise
router.post("/:id/exercise", async (req, res) => {
  try {
    const s = await Session.findByIdAndUpdate(req.params.id, { $push: { exercises: req.body } }, { new: true });
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/sessions/:id/exercise/:idx
router.delete("/:id/exercise/:idx", async (req, res) => {
  const { id, idx } = req.params;
  try {
    const s = await Session.findById(id);
    if (!s) return res.status(404).end();
    s.exercises.splice(Number(idx), 1);
    await s.save();
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PATCH /api/sessions/:id/exercise/:idx
router.patch("/:id/exercise/:idx", async (req, res) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ error: "Session not found" });

    const i = Number(req.params.idx);
    if (!Number.isInteger(i) || i < 0 || i >= s.exercises.length) {
      return res.status(400).json({ error: "Invalid exercise index" });
    }

    const ex = s.exercises[i];
    const { title, sets, reps, weight } = req.body;
    if (title  !== undefined) ex.title  = String(title);
    if (sets   !== undefined) ex.sets   = Math.max(1, Number(sets));
    if (reps   !== undefined) ex.reps   = Math.max(1, Number(reps));
    if (weight !== undefined) ex.weight = Number(weight);

    await s.save();
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
