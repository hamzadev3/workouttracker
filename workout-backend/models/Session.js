import mongoose from 'mongoose';
const Exercise = new mongoose.Schema({
  title: String, sets: Number, reps: Number, weight: Number
}, { _id: false });
const Session = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true },
  userId: String,
  userName: String,
  exercises: { type: [Exercise], default: [] }
}, { timestamps: true });
export default mongoose.model('Session', Session);
