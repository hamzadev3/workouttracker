// apps/web/src/api.js
import { auth } from "./firebase";
const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

async function idToken() {
  const u = auth.currentUser;
  return u ? await u.getIdToken() : "";
}

export async function listSessions({ userId, before, limit = 10 } = {}) {
  const qs = new URLSearchParams();
  if (userId) qs.set("userId", userId);
  if (before) qs.set("before", before);
  qs.set("limit", String(limit));
  const r = await fetch(`${BASE}/sessions?${qs}`);
  if (!r.ok) throw new Error("Failed to fetch sessions");
  return r.json();
}

export async function createSession({ name, date, isPublic }) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");
  const body = { name, date, isPublic, userId: u.uid, userName: u.email.split("@")[0] };
  const r = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${await idToken()}`
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to create session");
  return r.json();
}

export async function deleteSession(id) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = await fetch(`${BASE}/sessions/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${await idToken()}` }
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to delete session");
  try { return await r.json(); } catch { return { ok: true, deletedId: id }; }
}

export async function addExercise(sessionId, data) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = await fetch(`${BASE}/sessions/${sessionId}/exercise`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${await idToken()}`
    },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to add exercise");
  return r.json();
}

export async function deleteExercise(sessionId, idx) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = await fetch(`${BASE}/sessions/${sessionId}/exercise/${idx}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${await idToken()}` }
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to delete exercise");
  return r.json();
}
