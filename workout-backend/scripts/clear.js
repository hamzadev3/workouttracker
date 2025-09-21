import 'dotenv/config';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
await mongoose.connect(process.env.MONGO_URI);
await Session.deleteMany({});
console.log('Cleared');
process.exit(0);
