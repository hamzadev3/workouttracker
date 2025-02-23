const cors = require('cors');
require('dotenv').config();

const sessionRoutes = require("./routes/sessions");
const workoutRoutes = require("./routes/workouts"); 

const app = express();
app.use(cors());
app.use(express.json());

const workoutRoutes = require('./routes/workouts');

app.use('/api/workouts', workoutRoutes);
app.use("/api/sessions", sessionRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => { } )