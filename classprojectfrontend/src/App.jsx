// notes/2025-04-29-14-pagination/classprojectfrontend/src/App.jsx
import { useEffect, useState } from "react";
import { getSessions, deleteSession } from "./api";
import SessionCard from "./components/SessionCard";
import NewSessionModal from "./components/NewSessionModal";
import SessionPage from "./components/SessionPage";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./AuthContext";

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
  const [hasMore, setHasMore]  = useState(true);

  const { user, logout } = useAuth();

  async function load(initial=false) {
    setLoading(true);
    setError("");
    try {
      const last = initial ? null : sessions[sessions.length-1];
      const qs = new URLSearchParams();
      if (user?.uid) qs.set("userId", user.uid);
      qs.set("limit","10");
      if (last) qs.set("before", last.date);
      const resp = await fetch(`${(import.meta.env.VITE_API_URL ?? "http://localhost:8080/api").replace(/\/$/,"")}/sessions?${qs}`);
      if (!resp.ok) throw new Error("Fetch failed");
      const page = await resp.json();
      if (initial) setSessions(page);
      else setSessions([...sessions, ...page]);
      setHasMore(page.length === 10);
    } catch (e) {
      setError(e.message || "Failed to load sessions");
      if (initial && !user) setSessions(demoSessions);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(true); /* initial */ },[user]);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">🏋️ Workout Tracker</h1>
        <div className="space-x-3">
  {user ? (
    <>
      <button
        onClick={()=> setShowNew(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
        New Session
      </button>
      <button onClick={logout} className="text-sm underline">Sign out</button>
    </>
  ) : (
    <>
      <span className="text-sm text-slate-300 hidden sm:inline">
        Browsing public feed — sign in to create your own.
      </span>
      <button onClick={()=>setAuth(true)} className="rounded-lg border px-3 py-2 text-sm">
        Sign in
      </button>
    </>
  )}
</div>

      </header>

      {error && <p className="text-rose-300 mb-4 text-sm">{error}</p>}
      {loading && sessions.length===0 && <p className="text-slate-400 mb-4">Loading…</p>}

      <div className="space-y-4">
        {sessions.map((s)=>(
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
      </div>

      {!loading && hasMore && (
        <div className="mt-6 flex justify-center">
          <button onClick={()=>load(false)} className="border rounded px-4 py-2 text-sm">Load more</button>
        </div>
      )}

      {sessions.length===0 && !loading && !error && (
        <p className="text-center text-slate-400">No sessions yet.</p>
      )}

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
