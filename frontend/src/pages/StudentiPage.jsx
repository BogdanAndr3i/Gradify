import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { listaStudentiProfesor } from "../data/mockData";
import BorderGlow from "../components/BorderGlow"; // <-- 1. Importăm componenta
import "./StudentiPage.css";

export default function StudentiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredStudents = listaStudentiProfesor.filter(student =>
    student.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.titluLicenta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "Aprobat": return "badge-aprobat";
      case "Așteaptă revizuire": return "badge-asteptare";
      case "Necesită modificări": return "badge-modificari";
      case "Lipsă activitate": return "badge-lipsa";
      default: return "";
    }
  };

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
                <th>Nume Student</th>
                <th>Titlu Licență</th>
                <th>Status Curent</th>
                <th>Ultima Modificare</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="fw-600">{student.nume}</td>
                    <td className="text-muted">{student.titluLicenta}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="text-muted">{student.ultimaModificare}</td>
                    <td>
                      <button
                        className="btn-vezi-detalii"
                        onClick={() => navigate(`/revizuire`)}
                      >
                        Vezi detalii
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Nu am găsit niciun student care să corespundă căutării.
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