import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { istoricStudent } from "../data/mockData";
import BorderGlow from "../components/BorderGlow"; // <-- 1. Importul absolut necesar!
import "./RevizuirePage.css";

export const FolderIcon = ({ size = 20, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const ChevronUpIcon = ({ size = 20, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const ChevronDownIcon = ({ size = 20, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const CheckIcon = ({ size = 16, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const XIcon = ({ size = 16, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const getStatusClass = (status) => {
  switch (status) {
    case "Aprobat": return "status-aprobat";
    case "Revizuire": return "status-revizuire";
    case "În așteptare": return "status-asteptare";
    default: return "";
  }
};

export default function RevizuirePage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState("3");
  const [feedbackInput, setFeedbackInput] = useState("");

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAction = (actiune) => {
    if (actiune === "aprobare") {
      alert("Capitolul a fost APROBAT. Studentul va fi notificat.");
    } else {
      alert("Capitolul necesită MODIFICĂRI. Feedback-ul a fost trimis studentului.");
    }
    setFeedbackInput(""); 
  };

  return (
    <div className="revizuire-container">
      
      <button className="btn-back" onClick={() => navigate("/studenti")}>
        ← Înapoi la lista de studenți
      </button>

      <div className="revizuire-header">
        <h1>Revizuire Lucrare</h1>
        <div className="student-info-bar">
          <span className="info-item"><strong>Student:</strong> Andrei Ionescu</span>
          <span className="info-item"><strong>An/Specializare:</strong> Anul 3, Informatică</span>
        </div>
        <p className="licenta-title">Titlu: Sistem de automatizare Smart Home cu senzori de mediu</p>
      </div>

      <div className="istoric-list">
        {istoricStudent.map((item) => {
          const isExpanded = expandedId === item.id;
          const isPending = item.status === "În așteptare";

          const glowIntensity = isPending ? (isExpanded ? 1.3 : 1.0) : (isExpanded ? 1.0 : 0.6);
          const glowColor = isPending ? "210 100 60" : "210 40 80";
          const gradientColors = isPending
            ? ['#1a8cff', '#002d56', '#60a5fa'] 
            : (isExpanded
                ? ['#93c5fd', '#bfdbfe', '#e0e7ff']
                : ['#cbd5e1', '#e2e8f0', '#f8fafc']); 

          return (
            /* 2. Învăluim cardul în BorderGlow */
            <BorderGlow
              key={item.id}
              backgroundColor="#ffffff"
              borderRadius={10}
              glowIntensity={glowIntensity}
              glowColor={glowColor}
              colors={gradientColors}
            >
              <div
                className={`istoric-card ${isExpanded ? "expanded" : ""} ${isPending ? "highlight-pending" : ""}`}
              >
                <div
                  className="istoric-card__header"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="istoric-card__info">
                    <h3 className="istoric-card__title">{item.versiune}</h3>
                    <span className="istoric-card__date">
                      Încărcat pe: {item.data}
                    </span>
                  </div>

                  <div className="istoric-card__actions">
                    <span
                      className={`status-badge ${getStatusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                    <button className="btn-expand" aria-label="Extinde">
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="istoric-card__body">
                    <div className="file-section">
                      <h4>Materiale de revizuit:</h4>
                      <div className="file-download-box">
                        <span className="file-icon">
                          <FolderIcon size={20} color="#1a8cff" />
                        </span>
                        <span className="file-name">{item.fisier}</span>
                        <button className="btn-download">
                          Descarcă pentru verificare
                        </button>
                      </div>
                    </div>

                    {isPending ? (
                      <div className="action-section">
                        <h4>Adaugă Feedback:</h4>
                        <textarea
                          className="feedback-input"
                          rows="4"
                          placeholder="Scrie aici observațiile tale pentru student..."
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                        ></textarea>

                        <div className="decision-buttons">
                          <button
                            className="btn-reject"
                            onClick={() => handleAction("respingere")}
                            disabled={!feedbackInput.trim()}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <XIcon /> Cere Modificări
                            </div>
                          </button>
                          <button
                            className="btn-approve"
                            onClick={() => handleAction("aprobare")}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <CheckIcon /> Aprobă Capitolul
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="feedback-section">
                        <h4>Feedback trimis anterior:</h4>
                        {item.feedback ? (
                          <p className="feedback-text">{item.feedback}</p>
                        ) : (
                          <p className="feedback-empty">
                            Fără observații suplimentare.
                          </p>
                        )}
                      </div>
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