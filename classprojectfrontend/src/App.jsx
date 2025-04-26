// notes/2025-04-28-13-loading-and-errors/classprojectfrontend/src/App.jsx
import { useEffect, useState } from "react";
import { getSessions, deleteSession } from "./api";
import SessionCard     from "./components/SessionCard";
import NewSessionModal from "./components/NewSessionModal";
import SessionPage     from "./components/SessionPage";
import AuthModal       from "./components/AuthModal";
import { useAuth }     from "./AuthContext";

const demoSessions = [
  { _id:"demo1", name:"Demo Push Day", date:new Date(), exercises:[] },
  { _id:"demo2", name:"Demo Pull Day", date:new Date(), exercises:[] }
];

export default function App() {
  const [sessions,setSessions] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [error,  setError]     = useState("");
  const [showNew, setShowNew]  = useState(false);
  const [open,    setOpen]     = useState(null);
  const [showAuth,setAuth]     = useState(false);

  const { user, logout } = useAuth();

  useEffect(()=>{
    setLoading(true);
    setError("");
    getSessions(user?.uid).then((data)=>{
      if (data.length)      setSessions(data);
      else if (!user)       setSessions(demoSessions);
      else                  setSessions([]);
    }).catch(e=> {
      setError(e.message || "Failed to load sessions");
      setSessions([]);
    }).finally(()=> setLoading(false));
  },[user]);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">🏋️ Workout Tracker</h1>

        <div className="space-x-3">
          <button
            onClick={()=> user ? setShowNew(true) : setAuth(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
            New Session
          </button>
          {user ? (
            <button onClick={logout} className="text-sm underline">Sign out</button>
          ) : (
            <button onClick={()=>setAuth(true)} className="text-sm underline">Sign in</button>
          )}
        </div>
      </header>

      {error && <p className="text-rose-300 mb-4 text-sm">{error}</p>}
      {loading && <p className="text-slate-400 mb-4">Loading…</p>}

      <div className="space-y-4">
        {!loading && sessions.map((s)=>(
          <SessionCard
            key={s._id}
            session={s}
            onOpen={()=>setOpen(s)}
            onDelete={async()=>{
              if (!user) return setAuth(true);
              try {
                await deleteSession(s._id);
                setSessions(sessions.filter(x=>x._id!==s._id));
              } catch (e) {
                setError(e.message || "Failed to delete");
              }
            }} />
        ))}

        {!loading && sessions.length===0 && !error && (
          <p className="text-center text-slate-400">No sessions yet.</p>
        )}
      </div>

      {showNew && (
        <NewSessionModal
          onCreate={(s)=>setSessions([s,...sessions])}
          onClose={()=>setShowNew(false)} />
      )}

      {open && (
        <SessionPage
          session={open}
          onUpdate={(upd)=>{
            setSessions(sessions.map(s=>s._id===upd._id?upd:s));
            setOpen(upd);
          }}
          onClose={()=>setOpen(null)} />
      )}

      {showAuth && <AuthModal onClose={()=>setAuth(false)} />}
    </div>
  );
}
