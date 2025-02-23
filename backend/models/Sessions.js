// backend/models/Session.js
const mongoose = require("mongoose");

/* one exercise inside a session */
const exerciseSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true },
    sets:   { type: Number, required: true },
    reps:   { type: Number, required: true },
    weight: { type: Number, required: true }
  },
  { _id: false }
);

/* session (workout day) */
const sessionSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  date:      { type: Date,   default: Date.now },
  userId:    { type: String },
  userName:  { type: String },
  isPublic:  { type: Boolean, default: true },
  exercises: [exerciseSchema]
});

module.exports = mongoose.model("Session", sessionSchema);
