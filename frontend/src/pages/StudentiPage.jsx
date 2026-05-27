import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import "./StudentiPage.css";

export default function StudentiPage() {
  const [theses, setTheses]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/theses")
      .then(setTheses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = theses.filter((t) =>
    t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "IN_PROGRESS": return "badge-asteptare";
      case "APPROVED":    return "badge-aprobat";
      case "REJECTED":    return "badge-modificari";
      default:            return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "IN_PROGRESS": return "În progres";
      case "APPROVED":    return "Aprobat";
      case "REJECTED":    return "Respins";
      default:            return status;
    }
  };

  if (loading) return <div className="studenti-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="studenti-container"><p style={{color:"red"}}>{error}</p></div>;

  return (
    <div className="studenti-container">
      <div className="studenti-header">
        <h1>Studenți Alocați</h1>
        <p>Gestionează studenții pe care îi coordonezi și verifică stadiul lucrărilor de licență.</p>
      </div>

      <div className="studenti-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Caută după nume student sau titlu licență..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <BorderGlow
        backgroundColor="#ffffff"
        borderRadius={12}
        glowColor="210 100 60"
        colors={['#1a8cff', '#60a5fa', '#93c5fd']}
        edgeSensitivity={30}
      >
        <div className="table-wrapper">
          <table className="studenti-table">
            <thead>
              <tr>
                <th>Titlu Lucrare</th>
                <th>Status</th>
                <th>Creat</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((thesis) => (
                  <tr key={thesis.id}>
                    <td className="fw-600">{thesis.title}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(thesis.globalStatus)}`}>
                        {getStatusLabel(thesis.globalStatus)}
                      </span>
                    </td>
                    <td className="text-muted">
                      {thesis.createdAt?._seconds
                        ? new Date(thesis.createdAt._seconds * 1000).toLocaleDateString("ro-RO")
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="btn-vezi-detalii"
                        onClick={() => navigate(`/revizuire/${thesis.id}`)}
                      >
                        Vezi detalii
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-state">
                    {theses.length === 0
                      ? "Nu ai niciun student alocat momentan."
                      : "Nu am găsit rezultate pentru căutarea ta."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BorderGlow>
    </div>
  );
}