import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await api.post("/api/auth/register", {
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
        });
        // Forțează refresh token ca să preia custom claims actualizate
        await firebaseUser.getIdToken(true);
        const token = await firebaseUser.getIdTokenResult();
        setUser({
          id:    firebaseUser.uid,
          email: firebaseUser.email,
          name:  profile.name || firebaseUser.displayName,
          role:  token.claims.role || profile.role || "pending",
        });
        } catch {
            const tokenFallback = await firebaseUser.getIdTokenResult();
            setUser({
              id:    firebaseUser.uid,
              email: firebaseUser.email,
              name:  firebaseUser.displayName,
              role:  tokenFallback.claims.role || "pending",
            });
          }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = async () => {
    await api.post("/api/auth/logout", {}).catch(() => {});
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}