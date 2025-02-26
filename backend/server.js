const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const sessionRoutes = require('./routes/sessions');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRoutes);

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workouts'; // dev default

mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(() => {
  console.log('Mongo connected');
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Mongo connection error:', err.message);
  process.exit(1);
});
