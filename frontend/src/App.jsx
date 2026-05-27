import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import IstoricPage from "./pages/IstoricPage";
import StudentiPage from "./pages/StudentiPage";
import RevizuirePage from "./pages/RevizuirePage";
import UsersPage from "./pages/UsersPage";
import ToateLicentelePage from "./pages/ToateLicentelePage";
import ProfilPage from "./pages/ProfilPage";

function WaitingRoom() {
  const { user, logout } = useAuth();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#f0f4f8", fontFamily: "Segoe UI, system-ui, sans-serif",
      gap: "16px", textAlign: "center", padding: "24px",
    }}>
      <div style={{
        fontSize: "2.5rem", width: "72px", height: "72px",
        background: "#fff3cd", borderRadius: "50%",
        display: "grid", placeItems: "center",
      }}>⬳</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
        Cont în așteptare
      </h1>
      <p style={{ color: "#64748b", maxWidth: "360px", lineHeight: 1.6, margin: 0 }}>
        Bine ai venit, <strong>{user?.name}</strong>! Contul tău este în curs de verificare.
        Vei primi acces după ce un administrator îți aprobă rolul.
      </p>
      <button onClick={logout} style={{
        marginTop: "8px", padding: "10px 24px", borderRadius: "8px",
        border: "1.5px solid #e2e8f0", background: "#fff",
        color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
      }}>
        Deconectare
      </button>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user)              return <Navigate to="/login" replace />;
  if (user.role === "pending") return <WaitingRoom />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"        element={<DashboardPage />} />
        <Route path="utilizatori"      element={<UsersPage />} />
        <Route path="licente"          element={<ToateLicentelePage />} />
        <Route path="upload"           element={<UploadPage />} />
        <Route path="istoric"          element={<IstoricPage />} />
        <Route path="studenti"         element={<StudentiPage />} />
        <Route path="revizuire/:thesisId" element={<RevizuirePage />} />
        <Route path="profil" element={<ProfilPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}