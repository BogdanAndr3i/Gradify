import { createContext, useContext, useState } from "react";

/* ─── Shape ──────────────────────────────────────────────────────────────── */
// user: null | { name: string, role: 'guest'|'pending'|'student'|'prof'|'admin' }

const AuthContext = createContext(null);

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [user, setUser] = useState({ name: "Vizitator", role: "guest" });

  const login  = (role, name = "Utilizator Demo") => setUser({ name, role });
  const logout = ()                                => setUser({ name: "Vizitator", role: "guest" });

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}