import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BorderGlow from "../components/BorderGlow";
import TrueFocus from "../components/TrueFocus";
import SplitText from "../components/SplitText";
import { api } from "../api";
import "./DashboardPage.css";

// ── Student ──────────────────────────────────────────────────────────────────
function StudentDashboard({ platform }) {
  const navigate = useNavigate();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/theses")
      .then(data => setThesis(data[0] || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusLabel = (s) => ({ IN_PROGRESS: "În progres", APPROVED: "Aprobat", REJECTED: "Respins" }[s] || s);
  const getStatusClass = (s) => ({ IN_PROGRESS: "status-orange", APPROVED: "status-green", REJECTED: "status-red" }[s] || "status-orange");

  return (
    <div className="dashboard-grid">
      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card action-card">
          <h3>Status Lucrare</h3>
          {loading ? (
            <p className="status-text">Se încarcă...</p>
          ) : thesis ? (
            <>
              <p className="status-text">
                <strong>{thesis.title}</strong>
              </p>
              <span className={`status-badge ${getStatusClass(thesis.globalStatus)}`}>
                {getStatusLabel(thesis.globalStatus)}
              </span>
            </>
          ) : (
            <p className="status-text">Nu ai nicio lucrare asignată momentan.</p>
          )}
          <div className="card-actions">
            <button className="btn-primary" onClick={() => navigate("/upload")}>
              Încarcă o nouă versiune
            </button>
          </div>
        </div>
      </BorderGlow>

      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card info-card">
          <h3>Avizier Facultate</h3>
          {platform.anunt ? (
            <ul className="anunturi-list">
              <li className="anunt-item">
                <div className="anunt-header">
                  <strong>Anunț platformă</strong>
                </div>
                <p>{platform.anunt}</p>
              </li>
            </ul>
          ) : (
            <p className="status-text">Niciun anunț activ momentan.</p>
          )}
        </div>
      </BorderGlow>
    </div>
  );
}

// ── Profesor ─────────────────────────────────────────────────────────────────
function ProfDashboard({ platform }) {
  const navigate = useNavigate();
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/theses")
      .then(data => setTheses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inProgress = theses.filter(t => t.globalStatus === "IN_PROGRESS").length;

  return (
    <div className="dashboard-grid">
      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card stats-card">
          {loading ? (
            <p className="status-text">Se încarcă...</p>
          ) : (
            <>
              <div className="stat-box">
                <span className="stat-number">{theses.length}</span>
                <span className="stat-label">Studenți Alocați</span>
              </div>
              <div className="stat-box highlight-box">
                <span className="stat-number">{inProgress}</span>
                <span className="stat-label">În Progres</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{theses.filter(t => t.globalStatus === "APPROVED").length}</span>
                <span className="stat-label">Aprobate</span>
              </div>
            </>
          )}
        </div>
      </BorderGlow>

      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card action-card">
          <h3>Sarcini Curente</h3>
          {platform.anunt && (
            <p className="anunt-inline">{platform.anunt}</p>
          )}
          <p>Verifică studenții alocați și oferă feedback pentru versiunile încărcate.</p>
          <div className="card-actions">
            <button className="btn-primary" onClick={() => navigate("/studenti")}>
              Mergi la lista de studenți →
            </button>
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function AdminDashboard({ platform }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/users"),
      api.get("/api/theses"),
    ])
      .then(([u, t]) => { setUsers(u); setTheses(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = users.filter(u => u.role === "pending").length;
  const approved = theses.filter(t => t.globalStatus === "APPROVED").length;

  return (
    <div className="dashboard-grid">
      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card stats-card admin-stats">
          {loading ? (
            <p className="status-text">Se încarcă...</p>
          ) : (
            <>
              <div className="stat-box">
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Utilizatori Totali</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{theses.length}</span>
                <span className="stat-label">Licențe Înregistrate</span>
              </div>
              <div className="stat-box highlight-box">
                <span className="stat-number">{approved}</span>
                <span className="stat-label">Licențe Finalizate</span>
              </div>
            </>
          )}
        </div>
      </BorderGlow>

      <BorderGlow backgroundColor="#fffbeb" borderRadius={12} glowColor="35 100 60" colors={['#fde68a', '#fbbf24', '#f59e0b']}>
        <div className="dashboard-card action-card alert-card">
          <h3>Atenție: Conturi Noi</h3>
          {loading ? (
            <p>Se încarcă...</p>
          ) : (
            <p>
              {pending > 0
                ? <>Există <strong>{pending}</strong> utilizatori în așteptare care au nevoie de aprobare.</>
                : "Nu există conturi în așteptare momentan."}
            </p>
          )}
          <button className="btn-primary" onClick={() => navigate("/utilizatori")}>
            Aprobă Utilizatori
          </button>
        </div>
      </BorderGlow>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState({ anunt: null, termenLimita: null });

  useEffect(() => {
    api.get("/api/admin/platform")
      .then(data => setPlatform(data))
      .catch(() => {});
  }, []);

  const zileRamase = (() => {
    if (!platform.termenLimita) return 0;
    const limita = platform.termenLimita._seconds
      ? new Date(platform.termenLimita._seconds * 1000)
      : new Date(platform.termenLimita);
    return Math.max(0, Math.ceil((limita - new Date()) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <SplitText
          text={`Salut, ${user.name}!`}
          tag="h1"
          delay={60}
          duration={1}
          ease="power4.out"
          splitType="chars"
          from={{ opacity: 0, y: 30 }}
          to={{ opacity: 1, y: 0 }}
        />
      </div>

      {user.role === "student" && <StudentDashboard platform={platform} />}
      {user.role === "prof"    && <ProfDashboard    platform={platform} />}
      {user.role === "admin"   && <AdminDashboard   platform={platform} />}

      <div style={{ marginTop: "80px", marginBottom: "40px" }}>
        <TrueFocus
          sentence={`AU MAI RĂMAS|${zileRamase} ZILE`}
          separator="|"
          manualMode={false}
          blurAmount={4}
          borderColor="#1a8cff"
          glowColor="rgba(26, 140, 255, 0.4)"
          animationDuration={1.5}
          pauseBetweenAnimations={3.5}
        />
      </div>
    </div>
  );
}