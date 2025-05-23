const mongoose = require("mongoose");

/* one exercise inside a session */
const exerciseSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true },
    sets:   { type: Number, required: true },
    reps:   { type: Number, required: true },
    weight: { type: Number, required: true }
  },
  { _id: false }          // don’t create a separate _id for each sub-doc
);

/* session (workout day) */
const sessionSchema = new mongoose.Schema({
  name:      { type: String, required: true },      // “Push Day”
  date:      { type: Date,   default: Date.now },
  userId: String,
  userName:String, 
  isPublic:{ type:Boolean, default:true },
  exercises: [exerciseSchema]
});

/* ——— THE CRUCIAL LINE ——— */
module.exports = mongoose.model("Session", sessionSchema);