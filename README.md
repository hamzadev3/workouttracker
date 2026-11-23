# Workout Tracker

![backend-ci](https://github.com/hamzadev3/workouttracker/actions/workflows/backend-ci.yml/badge.svg)

Full-stack app to log workout sessions and share them in a community feed.

## Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Node/Express 5 + Mongoose (MongoDB)
- **Auth**: Firebase Email/Password. The browser signs in with the Firebase client SDK; the API verifies the Firebase ID token on every protected request with `firebase-admin`.
- **Tests**: Jest + Supertest against an in-memory MongoDB; Playwright for E2E
- **CI**: GitHub Actions

## How auth works

1. The user signs in through Firebase in the browser.
2. For protected calls, the frontend sends `Authorization: Bearer <Firebase ID token>` (`getIdToken()` refreshes it automatically when it expires).
3. `workout-backend/middleware/auth.js` verifies the token's signature and sets `req.user.uid`.
4. The API takes the owner's `userId` **only** from the verified token, never from the request, and returns `403` if you try to change someone else's session.

## API

| Method | Path | Login | Description |
|---|---|---|---|
| GET | `/api/sessions` | – | Public community feed |
| GET | `/api/sessions/mine` | ✅ | Your sessions, public and private |
| POST | `/api/sessions` | ✅ | Create a session |
| DELETE | `/api/sessions/:id` | ✅ owner | Delete a session |
| POST | `/api/sessions/:id/exercise` | ✅ owner | Add an exercise |
| PATCH | `/api/sessions/:id/exercise/:idx` | ✅ owner | Update an exercise |
| DELETE | `/api/sessions/:id/exercise/:idx` | ✅ owner | Delete an exercise |

Interactive docs: run the API and open http://localhost:8080/docs

## Run locally

### Backend

```bash
cd workout-backend
cp .env.example .env        # set MONGO_URI and FIREBASE_PROJECT_ID
npm install
npm start                   # http://localhost:8080
```

No MongoDB? `npm run dev:memory` starts the API with a temporary in-memory database (data is lost when you stop it).

### Frontend

```bash
cd workout-frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8080
npm install
npm run dev                 # http://localhost:5173
```

## Tests

```bash
cd workout-backend && npm test
```

The API tests start a throwaway in-memory MongoDB and replace Firebase with a fake token checker, so they need no accounts or network access after the first run (which downloads the MongoDB binary).

## Known limitations

- Exercises are addressed by their position in the list, so two tabs editing the same session at once can change the wrong exercise. Using each exercise's own `_id` would fix this.
- The Playwright E2E tests need a deployed site and a test account (set `E2E_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD` as repo secrets) and are skipped otherwise.
