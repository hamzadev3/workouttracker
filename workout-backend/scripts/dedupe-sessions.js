const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/workouts";

(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const dupes = await db.collection("sessions").aggregate([
    { $group: {
        _id: { author:"$author", date:"$date", type:"$type" },
        ids: { $push: "$_id" },
        n: { $sum: 1 }
    }},
    { $match: { n: { $gt: 1 } } }
  ]).toArray();

  for (const d of dupes) {
    d.ids.sort();
    const keep = d.ids.shift();
    if (d.ids.length) {
      await db.collection("sessions").deleteMany({ _id: { $in: d.ids } });
      // console.log(`kept ${keep}, removed ${d.ids.length}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(async e => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
