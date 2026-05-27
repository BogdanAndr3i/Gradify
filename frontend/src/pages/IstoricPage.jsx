import { useState } from "react";
import { istoricStudent } from "../data/mockData";
import BorderGlow from "../components/BorderGlow";
import "./IstoricPage.css";

export const FolderIcon = ({
  size = 20,
  className = "",
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const ChevronUpIcon = ({
  size = 20,
  className = "",
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const ChevronDownIcon = ({
  size = 20,
  className = "",
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const CheckIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const XIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const getStatusClass = (status) => {
  switch (status) {
    case "Aprobat":
      return "status-aprobat";
    case "Revizuire":
      return "status-revizuire";
    case "În așteptare":
      return "status-asteptare";
    default:
      return "";
  }
};

export default function IstoricPage() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="istoric-container">
      <div className="istoric-header">
        <h1>Status și Istoric Încărcări</h1>
        <p>
          Aici poți urmări evoluția lucrării tale și feedback-ul primit de la
          profesorul coordonator.
        </p>
      </div>

      <div className="istoric-list">
        {istoricStudent.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <BorderGlow
              key={item.id}
              backgroundColor="#ffffff"
              borderRadius={10}
              glowIntensity={isExpanded ? 1.2 : 0.8}
              glowColor={isExpanded ? "210 100 60" : "210 40 80"}
              colors={
                isExpanded
                  ? ["#002d56", "#1a8cff", "#60a5fa"]
                  : ["#cbd5e1", "#e2e8f0", "#f8fafc"] 
              }
            >
              <div className={`istoric-card ${isExpanded ? "expanded" : ""}`}>
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
                    <button className="btn-expand" aria-label="Extinde detalii">
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="istoric-card__body">
                    <div className="feedback-section">
                      <h4>Feedback Profesor:</h4>
                      {item.feedback ? (
                        <p className="feedback-text">{item.feedback}</p>
                      ) : (
                        <p className="feedback-empty">
                          Profesorul nu a lăsat încă un comentariu pentru
                          această versiune.
                        </p>
                      )}
                    </div>

                    <div className="file-section">
                      <h4>Fișier atașat:</h4>
                      <div className="file-download-box">
                        <span className="file-icon">
                          <FolderIcon size={20} color="#1a8cff" />
                        </span>
                        <span className="file-name">{item.fisier}</span>
                        <button className="btn-download">Descarcă</button>
                      </div>
                    </div>
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
