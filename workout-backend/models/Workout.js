import mongoose from 'mongoose';
const Workout = new mongoose.Schema({
  title: { type: String, required: true },
  userId: String
}, { timestamps: true });
export default mongoose.model('Workout', Workout);
