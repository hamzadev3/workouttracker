import { useState } from "react";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";
import { addExercise, deleteExercise, updateExercise } from "../api";

export default function SessionPage({ session, onUpdate, onClose }) {
  const { user } = useAuth();
  const owner = user && user.uid === session.userId;

  const [title, setTitle] = useState("");
  const [sets,  setSets]  = useState("");
  const [reps,  setReps]  = useState("");
  const [weight,setWt]    = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!+sets || !+reps) return toast.error("Sets & reps must be > 0");
    try {
      const upd = await addExercise(session._id, { title, sets, reps, weight });
      onUpdate(upd);
      toast.success("Exercise added");
      setTitle(""); setSets(""); setReps(""); setWt("");
    } catch { toast.error("Error adding exercise"); }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 flex">
      <div className="bg-slate-800 m-auto p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
        <button onClick={onClose} className="float-right mb-2 text-sm">✕</button>
        <h2 className="text-2xl font-bold mb-4">{session.name}</h2>

        {owner && (
          <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <input className="col-span-2 bg-slate-700 p-2 rounded" placeholder="Exercise" required value={title} onChange={(e)=>setTitle(e.target.value)} />
            <input className="bg-slate-700 p-2 rounded" type="number" min="1" placeholder="Sets" required value={sets} onChange={(e)=>setSets(e.target.value)} />
            <input className="bg-slate-700 p-2 rounded" type="number" min="1" placeholder="Reps" required value={reps} onChange={(e)=>setReps(e.target.value)} />
            <input className="bg-slate-700 p-2 rounded" type="number" placeholder="Wt" value={weight} onChange={(e)=>setWt(e.target.value)} />
            <button className="col-span-2 sm:col-span-4 bg-indigo-600 rounded p-2 font-semibold">Add Exercise</button>
          </form>
        )}

        <ul className="space-y-2">
          {session.exercises.map((ex, i) => (
            <li key={i} className="flex justify-between rounded bg-slate-700/60 px-3 py-2 text-sm">
              <span className="font-medium">{ex.title}</span>
              <span className="flex items-center gap-3 text-slate-300">
                <span className="inline-flex items-center gap-2">
                  {owner && (
                    <button
                      aria-label="decrease sets"
                      className="h-6 w-6 rounded bg-slate-800/70 text-xs leading-6 hover:bg-slate-700"
                      onClick={async () => {
                        const next = Math.max(1, Number(ex.sets || 1) - 1);
                        const optimistic = {
                          ...session,
                          exercises: session.exercises.map((e, idx) =>
                            idx === i ? { ...e, sets: next } : e
                          ),
                        };
                        onUpdate(optimistic);
                        try {
                          const server = await updateExercise(session._id, i, { sets: next });
                          onUpdate(server);
                        } catch (err) {
                          toast.error(`Couldn’t update sets: ${err.message}`);
                          onUpdate(session);
                        }
                      }}
                    >−</button>
                  )}

                  <span className="tabular-nums">{ex.sets}×{ex.reps}</span>

                  {owner && (
                    <button
                      aria-label="increase sets"
                      className="h-6 w-6 rounded bg-slate-800/70 text-xs leading-6 hover:bg-slate-700"
                      onClick={async () => {
                        const next = Number(ex.sets || 0) + 1;
                        const optimistic = {
                          ...session,
                          exercises: session.exercises.map((e, idx) =>
                            idx === i ? { ...e, sets: next } : e
                          ),
                        };
                        onUpdate(optimistic);
                        try {
                          const server = await updateExercise(session._id, i, { sets: next });
                          onUpdate(server);
                        } catch (err) {
                          toast.error(`Couldn’t update sets: ${err.message}`);
                          onUpdate(session);
                        }
                      }}
                    >+</button>
                  )}
                </span>

                <span>@ {ex.weight} lbs</span>

                {owner && (
                  <button
                    onClick={async () => {
                      try {
                        const upd = await deleteExercise(session._id, i);
                        onUpdate(upd);
                      } catch (err) {
                        toast.error(`Delete failed: ${err.message}`);
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs"
                  >✕</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
