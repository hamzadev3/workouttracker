// src/components/SessionPage.jsx
import { useState } from 'react';
import { addExercise, deleteExercise } from '../api';

export default function SessionPage({ session, onUpdate, onClose }) {
  const [title, setTitle] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const upd = await addExercise(session._id, {
      title,
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight)
    });
    onUpdate(upd);
    setTitle(''); setSets(''); setReps(''); setWeight('');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 flex">
      <div className="bg-slate-800 m-auto p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
        <button onClick={onClose} className="float-right mb-2 text-sm">✕</button>
        <h2 className="text-2xl font-bold mb-4">{session.name}</h2>

        <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <input className="col-span-2 bg-slate-700 p-2 rounded" placeholder="Exercise"
                 value={title} onChange={e=>setTitle(e.target.value)} required />
          <input className="bg-slate-700 p-2 rounded" type="number" placeholder="Sets"
                 value={sets} onChange={e=>setSets(e.target.value)} required />
          <input className="bg-slate-700 p-2 rounded" type="number" placeholder="Reps"
                 value={reps} onChange={e=>setReps(e.target.value)} required />
          <input className="bg-slate-700 p-2 rounded" type="number" placeholder="Wt"
                 value={weight} onChange={e=>setWeight(e.target.value)} required />
          <button type="submit" className="col-span-2 sm:col-span-4 bg-indigo-600 rounded p-2 font-semibold">
            Add Exercise
          </button>
        </form>

        <ul className="space-y-2">
          {session.exercises.map((ex, i) => (
            <li key={i} className="rounded bg-slate-700/60 px-3 py-2 text-sm flex justify-between">
              <span>{ex.title}</span>
              <span className="flex items-center gap-3 text-slate-300">
                {ex.sets}×{ex.reps} @ {ex.weight} lbs
                <button
                  onClick={async () => {
                    const upd = await deleteExercise(session._id, i);
                    onUpdate(upd);
                  }}
                  className="text-rose-400 hover:text-rose-300 text-xs"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
