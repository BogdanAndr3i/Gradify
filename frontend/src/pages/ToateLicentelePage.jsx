import { useState } from "react";
import { listaToateLicentele } from "../data/mockData";
import BorderGlow from "../components/BorderGlow"; // <-- 1. Importăm componenta
import "./ToateLicentelePage.css";

export default function ToateLicentelePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLicente = listaToateLicentele.filter((item) =>
    item.titlu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.coordonator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "În progres": return "badge-progres";
      case "Aprobat Final": return "badge-aprobat";
      case "Respins": return "badge-respins";
      default: return "";
    }
  };

  return (
    <div className="toate-licentele-container">
      <div className="toate-licentele-header">
        <h1>Registru Global Licențe</h1>
        <p>Monitorizează stadiul tuturor lucrărilor de licență din facultate pentru anul curent.</p>
      </div>

      <div className="toate-licentele-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Caută după student, coordonator sau titlu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn-export">📥 Exportă Raport (CSV)</button>
      </div>

      <BorderGlow
        backgroundColor="#ffffff"
        borderRadius={12}
        glowColor="210 100 60"
        colors={['#1a8cff', '#60a5fa', '#93c5fd']} 
        edgeSensitivity={30}
      >
        <div className="table-wrapper">
          <table className="toate-licentele-table">
            <thead>
              <tr>
                <th>Titlu Lucrare</th>
                <th>Student</th>
                <th>Coordonator</th>
                <th>An</th>
                <th>Status Global</th>
              </tr>
            </thead>
            <tbody>
              {filteredLicente.length > 0 ? (
                filteredLicente.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-600 licenta-titlu">{item.titlu}</td>
                    <td>{item.student}</td>
                    <td className="text-muted">{item.coordonator}</td>
                    <td className="text-center">{item.an}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Nu a fost găsită nicio lucrare conform criteriilor de căutare.
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