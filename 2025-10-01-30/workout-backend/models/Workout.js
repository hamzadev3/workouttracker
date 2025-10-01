const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  { title: String, sets: Number, reps: Number, weight: Number },
  { timestamps: true }
);

module.exports = mongoose.model("Workout", workoutSchema);
