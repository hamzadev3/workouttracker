import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

/**
 * AuthContext
 * Minimal auth wrapper around Firebase Auth.
 * Exposes { user, login, signup, logout } and defers UI to consumers.
 */
const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setL] = useState(true);

  useEffect(() =>
    // Subscribe once and update user + local storage for legacy checks.
    onAuthStateChanged(auth, (u) => { setUser(u); localStorage.uid = u ? u.uid : ""; setL(false); }), 
    []
  );

  const value = {
    user,
    // Thin wrappers keep callsites tidy; errors bubble to caller.
    login:  (e, p) => signInWithEmailAndPassword(auth, e, p),
    signup: (e, p) => createUserWithEmailAndPassword(auth, e, p),
    logout: ()     => signOut(auth),
  };

  return <AuthCtx.Provider value={value}>{loading ? null : children}</AuthCtx.Provider>;
}
