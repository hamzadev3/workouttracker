const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  date:     { type: Date,   required: true },
  userId:   { type: String, required: true },
  userName: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
  seedTag:  { type: String,  default: "" }, // batch isolation
  exercises: [{ title: String, sets: Number, reps: Number, weight: Number }]
});

// Prevent same user logging the exact same dated session name twice in a batch
sessionSchema.index({ seedTag: 1, userId: 1, date: 1, name: 1 }, { unique: true });
// Fast filter for community queries by batch
sessionSchema.index({ seedTag: 1, isPublic: 1, date: -1 });

module.exports = mongoose.model("Session", sessionSchema);
