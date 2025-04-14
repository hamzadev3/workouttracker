import { useEffect, useState } from "react";
import { getSessions, deleteSession } from "./api";
import SessionCard from "./components/SessionCard";
import NewSessionModal from "./components/NewSessionModal";
import SessionPage from "./components/SessionPage";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./AuthContext";

const demoSessions = [
  { _id: "demo1", name: "Demo Push Day", date: new Date(), exercises: [] },
  { _id: "demo2", name: "Demo Pull Day", date: new Date(), exercises: [] },
];

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [openSess, setOpenSess] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    getSessions(user?.uid).then((data) => {
      setSessions(data.length ? data : demoSessions);
    });
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">🏋️ Workout Tracker</h1>

        <div className="space-x-3">
          <button
            onClick={() => (user ? setShowNew(true) : setShowAuth(true))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
          >
            New Session
          </button>
          {user ? (
            <button onClick={logout} className="text-sm underline">Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="text-sm underline">Sign in</button>
          )}
        </div>
      </header>

      <div className="space-y-4">
        {sessions.map((s) => (
          <SessionCard
            key={s._id}
            session={s}
            onOpen={() => setOpenSess(s)}
            onDelete={async () => {
              if (!user) return setShowAuth(true);
              await deleteSession(s._id);
              setSessions((prev) => prev.filter((x) => x._id !== s._id));
            }}
          />
        ))}
      </div>

      {showNew && (
        <NewSessionModal
          onCreate={(created) => {
            setSessions((prev) => [created, ...prev]);
            setShowNew(false);
          }}
          onClose={() => setShowNew(false)}
        />
      )}

      {openSess && (
        <SessionPage
          session={openSess}
          onUpdate={(upd) => {
            setSessions((prev) => prev.map((s) => (s._id === upd._id ? upd : s)));
            setOpenSess(upd);
          }}
          onClose={() => setOpenSess(null)}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
