// seed.js — wipe (optional) and seed realistic workout sessions without seed tags.
// Usage:
//   MONGO_URI="mongodb://127.0.0.1:27017/workouts" node scripts/seed.js --weeks 6 --reset
//   MONGO_URI="..." node scripts/seed.js --weeks 8         # just add data, no wipe
//
// Options:
//   --reset    : wipe domain collections first (sessions, workouts, programs if they exist)
//   --weeks N  : generate N weeks of history ending today (default 6)
//   --people N : number of personas (default 25)
//
// Notes:
//   - Writes ONLY to `sessions` collection (your UI reads these).
//   - All session dates <= "now" (America/New_York); no future dates.
//   - Four persona cohorts: real-name + PPL, real-name + bro-split, username + PPL, username + bro-split.
//   - Progressive overload with mild variety and occasional stalls.
//   - No seed tags; clean documents.

const mongoose = require("mongoose");

// ---------- CLI args ----------
const args = new Set(process.argv.slice(2));
const getArg = (flag, def = null) => {
  for (const a of process.argv.slice(2)) {
    const m = a.match(new RegExp(`^${flag}=(.+)$`));
    if (m) return m[1];
  }
  return def;
};
const WEEKS    = parseInt(getArg("--weeks", "6"), 10) || 6;
const PEOPLE   = parseInt(getArg("--people", "25"), 10) || 25;
const DO_RESET = args.has("--reset");

// ---------- DB ----------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI is required"); process.exit(1); }

// ---------- Helpers ----------
function addDays(d, n){ const x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d, weekStarts=1){ const x=new Date(d.getTime()); const day=x.getDay(); const diff=(day===0?7:day)-weekStarts; x.setDate(x.getDate()-diff); x.setHours(8,0,0,0); return x; }
function clampNotFuture(dt){ const now=new Date(); return dt>now ? new Date(now.getFullYear(),now.getMonth(),now.getDate(),11,30,0,0) : dt; }
function rndInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function rndChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function nyDateAtHourYmd(y,m,d,h=13,min=15){ return new Date(y,m,d,h,min,0,0); }

// ---------- Personas ----------
const REAL_NAMES = ["Alex Morgan","Taylor Reed","Sam Patel","Priya Shah","Diego Lopez","Elena Park","Reese Carter","Anaya Lee","Yuki Sato","Drew Kim","Theo Davis","Nora Khan"];
const USERNAMES = ["milo.lifts","sofia.trains","aria_squats","ppl_fan","bro_split","yuki_ohp","nora.moves","samA","theo.dev","diego_dl","morgan.fitlog","reese_press","hamza.dev"];

function makePersonas(total){
  const half = Math.floor(total/2);
  const real = REAL_NAMES.slice(0, Math.min(REAL_NAMES.length, half));
  const users = USERNAMES.slice(0, total - real.length);
  const splitHalf = (arr)=>{ const cut=Math.floor(arr.length/2); return [arr.slice(0,cut), arr.slice(cut)]; };
  const [realPPL, realBRO] = splitHalf(real);
  const [userPPL, userBRO] = splitHalf(users);
  const tiers = ["beginner","intermediate","advanced"];
  const persona = (name,prog)=>({ name, program:prog, tier:rndChoice(tiers) });
  const list = [
    ...realPPL.map(n=>persona(n,"PPL")),
    ...realBRO.map(n=>persona(n,"BRO")),
    ...userPPL.map(n=>persona(n,"PPL")),
    ...userBRO.map(n=>persona(n,"BRO")),
  ];
  while (list.length < total) list.push(persona(rndChoice(USERNAMES), rndChoice(["PPL","BRO"])));
  return list;
}

