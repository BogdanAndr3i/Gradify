import { useState, useEffect } from "react";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import "./IstoricPage.css";

const FolderIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronUpIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const ChevronDownIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const STATUS_LABEL = {
  PENDING:       "În așteptare",
  APPROVED:      "Aprobat",
  REJECTED:      "Respins",
  NEEDS_CHANGES: "Necesită modificări",
};
const STATUS_CLASS = {
  PENDING:       "status-asteptare",
  APPROVED:      "status-aprobat",
  REJECTED:      "status-revizuire",
  NEEDS_CHANGES: "status-revizuire",
};

function formatDate(ts) {
  if (!ts) return "—";
  const ms = ts._seconds ? ts._seconds * 1000 : Date.parse(ts);
  return new Date(ms).toLocaleDateString("ro-RO");
}

export default function IstoricPage() {
  const [thesis,   setThesis]   = useState(null);
  const [sections, setSections] = useState([]);
  const [versions, setVersions] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const theses = await api.get("/api/theses");
        if (!theses.length) { setLoading(false); return; }

        const th = theses[0];
        setThesis(th);

        const secs = await api.get(`/api/theses/${th.id}/sections`);
        setSections(secs);

        const vMap = {};
        await Promise.all(
          secs.map(async (s) => {
            const v = await api.get(`/api/theses/${th.id}/sections/${s.id}/versions`);
            vMap[s.id] = v;
          })
        );
        setVersions(vMap);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggle = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className="istoric-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="istoric-container"><p style={{ color: "red" }}>{error}</p></div>;
  if (!thesis) return (
    <div className="istoric-container">
      <div className="istoric-header">
        <h1>Status și Istoric Încărcări</h1>
        <p>Nu ai nicio lucrare asignată momentan.</p>
      </div>
    </div>
  );

  return (
    <div className="istoric-container">
      <div className="istoric-header">
        <h1>Status și Istoric Încărcări</h1>
        <p>Urmărește evoluția lucrării tale și feedback-ul primit de la profesorul coordonator.</p>
        <p style={{ fontWeight: 600, color: "#0f172a", marginTop: "4px" }}>{thesis.title}</p>
      </div>

      <div className="istoric-list">
        {sections.length === 0 && (
          <p style={{ color: "#64748b" }}>Nu ai adăugat încă nicio secțiune.</p>
        )}
        {sections.map((section) => {
          const isExpanded = expanded[section.id] ?? true;
          const sectionVersions = versions[section.id] || [];

          return (
            <BorderGlow
              key={section.id}
              backgroundColor="#ffffff"
              borderRadius={10}
              glowIntensity={isExpanded ? 1.2 : 0.8}
              glowColor={isExpanded ? "210 100 60" : "210 40 80"}
              colors={isExpanded
                ? ["#002d56", "#1a8cff", "#60a5fa"]
                : ["#cbd5e1", "#e2e8f0", "#f8fafc"]}
            >
              <div className={`istoric-card ${isExpanded ? "expanded" : ""}`}>
                <div className="istoric-card__header" onClick={() => toggle(section.id)}>
                  <div className="istoric-card__info">
                    <h3 className="istoric-card__title">{section.title}</h3>
                    <span className="istoric-card__date">
                      {sectionVersions.length} versiune{sectionVersions.length !== 1 ? "i" : ""}
                    </span>
                  </div>
                  <button className="btn-expand">
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="istoric-card__body">
                    {sectionVersions.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                        Nicio versiune depusă pentru această secțiune.
                      </p>
                    ) : (
                      sectionVersions.map((v) => (
                        <div key={v.id} className="version-entry">
                          <div className="version-entry__header">
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <FolderIcon size={18} color="#1a8cff" />
                              <span className="version-entry__label">
                                Versiunea {v.versionNumber}
                              </span>
                              <span className="version-entry__date">
                                {formatDate(v.submittedAt)}
                              </span>
                            </div>
                            <span className={`status-badge ${STATUS_CLASS[v.status] || ""}`}>
                              {STATUS_LABEL[v.status] || v.status}
                            </span>
                          </div>

                          {v.feedbackGeneral && (
                            <div className="feedback-section" style={{ marginTop: "8px" }}>
                              <h4>Feedback profesor:</h4>
                              <p className="feedback-text">{v.feedbackGeneral}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </BorderGlow>
          );
        })}
      </div>
    </div>
  );
}