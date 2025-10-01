const express = require('express');
const Workout = require('../models/Workout');
const router = express.Router();

router.get('/', async (_req, res) => {
  const workouts = await Workout.find().sort({ createdAt: -1 });
  res.json(workouts);
});

router.post('/', async (req, res) => {
  try {
    const w = await Workout.create(req.body);
    res.status(201).json(w);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
