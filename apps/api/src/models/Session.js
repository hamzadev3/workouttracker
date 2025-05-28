const mongoose = require('mongoose');
const exerciseSchema = new mongoose.Schema({ title:String, sets:Number, reps:Number, weight:Number }, { _id:false });
const sessionSchema = new mongoose.Schema({
  name: { type:String, required:true },
  date: { type:Date, default:Date.now, index:true },
  userId: { type:String, index:true },
  userName: String,
  isPublic: { type:Boolean, default:true, index:true },
  exercises: [exerciseSchema]
});
module.exports = mongoose.model('Session', sessionSchema);
