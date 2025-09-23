import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setL] = useState(true);

  useEffect(() =>
    onAuthStateChanged(auth, (u) => { setUser(u); localStorage.uid = u ? u.uid : ""; setL(false); }),
  []);

  const value = {
    user,
    login:  (e, p) => signInWithEmailAndPassword(auth, e, p),
    signup: (e, p) => createUserWithEmailAndPassword(auth, e, p),
    logout: ()     => signOut(auth),
  };

  return <AuthCtx.Provider value={value}>{loading ? null : children}</AuthCtx.Provider>;
}
