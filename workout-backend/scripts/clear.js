#!/usr/bin/env node
// Deletes ALL sessions in the DB
require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../models/Session');

(async function () {
  const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!MONGO) { console.error('Missing MONGO_URI/MONGODB_URI'); process.exit(1); }
  await mongoose.connect(MONGO);
  const r = await Session.deleteMany({});
  console.log(`Deleted ${r.deletedCount} sessions`);
  await mongoose.disconnect();
})();
