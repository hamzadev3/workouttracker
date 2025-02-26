// src/App.jsx
import { useEffect, useState } from 'react';
import { getSessions, createSession, deleteSession } from './api';
import SessionCard from './components/SessionCard';
import NewSessionModal from './components/NewSessionModal';
import SessionPage from './components/SessionPage';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [openSess, setOpenSess] = useState(null);

  useEffect(() => { getSessions().then(setSessions); }, []);

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

      {showNew && (
        <NewSessionModal
          onCreate={async (name, date) => {
            const created = await createSession({ name, date });
            setSessions([created, ...sessions]);
            setShowNew(false);
          }}
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
}
