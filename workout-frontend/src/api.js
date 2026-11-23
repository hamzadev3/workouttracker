import { auth } from "./firebase";

const RAW = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_BASE = RAW.replace(/\/$/, "").replace(/\/api$/, ""); // strip trailing slash AND trailing /api
const api = (path) => `${API_BASE}/api${path}`;

// Headers for requests that need a signed-in user.
// getIdToken() returns the user's Firebase ID token and refreshes it
// automatically when it has expired (tokens last about an hour).
async function authHeaders(extra = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { ...extra, Authorization: `Bearer ${token}` };
}

// Throws an Error carrying the server's message when the response isn't 2xx.
async function check(r, fallback) {
  if (r.ok) return;
  const body = await r.json().catch(() => ({}));
  throw new Error(body.error || `${fallback} (HTTP ${r.status})`);
}

export async function getCommunity() {
  const r = await fetch(api("/sessions"));
  await check(r, "Failed to load");
  return r.json();
}

export async function getMine() {
  const r = await fetch(api("/sessions/mine"), { headers: await authHeaders() });
  await check(r, "Failed to load");
  return r.json();
}

export async function createSession({ name, date, isPublic, displayName }) {
  const r = await fetch(api("/sessions"), {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, date, isPublic, userName: displayName }),
  });
  await check(r, "Failed to create session");
  return r.json();
}

export async function deleteSession(id) {
  const r = await fetch(api(`/sessions/${id}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await check(r, "Delete failed");
}

export async function addExercise(sessionId, data) {
  const r = await fetch(api(`/sessions/${sessionId}/exercise`), {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  await check(r, "Add exercise failed");
  return r.json();
}

export async function deleteExercise(sessionId, idx) {
  const r = await fetch(api(`/sessions/${sessionId}/exercise/${idx}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await check(r, "Delete exercise failed");
  return r.json();
}

export async function updateExercise(sessionId, idx, data) {
  const r = await fetch(api(`/sessions/${sessionId}/exercise/${idx}`), {
    method: "PATCH",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  await check(r, "Update failed");
  return r.json();
}