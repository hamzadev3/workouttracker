#!/usr/bin/env node
// Seeds realistic public demo sessions for 3 users.
require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../models/Session');

const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const round5 = (n) => Math.round(n / 5) * 5;
const jitter5 = () => round5(rInt(-5, 5)); // -5..+5 in 5 lb steps

const PLANS = {
  ppl: [
    { name: 'Push Day',  ex: ['Bench Press','Overhead Press','Incline DB Press','Lateral Raise','Triceps Pushdown','Cable Fly'] },
    { name: 'Pull Day',  ex: ['Deadlift','Barbell Row','Lat Pulldown','Seated Cable Row','Face Pull','DB Curl'] },
    { name: 'Leg Day',   ex: ['Back Squat','Front Squat','Leg Press','Romanian Deadlift','Leg Curl','Calf Raise'] },
  ],
  bro: [
    { name: 'Chest & Triceps', ex: ['Bench Press','Incline DB Press','Cable Fly','Skullcrusher','Triceps Dip'] },
    { name: 'Back & Biceps',   ex: ['Deadlift','Barbell Row','Lat Pulldown','Seated Row','EZ Bar Curl'] },
    { name: 'Shoulders',       ex: ['Overhead Press','Lateral Raise','Rear Delt Fly','Upright Row'] },
    { name: 'Legs',            ex: ['Back Squat','Leg Press','Lunge','Leg Curl','Calf Raise'] },
    { name: 'Arms',            ex: ['Close Grip Bench','Cable Curl','Triceps Pushdown','Hammer Curl'] },
  ],
  women: [
    { name: 'Glutes & Hamstrings', ex: ['Hip Thrust','Romanian Deadlift','Bulgarian Split Squat','Cable Kickback','Leg Curl'] },
    { name: 'Upper Body',          ex: ['Incline DB Press','Lat Pulldown','Seated Row','Lateral Raise','Face Pull','Triceps Pushdown'] },
    { name: 'Quads & Calves',      ex: ['Back Squat','Leg Press','Leg Extension','Walking Lunge','Calf Raise'] },
  ],
};

// Build a per-user strength profile (all in lb working-set weights)
function makeStrengthProfile(planKey) {
  // Choose a bench anchor by persona (women a bit lower, bro a bit higher)
  const bench = round5(
    planKey === 'women' ? rInt(55, 115)
    : planKey === 'bro' ? rInt(185, 245)
    :                      rInt(135, 205)
  );
  const squat = round5(bench * 1.25 + rInt(-10, 10));
  const dead  = round5(bench * 1.60 + rInt(-15, 15));
  const ohp   = round5(bench * 0.60 + rInt(-5, 5));
  return { bench, squat, dead, ohp };
}

// Map exercise name -> realistic working-set weight based on profile
function weightFor(title, S) {
  const t = title.toLowerCase();
  let w = 0;

  // Bodyweight / technique work
  if (/\b(pull[- ]?up|push[- ]?up|dip)\b/.test(t)) return 0;

  // Compounds
  if (/close grip bench|bench press/.test(t))           w = S.bench;
  else if (/overhead press|shoulder press/.test(t))     w = S.ohp;
  else if (/\bdeadlift\b/.test(t) && !/romanian|rdl/.test(t)) w = S.dead;
  else if (/romanian deadlift|rdl/.test(t))             w = round5(S.dead * 0.80);
  else if (/front squat/.test(t))                       w = round5(S.squat * 0.85);
  else if (/\bback squat\b|\bsquat\b/.test(t))          w = S.squat;
  else if (/hip thrust/.test(t))                        w = round5(S.squat * 1.20);
  else if (/barbell row/.test(t))                       w = round5(S.bench * 0.80);
  else if (/seated.*row|cable row/.test(t))             w = round5(S.bench * 0.65);
  else if (/lat pulldown/.test(t))                      w = round5(S.bench * 0.65);

  // Accessories (DBs are implicitly per-hand)
  else if (/incline.*(db|dumbbell)/.test(t))            w = round5(S.bench * 0.35);
  else if (/lateral raise/.test(t))                     w = round5(S.bench * 0.10);
  else if (/rear delt fly/.test(t))                     w = round5(S.bench * 0.12);
  else if (/upright row/.test(t))                       w = round5(S.bench * 0.25);
  else if (/skullcrusher/.test(t))                      w = round5(S.bench * 0.25);
  else if (/triceps pushdown|pushdown/.test(t))         w = round5(S.bench * 0.25);
  else if (/hammer curl/.test(t))                       w = round5(S.bench * 0.22);
  else if (/\b(db|ez bar)? ?curl\b/.test(t))            w = round5(S.bench * 0.18); // 225→~40, 185→~30
  else if (/cable fly|flye/.test(t))                    w = round5(S.bench * 0.30);

  // Legs (machines/db)
  else if (/leg press/.test(t))                         w = round5(S.squat * 1.80);
  else if (/leg extension/.test(t))                     w = round5(S.squat * 0.40);
  else if (/leg curl/.test(t))                          w = round5(S.squat * 0.35);
  else if (/calf raise/.test(t))                        w = round5(S.squat * 0.60);
  else if (/bulgarian/.test(t))                         w = round5(S.squat * 0.25);
  else if (/walking lunge|lunge/.test(t))               w = round5(S.squat * 0.20);

  // Fallback generic accessory
  else                                                  w = round5(S.bench * 0.25);

  // Tiny session variance but keep 5-lb steps and non-negative
  w = Math.max(0, round5(w + jitter5()));
  return w;
}

function buildExercise(title, S) {
  return {
    title,
    sets:   rInt(3, 5),
    reps:   rInt(6, 12),
    weight: weightFor(title, S), // always multiple of 5 (or 0)
  };
}

async function seedProfile({ userId, userName, planKey, days, isPublic }) {
  const plan = PLANS[planKey] || PLANS.ppl;
  const S = makeStrengthProfile(planKey); // consistent across this user's sessions
  const docs = [];

  for (let i = 0; i < days; i++) {
    const tmpl  = plan[i % plan.length];
    const picks = [...tmpl.ex].sort(() => Math.random() - 0.5).slice(0, rInt(3, 5));
    const ex    = picks.map(title => buildExercise(title, S));
    const date  = new Date(); date.setDate(date.getDate() - rInt(0, 45));
    docs.push({ name: tmpl.name, date, userId, userName, isPublic, exercises: ex });
  }

  const res = await Session.insertMany(docs);
  return res.length;
}

(async function main() {
  const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!MONGO) { console.error('Missing MONGO_URI/MONGODB_URI'); process.exit(1); }
  await mongoose.connect(MONGO);

  const days     = Number(process.env.SEED_DAYS || 18);
  const isPublic = (process.env.SEED_PUBLIC || 'true') !== 'false';

  const profiles = [
    { userId: 'ppl_alice',   userName: 'alice',   planKey: 'ppl'   },
    { userId: 'bro_bob',     userName: 'bob',     planKey: 'bro'   },
    { userId: 'women_jane',  userName: 'jane',    planKey: 'women' },
  ];

  let total = 0;
  for (const p of profiles) total += await seedProfile({ ...p, days, isPublic });

  console.log(`Seeded ${total} sessions for ${profiles.length} users.`);
  await mongoose.disconnect();
})();
