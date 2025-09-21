import { auth } from "./firebase";
const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

async function idToken() {
  const u = auth.currentUser;
  if (!u) return "";
  return await u.getIdToken();
}

export async function getSessions(uid) {
  const url = uid ? `${BASE}/sessions?userId=${uid}` : `${BASE}/sessions`;
  const r   = await fetch(url);
  if (!r.ok) throw new Error((await r.json()).error || "Failed to fetch sessions");
  return r.json();
}

export async function createSession({ name, date, isPublic }) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const body = {
    name, date, isPublic,
    userId:   auth.currentUser.uid,
    userName: auth.currentUser.email.split("@")[0]
  };
  const r = await fetch(`${BASE}/sessions`, {
    method:  "POST",
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
  if (!r.ok) throw new Error("Failed to delete session");
  return r.json();
}

export async function addExercise(sessionId, data) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const r = await fetch(`${BASE}/sessions/${sessionId}/exercise`, {
    method:  "POST",
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
