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
  return <div className="profil-avatar">{initials}</div>;
}

function formatDate(ts) {
  if (!ts) return null;
  const ms = ts._seconds ? ts._seconds * 1000 : Date.parse(ts);
  return new Date(ms).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ProfilPage() {
  const { logout } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // edit state
  const [editing,    setEditing]    = useState(false);
  const [facultate,  setFacultate]  = useState("");
  const [departament,setDepartament]= useState("");
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(null);

  useEffect(() => {
    api.get("/api/auth/me")
      .then(data => {
        setProfile(data);
        setFacultate(data.facultate || "");
        setDepartament(data.departament || "");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function startEdit() {
    setFacultate(profile.facultate || "");
    setDepartament(profile.departament || "");
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await api.put("/api/auth/me", { facultate, departament });
      setProfile(prev => ({ ...prev, facultate, departament }));
      setEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

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
              <span
                className="profil-role-badge"
                style={{ background: roleColor + "18", color: roleColor, borderColor: roleColor + "40" }}
              >
                {ROLE_LABEL[profile.role] || profile.role}
              </span>
            </div>
          </div>

          <div className="profil-divider" />

          <div className="profil-info-list">
            {/* Câmpuri fixe */}
            <div className="profil-info-row">
              <span className="profil-info-label">Email</span>
              <span className="profil-info-value">{profile.email}</span>
            </div>
            <div className="profil-info-row">
              <span className="profil-info-label">Membru din</span>
              <span className="profil-info-value">{formatDate(profile.createdAt)}</span>
            </div>

            {/* Câmpuri editabile */}
            {editing ? (
              <>
                <div className="profil-info-row profil-edit-row">
                  <label className="profil-info-label" htmlFor="facultate">Facultate</label>
                  <input
                    id="facultate"
                    className="profil-input"
                    value={facultate}
                    onChange={e => setFacultate(e.target.value)}
                    placeholder="ex: Facultatea de Informatică"
                  />
                </div>
                <div className="profil-info-row profil-edit-row">
                  <label className="profil-info-label" htmlFor="departament">Departament</label>
                  <input
                    id="departament"
                    className="profil-input"
                    value={departament}
                    onChange={e => setDepartament(e.target.value)}
                    placeholder="ex: Informatică"
                  />
                </div>
                {saveError && <p className="profil-save-error">{saveError}</p>}
              </>
            ) : (
              <>
                <div className="profil-info-row">
                  <span className="profil-info-label">Facultate</span>
                  <span className="profil-info-value">
                    {profile.facultate || <em className="profil-empty">Necompletat</em>}
                  </span>
                </div>
                <div className="profil-info-row">
                  <span className="profil-info-label">Departament</span>
                  <span className="profil-info-value">
                    {profile.departament || <em className="profil-empty">Necompletat</em>}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="profil-divider" />

          <div className="profil-actions">
            {editing ? (
              <>
                <button className="btn-cancel-edit" onClick={cancelEdit} disabled={saving}>
                  Anulează
                </button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? "Se salvează..." : "Salvează"}
                </button>
              </>
            ) : (
              <>
                <button className="btn-edit" onClick={startEdit}>
                  Editează profil
                </button>
                <button className="btn-logout" onClick={logout}>
                  Deconectare
                </button>
              </>
            )}
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}