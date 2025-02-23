
import { useEffect, useState } from "react";
import WorkoutForm from "./components/WorkoutForm";
import WorkoutList from "./components/WorkoutList";
import { fetchWorkouts, deleteWorkout } from "./api";
import { getSessions, deleteSession } from "./api";
import SessionCard from "./components/SessionCard";
import NewSessionModal from "./components/NewSessionModal";
import SessionPage from "./components/SessionPage";

function App() {
  const [workouts, setWorkouts] = useState([]);
export default function App() {
  const [sessions, setSessions] = useState([]);
  const [showNew,   setShowNew]   = useState(false);
  const [openSess,  setOpenSess]  = useState(null);

  useEffect(() => {
    fetchWorkouts().then(setWorkouts);
  }, []);
  useEffect(() => { getSessions().then(setSessions); }, []);

  const handleAdd = (newWorkout) => {
    setWorkouts([newWorkout, ...workouts]);
  };
  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">🏋️ Workout Tracker</h1>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
        >
          New Session
        </button>
      </header>

  const handleDelete = async (id) => {
    await deleteWorkout(id);
    setWorkouts(workouts.filter(w => w._id !== id));
  };
      <div className="space-y-4">
        {sessions.map(s => (
          <SessionCard
            key={s._id}
            session={s}
            onOpen={() => setOpenSess(s)}
            onDelete={async () => {
              await deleteSession(s._id);
              setSessions(sessions.filter(x => x._id !== s._id));
            }}
          />
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-slate-400">No sessions yet.</p>
        )}
      </div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">🏋️ Workout Tracker</h1>
      <WorkoutForm onAdd={handleAdd} />
      <WorkoutList workouts={workouts} onDelete={handleDelete} />
      {showNew && (
        <NewSessionModal
          onCreate={s => setSessions([s, ...sessions])}
          onClose={() => setShowNew(false)}
        />
      )}

      {openSess && (
        <SessionPage
          session={openSess}
          onUpdate={upd => {
            setSessions(sessions.map(s => (s._id === upd._id ? upd : s)));
            setOpenSess(upd);
          }}
          onClose={() => setOpenSess(null)}
        />
      )}
    </div>
  );


export default App; 