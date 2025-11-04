import { useState } from "react";
import { createSession } from "../api";
import toast from "react-hot-toast";

// Modal to create a new session; calls onCreate() on success

export default function NewSessionModal({ onCreate, onClose }) {
  // Keep inputs controlled; default public to encourage community sharing.
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [isPublic, setPub] = useState(true);
  const [displayName, setDN] = useState("");

  // Single submit handler with early validation for UX.
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Session name required");
    try {
      const s = await createSession({ name, date, isPublic, displayName });
      onCreate(s);
      toast.success("Session created");
      onClose();
    } catch {
      // Avoid leaking server internals; concise user-friendly message.
      toast.error("Error creating session");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-slate-800 p-8 shadow-2xl space-y-5">
        <h2 className="text-xl font-bold text-center">New Workout Session</h2>
        <input className="w-full p-2 rounded bg-slate-700" placeholder="Session name" required value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full p-2 rounded bg-slate-700" type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e)=>setPub(e.target.checked)} />
          Show in Community tab
        </label>
        {isPublic && (
          <input className="w-full p-2 rounded bg-slate-700 text-sm" placeholder="Display name (optional)" value={displayName} onChange={(e)=>setDN(e.target.value)} />
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded p-2">Cancel</button>
          <button type="submit" className="flex-1 bg-indigo-600 rounded p-2 font-semibold">Create</button>
        </div>
      </form>
    </div>
  );
}
