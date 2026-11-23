// Fake Firebase for tests: the token "token-<uid>" is valid for that uid,
// anything else is rejected. This lets tests act as different users
// without real Firebase accounts or network calls.
jest.mock("firebase-admin", () => ({
  apps: [],
  initializeApp: jest.fn(),
  auth: () => ({
    verifyIdToken: async (token) => {
      if (token.startsWith("token-")) {
        const uid = token.slice("token-".length);
        return { uid, email: `${uid}@test.dev` };
      }
      throw new Error("invalid token");
    },
  }),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server");
const Session = require("../models/Session");

let mongo;

// A throwaway MongoDB in memory. The first run downloads the MongoDB
// binary, which can take a minute, hence the long timeout.
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120_000);

afterEach(async () => {
  await Session.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const as = (uid) => ({ Authorization: `Bearer token-${uid}` });

async function createSession(uid, body = {}) {
  const res = await request(app).post("/api/sessions").set(as(uid)).send({ name: "Push Day", ...body });
  expect(res.status).toBe(201);
  return res.body;
}

describe("authentication", () => {
  test("rejects a request with no token", async () => {
    const res = await request(app).post("/api/sessions").send({ name: "Leg Day" });
    expect(res.status).toBe(401);
  });

  test("rejects an invalid token", async () => {
    const res = await request(app)
      .post("/api/sessions")
      .set("Authorization", "Bearer not-a-real-token")
      .send({ name: "Leg Day" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/sessions", () => {
  test("takes userId from the token, never from the request body", async () => {
    const res = await request(app)
      .post("/api/sessions")
      .set(as("alice"))
      .send({ name: "Leg Day", userId: "mallory" });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe("alice");
  });

  test("fills in a date and display name when none are given", async () => {
    const s = await createSession("alice");
    expect(s.date).toBeTruthy();
    expect(s.userName).toBe("alice");
  });

  test("requires a name", async () => {
    const res = await request(app).post("/api/sessions").set(as("alice")).send({ name: "   " });
    expect(res.status).toBe(400);
  });
});

describe("reading sessions", () => {
  test("community feed shows only public sessions", async () => {
    await createSession("alice", { name: "Public", isPublic: true });
    await createSession("alice", { name: "Private", isPublic: false });
    const res = await request(app).get("/api/sessions");
    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.name)).toEqual(["Public"]);
  });

  test("/mine needs a login", async () => {
    const res = await request(app).get("/api/sessions/mine");
    expect(res.status).toBe(401);
  });

  test("/mine returns only my sessions, including private ones", async () => {
    await createSession("alice", { name: "Alice private", isPublic: false });
    await createSession("bob", { name: "Bob public" });
    const res = await request(app).get("/api/sessions/mine").set(as("alice"));
    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.name)).toEqual(["Alice private"]);
  });
});

describe("ownership", () => {
  test("cannot delete someone else's session", async () => {
    const s = await createSession("alice");
    const res = await request(app).delete(`/api/sessions/${s._id}`).set(as("bob"));
    expect(res.status).toBe(403);
    expect(await Session.countDocuments()).toBe(1);
  });

  test("owner can delete their session", async () => {
    const s = await createSession("alice");
    const res = await request(app).delete(`/api/sessions/${s._id}`).set(as("alice"));
    expect(res.status).toBe(204);
    expect(await Session.countDocuments()).toBe(0);
  });

  test("cannot add exercises to someone else's session", async () => {
    const s = await createSession("alice");
    const res = await request(app)
      .post(`/api/sessions/${s._id}/exercise`)
      .set(as("bob"))
      .send({ title: "Squat", sets: 3, reps: 5, weight: 225 });
    expect(res.status).toBe(403);
  });

  test("unknown or malformed ids return 404", async () => {
    const missing = new mongoose.Types.ObjectId();
    expect((await request(app).delete(`/api/sessions/${missing}`).set(as("alice"))).status).toBe(404);
    expect((await request(app).delete("/api/sessions/not-an-id").set(as("alice"))).status).toBe(404);
  });
});

describe("exercises", () => {
  test("add, update and delete an exercise", async () => {
    const s = await createSession("alice");
    const base = `/api/sessions/${s._id}/exercise`;

    let res = await request(app).post(base).set(as("alice")).send({ title: "Bench", sets: 3, reps: 8, weight: 135 });
    expect(res.status).toBe(200);
    expect(res.body.exercises).toHaveLength(1);

    res = await request(app).patch(`${base}/0`).set(as("alice")).send({ sets: 4 });
    expect(res.status).toBe(200);
    expect(res.body.exercises[0].sets).toBe(4);

    res = await request(app).delete(`${base}/0`).set(as("alice"));
    expect(res.status).toBe(200);
    expect(res.body.exercises).toHaveLength(0);
  });

  test("rejects an invalid exercise", async () => {
    const s = await createSession("alice");
    const res = await request(app)
      .post(`/api/sessions/${s._id}/exercise`)
      .set(as("alice"))
      .send({ title: "Bench", sets: 0, reps: 8 });
    expect(res.status).toBe(400);
  });

  test("rejects an out-of-range exercise index", async () => {
    const s = await createSession("alice");
    const res = await request(app).delete(`/api/sessions/${s._id}/exercise/5`).set(as("alice"));
    expect(res.status).toBe(400);
  });
});
