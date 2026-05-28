import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import "./RevizuirePage.css";
import { auth } from "../firebase";

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
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

// Parsează unified diff → { oldValue, newValue }
function parseDiff(diffText) {
  const oldLines = [];
  const newLines = [];
  for (const line of diffText.split("\n")) {
    if (line.startsWith("---") || line.startsWith("+++") || line.startsWith("@@")) continue;
    if (line.startsWith("-"))      { oldLines.push(line.slice(1)); }
    else if (line.startsWith("+")) { newLines.push(line.slice(1)); }
    else                           { const c = line.startsWith(" ") ? line.slice(1) : line; oldLines.push(c); newLines.push(c); }
  }
  return { oldValue: oldLines.join("\n"), newValue: newLines.join("\n") };
}

function VersionCard({ version, thesisId, sectionId, onStatusUpdate }) {
  const [feedback,    setFeedback]    = useState(version.feedbackGeneral || "");
  const [saving,      setSaving]      = useState(false);
  const [expanded,    setExpanded]    = useState(version.status === "PENDING");
  const [diffOpen,    setDiffOpen]    = useState(false);
  const [diffParsed,  setDiffParsed]  = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const isPending = version.status === "PENDING";

  const toggleDiff = async () => {
    if (diffOpen) { setDiffOpen(false); return; }
    if (diffParsed) { setDiffOpen(true); return; }
    setDiffLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(
        `https://gradify-497616.ew.r.appspot.com/api/theses/${thesisId}/sections/${sectionId}/versions/${version.id}/diff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Diff indisponibil");
      const text = await res.text();
      setDiffParsed(parseDiff(text));
      setDiffOpen(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setDiffLoading(false);
    }
  };



const setStatus = async (status) => {
    setSaving(true);
    try {
      if (feedback.trim()) {
        await api.post(
          `/api/theses/${thesisId}/sections/${sectionId}/versions/${version.id}/feedback`,
          { feedbackGeneral: feedback }
        );
      }
      await api.put(
        `/api/theses/${thesisId}/sections/${sectionId}/versions/${version.id}/status`,
        { status }
      );
      onStatusUpdate(sectionId, version.id, status);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`version-card ${isPending ? "highlight-pending" : ""}`}>
      <div className="version-card__header" onClick={() => setExpanded(v => !v)}>
        <div className="version-card__info">
          <span className="version-card__number">Versiunea {version.versionNumber}</span>
          <span className="version-card__date">Depus: {formatDate(version.submittedAt)}</span>
        </div>
        <div className="version-card__actions">
          <span className={`status-badge ${STATUS_CLASS[version.status] || ""}`}>
            {STATUS_LABEL[version.status] || version.status}
          </span>
          <button className="btn-expand">
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      </div>

     {expanded && (
  <div className="version-card__body">
    <div className="file-section">
      <h4>Fișier:</h4>
      
      <a /* <-- Adaugă <a aici */
        className="file-download-box"
        href={`https://gradify-497616.ew.r.appspot.com/api/theses/${thesisId}/sections/${sectionId}/versions/${version.id}/download`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (e) => {
          e.preventDefault();
          const token = await auth.currentUser?.getIdToken();
          const url = `https://gradify-497616.ew.r.appspot.com/api/theses/${thesisId}/sections/${sectionId}/versions/${version.id}/download`;
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          window.open(objUrl, "_blank");
        }}
      >
        <FolderIcon size={20} color="#1a8cff" />
        <span className="file-name">
          {version.mimeType} — {(version.sizeBytes / 1024).toFixed(1)} KB
        </span>
        <span className="file-download-hint">Deschide →</span>
      </a>
    </div>

          {version.hasDiff && (
            <div className="diff-section">
              <button
                className="btn-diff"
                onClick={toggleDiff}
                disabled={diffLoading}
              >
                {diffLoading ? "Se încarcă..." : diffOpen ? "▲ Ascunde Diff" : "⟳ Vezi modificări față de versiunea anterioară"}
              </button>

              {diffOpen && diffParsed && (
                <div className="diff-viewer-wrapper">
                  <ReactDiffViewer
                    oldValue={diffParsed.oldValue}
                    newValue={diffParsed.newValue}
                    splitView={true}
                    compareMethod={DiffMethod.WORDS}
                    leftTitle="Versiunea anterioară"
                    rightTitle="Versiunea curentă"
                    useDarkTheme={false}
                    styles={{
                      variables: {
                        light: {
                          diffViewerBackground: "#f8fafc",
                          addedBackground: "#d1fae5",
                          removedBackground: "#fee2e2",
                          wordAddedBackground: "#6ee7b7",
                          wordRemovedBackground: "#fca5a5",
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {isPending ? (
            <div className="action-section">
              <h4>Feedback:</h4>
              <textarea
                className="feedback-input"
                rows="4"
                placeholder="Scrie observațiile tale pentru student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={saving}
              />
              <div className="decision-buttons">
                <button className="btn-reject" onClick={() => setStatus("NEEDS_CHANGES")} disabled={saving}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <XIcon /> Cere Modificări
                  </div>
                </button>
                <button className="btn-approve" onClick={() => setStatus("APPROVED")} disabled={saving}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckIcon /> Aprobă
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="feedback-section">
              <h4>Feedback trimis:</h4>
              {version.feedbackGeneral
                ? <p className="feedback-text">{version.feedbackGeneral}</p>
                : <p className="feedback-empty">Fără observații suplimentare.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RevizuirePage() {
  const { thesisId } = useParams();
  const navigate     = useNavigate();

  const [thesis,   setThesis]   = useState(null);
  const [sections, setSections] = useState([]);
  const [versions, setVersions] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [th, secs] = await Promise.all([
          api.get(`/api/theses/${thesisId}`),
          api.get(`/api/theses/${thesisId}/sections`),
        ]);
        setThesis(th);
        setSections(secs);
        const vMap = {};
        await Promise.all(
          secs.map(async (s) => {
            const v = await api.get(`/api/theses/${thesisId}/sections/${s.id}/versions`);
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
  }, [thesisId]);

  const toggleSection = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

const handleStatusUpdate = (sectionId, versionId, newStatus, newFeedback) => {
    setVersions(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map(v =>
        v.id === versionId ? { ...v, status: newStatus, feedbackGeneral: newFeedback || v.feedbackGeneral } : v
      ),
    }));
  };

  if (loading) return <div className="revizuire-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="revizuire-container"><p style={{ color: "red" }}>{error}</p></div>;

  return (
    <div className="revizuire-container">
      <button className="btn-back" onClick={() => navigate("/studenti")}>
        ← Înapoi la lista de studenți
      </button>

      <div className="revizuire-header">
        <h1>Revizuire Lucrare</h1>
        <p className="licenta-title">Titlu: {thesis?.title}</p>
      </div>

      <div className="istoric-list">
        {sections.length === 0 && (
          <p style={{ color: "#64748b" }}>Studentul nu a adăugat încă nicio secțiune.</p>
        )}
        {sections.map((section) => {
          const isExpanded = expanded[section.id] ?? true;
          const sectionVersions = versions[section.id] || [];
          const hasPending = sectionVersions.some(v => v.status === "PENDING");

          return (
            <BorderGlow
              key={section.id}
              backgroundColor="#ffffff"
              borderRadius={10}
              glowIntensity={hasPending ? 1.2 : 0.7}
              glowColor={hasPending ? "210 100 60" : "210 40 80"}
              colors={hasPending
                ? ['#1a8cff', '#002d56', '#60a5fa']
                : ['#cbd5e1', '#e2e8f0', '#f8fafc']}
            >
              <div className={`istoric-card ${isExpanded ? "expanded" : ""}`}>
                <div className="istoric-card__header" onClick={() => toggleSection(section.id)}>
                  <div className="istoric-card__info">
                    <h3 className="istoric-card__title">{section.title}</h3>
                    <span className="istoric-card__date">
                      {sectionVersions.length} versiune{sectionVersions.length !== 1 ? "i" : ""}
                      {hasPending && <span style={{ color: "#1a8cff", marginLeft: "8px" }}>● Necesită revizuire</span>}
                    </span>
                  </div>
                  <button className="btn-expand">
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="istoric-card__body">
                    {sectionVersions.length === 0
                      ? <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Nicio versiune depusă.</p>
                      : sectionVersions.map(v => (
                          <VersionCard
                            key={v.id}
                            version={v}
                            thesisId={thesisId}
                            sectionId={section.id}
                            onStatusUpdate={handleStatusUpdate}
                          />
                        ))
                    }
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