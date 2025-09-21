import 'dotenv/config';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
await mongoose.connect(process.env.MONGO_URI);
await Session.deleteMany({});
await Session.create([
  { name: 'Demo Push Day', isPublic: true, exercises: [] },
  { name: 'Demo Pull Day', isPublic: true, exercises: [] }
]);
console.log('Seeded');
process.exit(0);
