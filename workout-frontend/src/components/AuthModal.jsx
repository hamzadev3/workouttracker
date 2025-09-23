import { useState } from "react";
import { useAuth } from "../AuthContext";

const MSG = {
  "auth/email-already-in-use": "That email is already registered.",
  "auth/invalid-email": "Please enter a valid email.",
  "auth/weak-password": "Use at least 6 characters.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/user-not-found": "We couldn't find an account for that email.",
  "auth/wrong-password": "Wrong password for that email."
};

export default function AuthModal({ onClose }) {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (isSignup) await signup(email, pass);
      else          await login(email, pass);
      onClose?.();
    } catch (e2) {
      setErr(MSG[e2.code] || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl space-y-4">
        <button type="button" onClick={onClose} className="absolute top-2 right-3 text-sm">✕</button>
        <h2 className="text-center text-xl font-bold">{isSignup ? "Create Account" : "Sign In"}</h2>
        {err && <p className="text-rose-400 text-xs">{err}</p>}
        <input autoFocus type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded bg-slate-700 px-3 py-2" />
        <input type="password" required value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" className="w-full rounded bg-slate-700 px-3 py-2" />
        <button className="w-full rounded bg-indigo-600 py-2 font-semibold hover:bg-indigo-500">{isSignup ? "Sign Up" : "Sign In"}</button>
        <p className="text-center text-xs text-slate-400">
          {isSignup ? (<>Already have an account? <button type="button" className="underline" onClick={()=>setIsSignup(false)}>Sign in</button></>) :
                      (<>Need an account? <button type="button" className="underline" onClick={()=>setIsSignup(true)}>Sign up</button></>)}
        </p>
      </form>
    </div>
  );
}
