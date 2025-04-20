import { useState } from "react";
import { addExercise, deleteExercise } from "../api";
import { useAuth } from "../AuthContext";

export default function SessionPage({ session, onUpdate, onClose }) {
  const { user } = useAuth();
  const owner    = user && user.uid === session.userId;

  const [title,setTitle] = useState("");
  const [sets, setSets]  = useState("");
  const [reps, setReps]  = useState("");
  const [weight,setWt]   = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const upd = await addExercise(session._id, { title, sets, reps, weight });
    onUpdate(upd);
    setTitle(""); setSets(""); setReps(""); setWt("");
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 flex">
      <div className="bg-slate-800 m-auto p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
        <button onClick={onClose} className="float-right mb-2 text-sm">✕</button>
        <h2 className="text-2xl font-bold mb-4">{session.name}</h2>

        {owner && (
          <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <input className="col-span-2 bg-slate-700 p-2 rounded"
                   value={title} onChange={(e)=>setTitle(e.target.value)}
                   placeholder="Exercise" required />
            <input className="bg-slate-700 p-2 rounded" type="number"
                   value={sets}  onChange={(e)=>setSets(e.target.value)}
                   placeholder="Sets" required />
            <input className="bg-slate-700 p-2 rounded" type="number"
                   value={reps}  onChange={(e)=>setReps(e.target.value)}
                   placeholder="Reps" required />
            <input className="bg-slate-700 p-2 rounded" type="number"
                   value={weight} onChange={(e)=>setWt(e.target.value)}
                   placeholder="Wt" required />
            <button className="col-span-2 sm:col-span-4 bg-indigo-600 rounded p-2 font-semibold">
              Add Exercise
            </button>
          </form>
        )}

        <ul className="space-y-2">
          {session.exercises.map((ex,i)=>(
            <li key={i} className="rounded bg-slate-700/60 px-3 py-2 text-sm flex justify-between">
              <span>{ex.title}</span>
              <span className="flex items-center gap-3 text-slate-300">
                {ex.sets}×{ex.reps} @ {ex.weight} lbs
                {owner && (
                  <button
                    onClick={async()=>{
                      const upd = await deleteExercise(session._id,i);
                      onUpdate(upd);
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs">✕</button>
                )}
              </span>
            </li>
          ))}
        </ul>


      </div>
    </div>
  );}