// ---------- Templates ----------
const EXS = {
  push:["Barbell Bench Press","Overhead Press","Incline DB Press","Triceps Pushdown"],
  pull:["Conventional Deadlift","Barbell Row","Lat Pulldown","EZ-Bar Curl","Face Pull"],
  legs:["Back Squat","Romanian Deadlift","Leg Press","Standing Calf Raise"],
  chest:["Barbell Bench Press","Incline DB Press","Chest Fly","Push-up (weighted)"],
  back:["Conventional Deadlift","Barbell Row","Seated Cable Row","Lat Pulldown"],
  shoulders:["Overhead Press","Dumbbell Lateral Raise","Rear Delt Fly","Seated DB Press"],
  arms:["EZ-Bar Curl","Cable Curl","Triceps Pushdown","Skullcrusher"],
};
const MAIN_LIFT_BASE = {
  beginner:{ bench:95, squat:135, dead:185, ohp:65, row:95 },
  intermediate:{ bench:155, squat:225, dead:275, ohp:95, row:135 },
  advanced:{ bench:225, squat:315, dead:405, ohp:135, row:185 },
};
function mainLiftForDay(t){ t=t.toLowerCase(); if(t.includes("push")||t.includes("chest"))return"bench"; if(t.includes("pull")||t.includes("back"))return"dead"; if(t.includes("legs"))return"squat"; if(t.includes("shoulder"))return"ohp"; if(t.includes("arms"))return"row"; return"bench";}
function titleFor(program, i){ if(program==="PPL") return ["Push Day","Pull Day","Leg Day"][i%3]; const x=["Chest Day","Back Day","Leg Day","Shoulders Day"]; return x[i%x.length]; }
function exercisesFor(title){ const k=title.toLowerCase(); if(k.includes("push"))return EXS.push; if(k.includes("pull"))return EXS.pull; if(k.includes("leg"))return EXS.legs; if(k.includes("chest"))return EXS.chest; if(k.includes("back"))return EXS.back; if(k.includes("shoulder"))return EXS.shoulders; if(k.includes("arms"))return EXS.arms; return EXS.push; }
function makeSets(exName, tier, liftBias, weekIndex, stallChance=0.2){
  const isMain = /bench|deadlift|squat|overhead press/i.test(exName);
  if (isMain){
    const base=MAIN_LIFT_BASE[tier][liftBias];
    const bumps=Math.max(0, weekIndex - (Math.random()<stallChance?1:0));
    const weight=Math.round((base+5*bumps)/5)*5;
    return [{reps:5,weight},{reps:5,weight},{reps:5,weight}];
  }
  const r=rndInt(8,12);
  const baseMap={"Incline DB Press":45,"Triceps Pushdown":60,"Lat Pulldown":100,"EZ-Bar Curl":50,"Face Pull":40,"Romanian Deadlift":95,"Leg Press":180,"Standing Calf Raise":90,"Chest Fly":30,"Push-up (weighted)":25,"Seated Cable Row":100,"Dumbbell Lateral Raise":20,"Rear Delt Fly":20,"Seated DB Press":40,"Cable Curl":40,"Skullcrusher":50};
  const b=baseMap[exName] ?? 50;
  const weight=Math.round((b + 5*Math.floor(weekIndex/2))/5)*5;
  return [{reps:r,weight},{reps:r,weight},{reps:r,weight}];
}
function sessionDoc({ author, title, when, tier, weekIndex }){
  const liftsKey=mainLiftForDay(title);
  let chosen=exercisesFor(title).slice(0);
  if (chosen.length>3 && Math.random()<0.25){ chosen=chosen.slice(); chosen.splice(rndInt(1,chosen.length-1),1); }
  const items=chosen.map(ex=>({ name:ex, sets:makeSets(ex,tier,liftsKey,weekIndex) }));
  return { title, author, date:when, createdAt:when, exercises:items, exerciseCount:items.length, program:title.split(" ")[0].toLowerCase(), source:"seed:v2" };
}

async function wipeDomainCollections(db){
  const names=(await db.listCollections().toArray()).map(c=>c.name);
  const targets=names.filter(n=>/session|workout|program|routine/i.test(n));
  let total=0;
  for (const coll of targets){ const res=await db.collection(coll).deleteMany({}); total+=res.deletedCount||0; console.log(`🧹 ${coll}: deleted ${res.deletedCount ?? 0}`); }
  return total;
}

// ---------- Main ----------
(async () => {
  console.log(`Connecting to ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI, { dbName: undefined });
  const db = mongoose.connection.db;

  if (DO_RESET){
    console.log(" --reset supplied: wiping domain collections (sessions/workouts/programs/*).");
    await wipeDomainCollections(db);
  }

  const personas = makePersonas(PEOPLE);
  const sessions = db.collection("sessions");

  let inserted = 0;
  for (const p of personas){
    const end   = new Date();
    const start = startOfWeek(addDays(end, -((WEEKS - 1) * 7)));
    const days  = [];
    for (let w=0; w<WEEKS; w++){
      const weekStart = addDays(start, w*7);
      if (p.program === "PPL"){ days.push(addDays(weekStart,0), addDays(weekStart,2), addDays(weekStart,4)); }
      else { days.push(addDays(weekStart,0), addDays(weekStart,1), addDays(weekStart,3), addDays(weekStart,4)); }
    }
    const schedule = days.map(d => clampNotFuture(nyDateAtHourYmd(d.getFullYear(), d.getMonth(), d.getDate(), 13, rndInt(5,55)))).filter(d => d <= new Date());
    for (let i=0; i<schedule.length; i++){
      const when  = schedule[i];
      const title = titleFor(p.program, i);
      const doc   = sessionDoc({ author:p.name, title, when, tier:p.tier, weekIndex: Math.floor(i / (p.program==="PPL"?3:4)) });
      await sessions.insertOne(doc);
      inserted++;
    }
  }

  console.log(`Seeded ${inserted} session(s) across ${personas.length} persona(s).`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error("Seeding failed:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});