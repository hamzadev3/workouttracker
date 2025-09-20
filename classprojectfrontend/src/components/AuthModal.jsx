import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function AuthModal({ onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode]   = useState("login");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") await login(email, pass);
      else                  await signup(email, pass);
      onClose?.();
    } catch (e2) {
      setErr(e2.message || "Authentication failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-xl font-bold text-center">
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>

        {err && <p className="text-rose-300 text-sm">{err}</p>}

        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
               placeholder="you@example.com" className="w-full p-2 rounded bg-slate-700" />
        <input type="password" required value={pass} onChange={e=>setPass(e.target.value)}
               placeholder="password" className="w-full p-2 rounded bg-slate-700" />

        <button type="submit" className="w-full bg-indigo-600 rounded p-2 font-semibold">
          {mode === "login" ? "Sign in" : "Sign up"}
        </button>

        <button type="button" onClick={onClose} className="w-full border rounded p-2">Cancel</button>

        <p className="text-center text-xs text-slate-400">
          {mode === "login" ? (
            <>No account? <button type="button" className="underline" onClick={()=>setMode("signup")}>Create one</button></>
          ) : (
            <>Already have an account? <button type="button" className="underline" onClick={()=>setMode("login")}>Sign in</button></>
          )}
        </p>
      </form>
    </div>
  );
}
