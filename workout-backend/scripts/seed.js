// workout-backend/scripts/seed.js
// Usage:
//   # Dry-run (prints sample, writes nothing):
//   DRY_RUN=1 MONGO_URI="mongodb+srv://..." node workout-backend/scripts/seed.js
//
//   # Real seed to production DB (example values):
//   MONGO_URI="mongodb+srv://USER:PASS@cluster.mongodb.net/app?retryWrites=true&w=majority" \
//   SEED_TAG="fall2025" PEOPLE=12 WEEKS=6 START=2025-08-25 PER_WEEK=3 \
//   node workout-backend/scripts/seed.js
//
// What it inserts:
// - Collection: workouts
// - Fields used by your frontend cards: name, date, exercises[], userId, userName, visibility
// - Exercises use 5-lb step weights, reps 5–12, realistic bounds, small week-to-week variance
//
// Notes:
// - Idempotent by SEED_TAG: re-running removes the prior tag’s rows, then inserts fresh ones.
// - Does NOT create auth users; it just sets userId/userName display for Community.

require("dotenv").config();
const mongoose = require("mongoose");

// --- envs ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is required");
  process.exit(1);
}
const DRY_RUN  = process.env.DRY_RUN === "1";
const SEED_TAG = process.env.SEED_TAG || "seed-default";
const PEOPLE   = parseInt(process.env.PEOPLE || "8", 10);
const WEEKS    = parseInt(process.env.WEEKS  || "4", 10);
const PER_WEEK = parseInt(process.env.PER_WEEK || "3", 10);
const START    = process.env.START ? new Date(`${process.env.START}T00:00:00.000Z`) : new Date();

const names = [
  "Alex","Jordan","Taylor","Casey","Sam","Riley","Morgan","Quinn",
  "Jamie","Avery","Reese","Cameron","Drew","Harper","Finley","Dakota"
];

// Lazily load your Workout model if it exists; otherwise create a minimal one.
let Workout;
try {
  Workout = require("../models/Workout");
} catch {
  const workoutSchema = new mongoose.Schema({
    name: String,
    date: Date,
    visibility: { type: String, default: "public" },
    userId: String,
    userName: String,
    exercises: [{
      title: String,
      sets: Number,
      reps: Number,
      weight: Number,
      unit: { type: String, default: "lb" }
    }],
    meta: { seedTag: String },
    createdAt: Date,
    updatedAt: Date
  }, { collection: "workouts" });
  Workout = mongoose.model("Workout", workoutSchema);
}

// ---- helpers ----
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

const lifts = {
  push: [
    { title: "Barbell Bench Press",   base: 95,  rep: [5, 10] },
    { title: "Overhead Press",        base: 65,  rep: [5, 10] },
    { title: "Incline Dumbbell Press",base: 40,  rep: [8, 12] },
    { title: "Triceps Pushdown",      base: 40,  rep: [8, 12], step: 5 },
  ],
  pull: [
    { title: "Barbell Row",           base: 95,  rep: [6, 10] },
    { title: "Lat Pulldown",          base: 70,  rep: [8, 12] },
    { title: "Seated Cable Row",      base: 70,  rep: [8, 12] },
    { title: "Dumbbell Curl",         base: 25,  rep: [8, 12] },
  ],
  legs: [
    { title: "Back Squat",            base: 115, rep: [5, 10] },
    { title: "Romanian Deadlift",     base: 95,  rep: [6, 10] },
    { title: "Leg Press",             base: 180, rep: [8, 12], step: 10 },
    { title: "Calf Raise",            base: 65,  rep: [10, 15] },
  ]
};
const daySplit = ["push","pull","legs"];

function sessionDates(start, weeks, perWeek) {
  const dates = [];
  const total = weeks * 7;
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i);
    const dow = d.getUTCDay(); // 0..6
    if (perWeek >= 3 && (dow === 1 || dow === 3 || dow === 5)) dates.push(d);      // Mon/Wed/Fri
    else if (perWeek === 2 && (dow === 2 || dow === 5)) dates.push(d);             // Tue/Fri
    else if (perWeek === 1 && dow === 3) dates.push(d);                            // Wed
  }
  return dates;
}

function buildExercises(block, weekIndex) {
  const out = [];
  for (const lift of lifts[block]) {
    const setsCount = rand(3, 5);
    const repMin = lift.rep[0], repMax = lift.rep[1];
    const step = lift.step || 5;
    const base = lift.base * (1 + weekIndex * 0.02); // ~2% up per week

    for (let s = 0; s < setsCount; s++) {
      // Human-ish noise: ±10% around base, then round to 5-lb steps.
      const variance = (rand(-8, 10)) / 100;
      let w = base * (1 + variance);

      if (lift.title.includes("Dumbbell")) w = clamp(w, 10, 80);
      else if (lift.title.includes("Calf Raise")) w = clamp(w, 45, 135);
      else w = clamp(w, 45, 315);

      w = Math.round(w / step) * step;
      if (lift.title.includes("Barbell")) w = Math.max(45, w);

      out.push({
        title: lift.title,
        sets: rand(3, 5),
        reps: rand(repMin, repMax),
        weight: w,
        unit: "lb"
      });
    }
  }
  return out;
}

(async function main() {
  console.log(`🔗 Connecting…`);
  await mongoose.connect(MONGO_URI);
  console.log(`✅ Connected.`);

  const schedules = sessionDates(START, WEEKS, PER_WEEK);
  const people = Array.from({ length: PEOPLE }, (_, i) => ({
    userId: `seed-${SEED_TAG}-${i + 1}`,
    userName: names[i % names.length]
  }));

  // Idempotent: remove prior batch with same tag
  if (!DRY_RUN) {
    const del = await Workout.deleteMany({ "meta.seedTag": SEED_TAG });
    console.log(`♻️  Removed ${del.deletedCount} old workout(s) with SEED_TAG=${SEED_TAG}`);
  }

  const docs = [];
  for (let u = 0; u < people.length; u++) {
    const person = people[u];
    for (let s = 0; s < schedules.length; s++) {
      const when = schedules[s];
      const block = daySplit[s % daySplit.length];
      const weekIndex = Math.floor(s / Math.max(1, PER_WEEK));

      docs.push({
        name: `${block[0].toUpperCase()}${block.slice(1)} Day`,
        date: when,
        visibility: "public",
        userId: person.userId,
        userName: person.userName,
        exercises: buildExercises(block, weekIndex),
        meta: { seedTag: SEED_TAG },
        createdAt: when,
        updatedAt: when
      });
    }
  }

  if (DRY_RUN) {
    console.log("— DRY RUN PREVIEW —");
    console.log(JSON.stringify(docs.slice(0, 2), null, 2));
    console.log(`Would insert ${docs.length} workout(s).`);
  } else {
    if (docs.length) {
      const res = await Workout.insertMany(docs, { ordered: false });
      console.log(`🎉 Inserted ${res.length} workout(s).`);
    } else {
      console.log("No workouts to insert.");
    }
  }

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
