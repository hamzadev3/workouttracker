// workout-backend/scripts/clear.js
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const SEED_TAG  = process.env.SEED_TAG; // if set, deletes only that batch

if (!MONGO_URI) { console.error("MONGO_URI required"); process.exit(1); }

let Workout;
try { Workout = require("../models/Workout"); }
catch {
  const workoutSchema = new mongoose.Schema({ meta: { seedTag: String } }, { collection: "workouts" });
  Workout = mongoose.model("Workout", workoutSchema);
}

(async function main(){
  await mongoose.connect(MONGO_URI);
  const q = SEED_TAG ? { "meta.seedTag": SEED_TAG } : {};
  const del = await Workout.deleteMany(q);
  console.log(`Deleted ${del.deletedCount} workout(s) ${SEED_TAG ? `for tag ${SEED_TAG}` : "(all)"}.`);
  await mongoose.disconnect();
})().catch(async e => { console.error(e); try { await mongoose.disconnect(); } catch{}; process.exit(1); });
