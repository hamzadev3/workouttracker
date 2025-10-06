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
// Creates a new session. Requires a userId
router.post("/", async (req, res) => {
  const { name, date, userId, userName, isPublic } = req.body;
  if (!userId) return res.status(401).json({ error: "Missing userId" });
  try {
    // Normalize display name server-side to keep list sorting
    // lowercases the provided name
    const raw = (userName || "").trim();
    const normalizedUserName = raw
      ? raw.toLowerCase()
      : String(userId).slice(0, 6); // fallback if none given
    const s = await Session.create({ name, date, userId, userName: normalizedUserName, isPublic, exercises: [] });
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
// Update specific fields for an exercise by index
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
    res.json(s); // return the whole updated session
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
/* ----------------------------- seed endpoint ------------------------------ *
 * Dev helper to generate realistic public data.
 * -------------------------------------------------------------------------- */
function rint(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
const round5 = n => Math.max(0, Math.round(n/5)*5);

// map a user's "strength" to typical lifts 
function makeWeights(strength, name) {
  const n = name.toLowerCase();
  let base;
  if (/bench|press/.test(n))      base = strength;                  // bench ≈ strength
  else if (/ohp|overhead/.test(n))base = strength*0.6;
  else if (/row|pulldown|pull/.test(n)) base = strength*0.9;
  else if (/squat|leg press/.test(n))   base = strength*1.3;
  else if (/deadlift/.test(n))          base = strength*1.6;
  else if (/curl/.test(n))              base = strength*0.18;        // 225 → 40s
  else if (/triceps|skull|dip/.test(n)) base = strength*0.35;
  else if (/lateral|raise|fly/.test(n)) base = strength*0.15;
  else                                   base = strength*0.25;

  // random day-to-day variance ±10%
  base *= (0.9 + Math.random()*0.2);
  return round5(base);
}

function buildExercise(title, strength) {
  const sets = rint(3,5);
  // heavy-ish compounds 6–8; accessories 10–12
  const isHeavy = /deadlift|squat|bench|press|row/i.test(title);
  const reps = isHeavy ? rint(6,8) : rint(10,12);
  const weight = makeWeights(strength, title);
  return { title, sets, reps, weight };
}

const PLANS = {
  ppl: [
    { name: "Push Day", ex: ["Bench Press","Overhead Press","Incline DB Press","Lateral Raise","Triceps Pushdown","Cable Fly"] },
    { name: "Pull Day", ex: ["Deadlift","Barbell Row","Lat Pulldown","Seated Cable Row","Face Pull","DB Curl"] },
    { name: "Leg Day",  ex: ["Back Squat","Front Squat","Leg Press","Romanian Deadlift","Leg Curl","Calf Raise"] },
  ],
  bro: [
    { name: "Chest & Triceps", ex: ["Bench Press","Incline DB Press","Cable Fly","Skullcrusher","Triceps Dip"] },
    { name: "Back & Biceps",   ex: ["Deadlift","Barbell Row","Lat Pulldown","Seated Row","EZ Bar Curl"] },
    { name: "Shoulders",       ex: ["Overhead Press","Lateral Raise","Rear Delt Fly","Upright Row"] },
    { name: "Legs",            ex: ["Back Squat","Leg Press","Lunge","Leg Curl","Calf Raise"] },
    { name: "Arms",            ex: ["Close Grip Bench","Cable Curl","Triceps Pushdown","Hammer Curl"] },
  ],
  women: [
    { name: "Glutes & Hamstrings", ex: ["Hip Thrust","Romanian Deadlift","Bulgarian Split Squat","Cable Kickback","Leg Curl"] },
    { name: "Upper Body",          ex: ["Incline DB Press","Lat Pulldown","Seated Row","Lateral Raise","Face Pull","Triceps Pushdown"] },
    { name: "Quads & Calves",      ex: ["Back Squat","Leg Press","Leg Extension","Walking Lunge","Calf Raise"] },
  ]
};

const allowSeed = () => process.env.NODE_ENV !== 'production' || process.env.ADMIN_KEY;

router.post("/seed", async (req, res) => {
  if (!allowSeed()) return res.status(403).json({ error: "Seeding disabled" });
  if (process.env.NODE_ENV === 'production') {
    if (req.get('x-admin-key') !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const { plan="ppl", days=18 } = req.body || {};
  const chosen = PLANS[plan] || PLANS.ppl;

  // three “users” with consistent strengths and fixed naming
  const users = [
    { id: "u_ppl_user",  name: "ppl_fan",   strength: 185 },
    { id: "u_bro_user",  name: "bro_split", strength: 225 },
    { id: "u_wmn_user",  name: "athena",    strength: 155 },
  ];

  const docs = [];
  for (const u of users) {
    for (let i=0;i<days;i++) {
      const tmpl = chosen[i % chosen.length];
      const d = new Date(); d.setDate(d.getDate() - rint(0, 45));
      const n = rint(3,5);
      const ex = tmpl.ex.slice(0, Math.min(n, tmpl.ex.length))
                        .map(t => buildExercise(t, u.strength));
      docs.push({
        name: tmpl.name,
        date: d,
        userId: u.id,
        userName: u.name,
        isPublic: true,
        exercises: ex
      });
    }
  }

  const created = await Session.insertMany(docs);
  res.status(201).json({ inserted: created.length });
});

module.exports = router;
