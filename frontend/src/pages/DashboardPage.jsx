import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BorderGlow from "../components/BorderGlow"; // <-- Importul componentei
import TrueFocus from "../components/TrueFocus"; // <-- Importul componentei
import SplitText from "../components/SplitText";
import { 
  anunturiPlatforma, 
  istoricStudent, 
  listaStudentiProfesor, 
  listaUtilizatori, 
  listaToateLicentele,
  termenLimitaGlobal
} from "../data/mockData";
import "./DashboardPage.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const ultimaIncarcare = istoricStudent[0]; 

  return (
    <div className="dashboard-grid">
      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card action-card">
          <h3>Status Lucrare</h3>
          <p className="status-text">
            Versiunea curentă: <strong>{ultimaIncarcare?.versiune || "Nicio încărcare"}</strong>
          </p>
          <span className={`status-badge status-${ultimaIncarcare?.status === 'Aprobat' ? 'green' : 'orange'}`}>
            Stadiu: {ultimaIncarcare?.status || "Inactiv"}
          </span>
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
          <ul className="anunturi-list">
            {anunturiPlatforma.map(anunt => (
              <li key={anunt.id} className={`anunt-item anunt-${anunt.tip}`}>
                <div className="anunt-header">
                  <strong>{anunt.titlu}</strong>
                  <span className="anunt-data">{anunt.data}</span>
                </div>
                <p>{anunt.mesaj}</p>
              </li>
            ))}
          </ul>
        </div>
      </BorderGlow>
    </div>
  );
}

function ProfDashboard() {
  const navigate = useNavigate();
  const studentiInAsteptare = listaStudentiProfesor.filter(s => s.status === "Așteaptă revizuire").length;

  return (
    <div className="dashboard-grid">
      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card stats-card">
          <div className="stat-box">
            <span className="stat-number">{listaStudentiProfesor.length}</span>
            <span className="stat-label">Studenți Alocați</span>
          </div>
          <div className="stat-box highlight-box">
            <span className="stat-number">{studentiInAsteptare}</span>
            <span className="stat-label">Așteaptă Revizuire</span>
          </div>
        </div>
      </BorderGlow>

      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card action-card">
          <h3>Sarcini Curente</h3>
          <p>Ai studenți care au încărcat materiale noi și așteaptă feedback-ul tău.</p>
          <button className="btn-primary" onClick={() => navigate("/studenti")}>
            Mergi la lista de studenți →
          </button>
        </div>
      </BorderGlow>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const conturiPending = listaUtilizatori.filter(u => u.statusCont === "În așteptare").length;
  const licenteAprobate = listaToateLicentele.filter(l => l.status === "Aprobat Final").length;

  return (
    <div className="dashboard-grid">
      <BorderGlow backgroundColor="#ffffff" borderRadius={12} glowColor="210 100 60" colors={['#1a8cff', '#60a5fa', '#93c5fd']}>
        <div className="dashboard-card stats-card admin-stats">
          <div className="stat-box">
            <span className="stat-number">{listaUtilizatori.length}</span>
            <span className="stat-label">Utilizatori Totali</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{listaToateLicentele.length}</span>
            <span className="stat-label">Licențe Înregistrate</span>
          </div>
          <div className="stat-box highlight-box">
            <span className="stat-number">{licenteAprobate}</span>
            <span className="stat-label">Licențe Finalizate</span>
          </div>
        </div>
      </BorderGlow>

      <BorderGlow backgroundColor="#fffbeb" borderRadius={12} glowColor="35 100 60" colors={['#fde68a', '#fbbf24', '#f59e0b']}>
        <div className="dashboard-card action-card alert-card">
          <h3>Atenție: Conturi Noi</h3>
          <p>Există <strong>{conturiPending}</strong> utilizatori în așteptare care au nevoie de aprobare pentru a accesa platforma.</p>
          <button className="btn-primary" onClick={() => navigate("/utilizatori")}>
            Aprobă Utilizatori
          </button>
        </div>
      </BorderGlow>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  let zileRamase = 0;
  if (termenLimitaGlobal) {
    const astazi = new Date();
    const limita = new Date(termenLimitaGlobal);
    const diferentaTimp = limita - astazi;
    
    zileRamase = Math.max(0, Math.ceil(diferentaTimp / (1000 * 60 * 60 * 24)));
  }

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

      {user.role === "student" && <StudentDashboard />}
      {user.role === "prof" && <ProfDashboard />}
      {user.role === "admin" && <AdminDashboard />}
      
      {user.role === "guest" && (
        <div className="dashboard-card">Te rugăm să te autentifici.</div>
      )}

      <div style={{ marginTop: '80px', marginBottom: '40px' }}>
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