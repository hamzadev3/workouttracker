import { auth } from "./firebase";

function base() {
  const v = import.meta.env.VITE_API_URL;
  return (v && v.replace(/\/$/, "")) || "http://localhost:8080/api";
}

async function authHeaders() {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* -------- SESSIONS --------------------------------------- */
export async function getSessions(uid, { before, limit } = {}) {
  const qs = new URLSearchParams();
  if (uid) qs.set("userId", uid);
  if (before) qs.set("before", before);
  if (limit)  qs.set("limit", String(limit));
  const r = await fetch(`${base()}/sessions?${qs.toString()}`);
  if (!r.ok) throw new Error("Failed to fetch sessions");
  return r.json();
}

export async function createSession({ name, date, isPublic }) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const body = {
    name,
    date,
    isPublic,
    userId:   auth.currentUser.uid,
    userName: auth.currentUser.email?.split("@")[0] || "user"
  };
  const r = await fetch(`${base()}/sessions`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body:    JSON.stringify(body)
  });
  if (!r.ok) throw new Error("Failed to create session");
  return r.json();
}

export async function deleteSession(id) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = await fetch(`${base()}/sessions/${id}`, {
    method: "DELETE",
    headers: await authHeaders()
  });
  if (!r.ok) throw new Error("Failed to delete");
  // some early BE returns 204; later returns JSON; handle both
  try { return await r.json(); } catch { return { ok: true, deletedId: id }; }
}

/* -------- EXERCISES -------------------------------------- */
export async function addExercise(sessionId, data) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const clean = {
    title:  data.title,
    sets:   Number(data.sets),
    reps:   Number(data.reps),
    weight: Number(data.weight)
  };
  const r = await fetch(`${base()}/sessions/${sessionId}/exercise`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body:    JSON.stringify(clean)
  });
  if (!r.ok) throw new Error("Failed to add exercise");
  return r.json();
}

export async function deleteExercise(sessionId, idx) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = await fetch(`${base()}/sessions/${sessionId}/exercise/${idx}`, {
    method: "DELETE",
    headers: await authHeaders()
  });
  if (!r.ok) throw new Error("Failed to delete exercise");
  return r.json();
}