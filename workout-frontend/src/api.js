const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api';

export async function getCommunity(userId) {
  const res = await fetch(`${BASE}/sessions`);
  if (!res.ok) throw new Error('load failed');
  const data = await res.json();
  return data.map(x => ({ ...x, owner: userId && x.userId === userId }));
}

export async function getMine(userId) {
  const url = new URL(`${BASE}/sessions`);
  url.searchParams.set('mine', '1');
  url.searchParams.set('userId', userId);
  const res = await fetch(url);
  if (!res.ok) throw new Error('load failed');
  return res.json();
}

export async function createSession(body) {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('create failed');
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('delete failed');
}

export async function addExercise(id, payload) {
  const res = await fetch(`${BASE}/sessions/${id}/exercises`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('add exercise failed');
  return res.json();
}

export async function updateExercise(id, idx, patch) {
  const res = await fetch(`${BASE}/sessions/${id}/exercises/${idx}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error('update exercise failed');
  return res.json();
}
