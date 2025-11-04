import { auth } from "./firebase";

const RAW = import.meta.env.VITE_API_URL || "http://localhost:8080";
const SEED = import.meta.env.VITE_SEED_TAG || "";
const DEDUPE = import.meta.env.VITE_COMMUNITY_DEDUPE === "1";
const API_BASE = RAW.replace(/\/$/, "").replace(/\/api$/, ""); // strip trailing slash AND trailing /api
const api = (path) => `${API_BASE}/api${path}`;

export async function getCommunity(uid) {
  const params = new URLSearchParams({ scope: "community" });
  if (uid) params.set("userId", uid);
  if (SEED) params.set("seedTag", SEED);
  if (DEDUPE) params.set("dedupe", "1");
  const url = `${api("/sessions")}?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
}

export async function getMine(uid) {
  const r = await fetch(`${api("/sessions")}?scope=mine&userId=${encodeURIComponent(uid)}`);
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
}

export async function createSession({ name, date, isPublic, displayName }) {
  if (!auth.currentUser) throw new Error("Not signed in");
  const body = {
    name,
    date,
    isPublic,
    userId: auth.currentUser.uid,
    userName: (displayName || auth.currentUser.email.split("@")[0] || "Anonymous").trim(),
    seedTag: SEED
  };
  const r = await fetch(api("/sessions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed to create session");
  return r.json();
}

export async function deleteSession(id) {
  const r = await fetch(api(`/sessions/${id}`), { method: "DELETE" });
  if (!r.ok) throw new Error("Delete failed");
}

export async function addExercise(sessionId, data) {
  const r = await fetch(api(`/sessions/${sessionId}/exercise`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Add exercise failed");
  return r.json();
}

export async function deleteExercise(sessionId, idx) {
  const r = await fetch(api(`/sessions/${sessionId}/exercise/${idx}`), { method: "DELETE" });
  if (!r.ok) throw new Error("Delete exercise failed");
  return r.json();
}

export async function updateExercise(sessionId, idx, data) {
  const r = await fetch(api(`/sessions/${sessionId}/exercise/${idx}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const msg = (await r.json().catch(() => ({}))).error || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return r.json();
}
