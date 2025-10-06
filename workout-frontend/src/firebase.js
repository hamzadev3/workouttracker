import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Firebase client initialization.
 * Public keys here are expected in client apps; secrets belong on the server.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAhRailiMSlUDeE5sMnBXMzTbrv-vyi2K8",
  authDomain: "workout-tracker-866fa.firebaseapp.com",
  projectId: "workout-tracker-866fa",
  storageBucket: "workout-tracker-866fa.firebasestorage.app",
  messagingSenderId: "654402806228",
  appId: "1:654402806228:web:958e4ce464a9ef4eb4f641"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
