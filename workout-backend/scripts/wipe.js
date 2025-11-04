// wipe.js — wipe domain collections without dropping the whole DB.
// Usage:
//   MONGO_URI="mongodb://127.0.0.1:27017/workouts" node scripts/wipe.js
//   MONGO_URI="..." node scripts/wipe.js --drop-db   # DANGEROUS: drop entire database

const mongoose = require("mongoose");

const args = new Set(process.argv.slice(2));
const DROP_DB = args.has("--drop-db");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI is required"); process.exit(1); }

async function wipeDomainCollections(db){
  const names=(await db.listCollections().toArray()).map(c=>c.name);
  const targets=names.filter(n=>/session|workout|program|routine/i.test(n));
  for (const coll of targets){
    const res = await db.collection(coll).deleteMany({});
    console.log(`${coll}: deleted ${res.deletedCount ?? 0}`);
  }
}

(async () => {
  console.log(`Connecting to ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI, { dbName: undefined });
  const db = mongoose.connection.db;

  if (DROP_DB){
    console.log(" --drop-db supplied: dropping entire database (indexes & data).");
    await db.dropDatabase();
    console.log("Database dropped.");
  } else {
    await wipeDomainCollections(db);
    console.log("Domain collections wiped.");
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error("Wipe failed:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
