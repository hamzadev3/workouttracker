export default function SessionCard({ session, onOpen, onDelete }) {
  const owner = session.userId === localStorage.uid;
  return (
    <div className="rounded-xl bg-slate-800/50 backdrop-blur p-6 flex justify-between shadow-md">
      <div>
        <h3 className="text-lg font-semibold">{session.name}</h3>
        <p className="text-xs text-slate-400 mb-1">by {session.userName || "Anonymous"}</p>
        <p className="text-xs text-slate-400">
          {new Date(session.date).toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" })}
        </p>
        <p className="text-xs mt-1">{session.exercises.length} exercise(s)</p>
      </div>
      <div className="space-x-2 self-start">
        <button onClick={onOpen} className="text-indigo-400 hover:underline text-sm">Open</button>
        {owner && <button onClick={onDelete} className="text-rose-400 hover:underline text-sm">Delete</button>}
      </div>
    </div>
  );
}
