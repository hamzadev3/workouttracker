import { auth } from "./firebase";
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const API =
  (import.meta.env.VITE_API || 'http://localhost:8080/api')
    .replace(/\/$/, ''); // no trailing slash


/* sessions */
export async function getCommunity(uid) {
  const url = uid ? `${BASE}/api/sessions?scope=community&userId=${uid}` : `${BASE}/api/sessions?scope=community`;
  const r = await fetch(url);
  return r.json();
}
export async function getMine(uid) {
  const r = await fetch(`${BASE}/api/sessions?scope=mine&userId=${uid}`);
  return r.json();
}
export async function createSession({ name, date, isPublic, displayName }) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const body = {
    name, date, isPublic,
    userId: auth.currentUser.uid,
    userName: (displayName || auth.currentUser.email.split("@")[0] || "Anonymous").trim()
  };
  const r = await fetch(`${BASE}/api/sessions`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("Failed to create session");
  return r.json();
}
export async function deleteSession(id) {
  await fetch(`${BASE}/api/sessions/${id}`, { method: "DELETE" });
}

/* exercises */
export async function addExercise(sessionId, data) {
  const r = await fetch(`${BASE}/api/sessions/${sessionId}/exercise`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error("Add exercise failed");
  return r.json();
}
export async function deleteExercise(sessionId, idx) {
  const r = await fetch(`${BASE}/api/sessions/${sessionId}/exercise/${idx}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Delete exercise failed");
  return r.json();
}
export async function updateExercise(sessionId, idx, data) {
  const r = await fetch(`${API}/sessions/${sessionId}/exercise/${idx}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const msg = (await r.json().catch(() => ({}))).error || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return r.json();
}


