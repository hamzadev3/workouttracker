const express = require("express");
const mongoose = require("mongoose");
const Session = require("../models/Session");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// Loads the session in the URL and checks the signed-in user owns it.
// If not, it sends the error response itself and returns null.
async function loadOwnSession(req, res) {
  const { id } = req.params;
  const session = mongoose.isValidObjectId(id) ? await Session.findById(id) : null;
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return null;
  }
  if (session.userId !== req.user.uid) {
    res.status(403).json({ error: "You can only change your own sessions" });
    return null;
  }
  return session;
}

// Reads :idx from the URL. Sends 400 and returns null if it isn't a valid index.
function exerciseIndex(req, res, session) {
  const i = Number(req.params.idx);
  if (!Number.isInteger(i) || i < 0 || i >= session.exercises.length) {
    res.status(400).json({ error: "Invalid exercise index" });
    return null;
  }
  return i;
}

// GET /api/sessions — public community feed (no login needed)
router.get("/", async (_req, res) => {
  const sessions = await Session.find({ isPublic: true }).sort({ date: -1 });
  res.json(sessions);
});

// GET /api/sessions/mine — the signed-in user's sessions, public and private
router.get("/mine", requireUser, async (req, res) => {
  const sessions = await Session.find({ userId: req.user.uid }).sort({ date: -1 });
  res.json(sessions);
});

// POST /api/sessions — create a session owned by the signed-in user
router.post("/", requireUser, async (req, res) => {
  const { name, date, isPublic, userName } = req.body ?? {};
  const cleanName = String(name ?? "").trim();
  if (!cleanName) return res.status(400).json({ error: "Session name is required" });

  const session = await Session.create({
    name: cleanName,
    date: date || new Date(),
    userId: req.user.uid, // from the verified token, never from the request body
    userName: String(userName ?? "").trim() || req.user.email.split("@")[0] || "Anonymous",
    isPublic: isPublic !== false,
    exercises: [],
  });
  res.status(201).json(session);
});

// DELETE /api/sessions/:id
router.delete("/:id", requireUser, async (req, res) => {
  const session = await loadOwnSession(req, res);
  if (!session) return;
  await session.deleteOne();
  res.status(204).end();
});

// POST /api/sessions/:id/exercise — append an exercise
router.post("/:id/exercise", requireUser, async (req, res) => {
  const session = await loadOwnSession(req, res);
  if (!session) return;

  const { title, sets, reps, weight } = req.body ?? {};
  const ex = {
    title: String(title ?? "").trim(),
    sets: Number(sets),
    reps: Number(reps),
    weight: Number(weight || 0),
  };
  if (!ex.title || !Number.isInteger(ex.sets) || ex.sets < 1 ||
    !Number.isInteger(ex.reps) || ex.reps < 1 || !(ex.weight >= 0)) {
    return res.status(400).json({ error: "Need a title, whole-number sets and reps of at least 1, and weight of 0 or more" });
  }

  session.exercises.push(ex);
  await session.save();
  res.json(session);
});

// DELETE /api/sessions/:id/exercise/:idx
router.delete("/:id/exercise/:idx", requireUser, async (req, res) => {
  const session = await loadOwnSession(req, res);
  if (!session) return;
  const i = exerciseIndex(req, res, session);
  if (i === null) return;

  session.exercises.splice(i, 1);
  await session.save();
  res.json(session);
});

// PATCH /api/sessions/:id/exercise/:idx — update some fields of one exercise
router.patch("/:id/exercise/:idx", requireUser, async (req, res) => {
  const session = await loadOwnSession(req, res);
  if (!session) return;
  const i = exerciseIndex(req, res, session);
  if (i === null) return;

  const ex = session.exercises[i];
  const { title, sets, reps, weight } = req.body ?? {};
  if (title !== undefined) ex.title = String(title);
  if (sets !== undefined) ex.sets = Math.max(1, Number(sets));
  if (reps !== undefined) ex.reps = Math.max(1, Number(reps));
  if (weight !== undefined) ex.weight = Number(weight);

  await session.save();
  res.json(session);
});

module.exports = router;
