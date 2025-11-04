# Workout Tracker

Full-stack demo to log sessions and share a lightweight community feed.

## Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Node/Express + Mongoose (MongoDB)
- **Auth**: Firebase Email/Password (client SDK)
- **CI**: GitHub Actions (unit + E2E)

## Features

- Community vs “My Workouts” tabs
- Create/delete sessions, add/edit sets/reps/weight
- Simple optimistic UI on exercise tweaks
- Seed scripts to generate realistic history for demos

## Run Locally

### Backend

```bash
cd workout-backend
cp .env.example .env        # set MONGO_URI
npm install
npm run seed                # optional demo data
npm start                   # http://localhost:8080
```

### Frontend

```bash
cd workout-frontend
cp .env.example .env        # set VITE_API_URL to http://localhost:8080
npm install
npm run dev                 # http://localhost:5173
```

### Environment

- API: MONGO_URI (e.g. mongodb://127.0.0.1:27017/workouts)
- Web: VITE_API_URL (default http://localhost:8080)

### Tests

- Backend: cd workout-backend && npm test
- E2E (frontend): set E2E_BASE_URL, E2E_EMAIL, E2E_PASSWORD in repo secrets, then CI runs Playwright on push
