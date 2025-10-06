import { useEffect, useState } from "react";
import { getCommunity, getMine, deleteSession } from "./api";
import SessionCard     from "./components/SessionCard";
import NewSessionModal from "./components/NewSessionModal";
import SessionPage     from "./components/SessionPage";
import AuthModal       from "./components/AuthModal";
import Spinner         from "./components/Spinner";
import { useAuth }     from "./AuthContext";
import toast           from "react-hot-toast";

/**
 * App
 * Top-level page shell. Handles:
 * - switching tabs (Community vs My Workouts)
 * - loading sessions for current tab
 * - opening modals (auth, new session, session detail)
 */

// Lightweight demo filler when browsing as guest
const demoSessions = [
  { _id:"demo1", name:"Demo Push Day", date:new Date(), exercises:[] },
  { _id:"demo2", name:"Demo Pull Day", date:new Date(), exercises:[] }
];

export default function App() {
  const [tab, setTab] = useState("community");
  const [sessions, setS] = useState([]);
  const [loading, setL] = useState(true);
  const [showNew, setNew] = useState(false);
  const [open, setOpn] = useState(null);
  const [showAuth, setA] = useState(false);
  const { user, logout } = useAuth();

  // Load sessions whenever tab or auth state changes.
  useEffect(() => {
    const load = async () => {
      setL(true);
      try{
        if (tab==="mine") {
          if (!user) { setS([]); return; }
          setS(await getMine(user.uid));
        } else {
          const data = await getCommunity(user?.uid);
          // For anonymous users, show demo if community is empty.
          setS(data.length ? data : (!user ? demoSessions : []));
        }
      } catch { toast.error("Failed to load"); }
      finally { setL(false); }
    };
    load();
  }, [tab, user]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">


      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">🏋️ Workout Tracker</h1>
        <div className="space-x-3">
          <button onClick={() => user ? setNew(true) : setA(true)}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
            New Session
          </button>
          {user ? (
            <button onClick={logout} className="text-sm underline">Sign out</button>
          ) : (
            <button onClick={() => setA(true)} className="text-sm underline">Sign in</button>
          )}
        </div>
      </header>

      <div className="mb-8 flex gap-2">
        <button className={`px-3 py-1 rounded-full text-sm ${tab==="community"?"bg-indigo-600":"bg-slate-600/40"}`}
                onClick={() => setTab("community")}>Community</button>
        <button className={`px-3 py-1 rounded-full text-sm ${tab==="mine"?"bg-indigo-600":"bg-slate-600/40"}`}
                onClick={() => user ? setTab("mine") : setA(true)}>My Workouts</button>
      </div>

      {loading ? <p className="text-slate-400">Loading…</p> : (
        <div className="space-y-4">
          {sessions.map(s => (
            <SessionCard key={s._id}
              session={s}
              onOpen={() => setOpn(s)}
              onDelete={async () => {
                await deleteSession(s._id);
                setS(sessions.filter(x => x._id !== s._id));
                toast.success("Session deleted");
              }}/>
          ))}
          {!sessions.length && (
            <p className="text-center text-slate-400">
              {tab==="mine" ? "No personal workouts yet." : "No community workouts yet."}
            </p>
          )}
        </div>
      )}

      {showNew && <NewSessionModal onCreate={s => setS([s, ...sessions])} onClose={() => setNew(false)} />}
      {open && <SessionPage session={open} onUpdate={upd => { setS(sessions.map(s => s._id===upd._id?upd:s)); setOpn(upd); }} onClose={() => setOpn(null)} />}
      {showAuth && <AuthModal onClose={() => setA(false)} />}
    </div>
  );
}
