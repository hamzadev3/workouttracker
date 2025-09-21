import { Router } from 'express';
import Workout from '../models/Workout.js';
const r = Router();
r.get('/', async (_req, res) => res.json(await Workout.find().sort({ createdAt: -1 })));
r.post('/', async (req, res) => res.status(201).json(await Workout.create(req.body)));
export default r;
