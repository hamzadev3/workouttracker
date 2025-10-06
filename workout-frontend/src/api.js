import { auth } from "./firebase";

// Normalize base URLs and avoid trailing slashes to prevent double-slashes.
// NOTE: Two different env vars are used: VITE_API_URL and VITE_API.
// Keep them in sync or consolidate to one to reduce confusion.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const API =
  (import.meta.env.VITE_API || 'http://localhost:8080/api')
    .replace(/\/$/, ''); // no trailing slash


/* sessions */

/**
 * Fetch community sessions.
 * When uid is provided, server can exclude the user's private ones, etc.
 */
export async function getCommunity(uid) {
  const url = uid ? `${BASE}/api/sessions?scope=community&userId=${uid}` : `${BASE}/api/sessions?scope=community`;
  const r = await fetch(url);
  return r.json();
}

/** Fetch sessions owned by current user */
export async function getMine(uid) {
  const r = await fetch(`${BASE}/api/sessions?scope=mine&userId=${uid}`);
  return r.json();
}

/**
 * Create a new session for the signed-in user.
 * Requires auth; throws if not signed in.
 */
export async function createSession({ name, date, isPublic, displayName }) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const body = {
    name, date, isPublic,
    userId: auth.currentUser.uid,
    // Default to local-part of email; trim to avoid accidental whitespace
    userName: (displayName || auth.currentUser.email.split("@")[0] || "Anonymous").trim()
  };
  const r = await fetch(`${BASE}/api/sessions`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("Failed to create session");
  return r.json();
}

/** Best-effort delete. Caller handles post-delete UI. */
export async function deleteSession(id) {
  await fetch(`${BASE}/api/sessions/${id}`, { method: "DELETE" });
}

/* exercises */

/**
 * Add an exercise to a session by id.
 * Server returns the updated session document.
 */
export async function addExercise(sessionId, data) {
  const r = await fetch(`${BASE}/api/sessions/${sessionId}/exercise`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error("Add exercise failed");
  return r.json();
}

/** Remove an exercise by index within the session */
export async function deleteExercise(sessionId, idx) {
  const r = await fetch(`${BASE}/api/sessions/${sessionId}/exercise/${idx}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Delete exercise failed");
  return r.json();
}

/**
 * Update specific fields for an exercise via PATCH.
 */
export async function updateExercise(sessionId, idx, data) {
  const r = await fetch(`${API}/sessions/${sessionId}/exercise/${idx}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    // Capture server-provided error message when available.
    const msg = (await r.json().catch(() => ({}))).error || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return r.json();
}


