import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import BorderGlow from "../components/BorderGlow";
import "./ProfilPage.css";

const ROLE_LABEL = {
  student: "Student",
  prof:    "Profesor Coordonator",
  admin:   "Administrator",
  pending: "Cont în așteptare",
};

const ROLE_COLOR = {
  student: "#1a8cff",
  prof:    "#7c3aed",
  admin:   "#dc2626",
  pending: "#f59e0b",
};

function Avatar({ name }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className="profil-avatar">
      {initials}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="profil-info-row">
      <span className="profil-info-label">{label}</span>
      <span className="profil-info-value">{value || <em className="profil-empty">Necompletat</em>}</span>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return null;
  const ms = ts._seconds ? ts._seconds * 1000 : Date.parse(ts);
  return new Date(ms).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ProfilPage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get("/api/auth/me")
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="profil-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="profil-container"><p style={{ color: "red" }}>{error}</p></div>;

  const roleColor = ROLE_COLOR[profile.role] || "#64748b";

  return (
    <div className="profil-container">
      <div className="upload-header">
        <h1>Profilul Meu</h1>
        <p>Informațiile contului tău pe platforma Gradify.</p>
      </div>

      <BorderGlow
        backgroundColor="#ffffff"
        borderRadius={12}
        glowColor="210 100 60"
        colors={['#1a8cff', '#60a5fa', '#93c5fd']}
        glowIntensity={0.9}
      >
        <div className="profil-card">
          <div className="profil-top">
            <Avatar name={profile.name} />
            <div className="profil-top__info">
              <h2 className="profil-name">{profile.name}</h2>
              <span className="profil-role-badge" style={{ background: roleColor + "18", color: roleColor, borderColor: roleColor + "40" }}>
                {ROLE_LABEL[profile.role] || profile.role}
              </span>
            </div>
          </div>

          <div className="profil-divider" />

          <div className="profil-info-list">
            <InfoRow label="Email"       value={profile.email} />
            <InfoRow label="Facultate"   value={profile.facultate} />
            <InfoRow label="Departament" value={profile.departament} />
            <InfoRow label="Membru din"  value={formatDate(profile.createdAt)} />
          </div>

          <div className="profil-divider" />

          <div className="profil-actions">
            <button className="btn-logout" onClick={logout}>
              Deconectare
            </button>
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}