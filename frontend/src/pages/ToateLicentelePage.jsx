import { useState, useEffect } from "react";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import "./ToateLicentelePage.css";

export default function ToateLicentelePage() {
  const [theses,    setTheses]    = useState([]);
  const [usersMap,  setUsersMap]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [thesesData, usersData] = await Promise.all([
          api.get("/api/theses"),
          api.get("/api/admin/users"),
        ]);
        const map = {};
        usersData.forEach(u => { map[u.id] = u; });
        setUsersMap(map);
        setTheses(thesesData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = theses.filter(t => {
    const student     = usersMap[t.studentId]?.name || "";
    const coordonator = usersMap[t.professorId]?.name || "";
    const term = searchTerm.toLowerCase();
    return (
      t.title?.toLowerCase().includes(term) ||
      student.toLowerCase().includes(term) ||
      coordonator.toLowerCase().includes(term)
    );
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "IN_PROGRESS": return "badge-progres";
      case "APPROVED":    return "badge-aprobat";
      case "REJECTED":    return "badge-respins";
      default:            return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "IN_PROGRESS": return "În progres";
      case "APPROVED":    return "Aprobat Final";
      case "REJECTED":    return "Respins";
      default:            return status;
    }
  };

  if (loading) return <div className="toate-licentele-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="toate-licentele-container"><p style={{ color: "red" }}>{error}</p></div>;

  return (
    <div className="toate-licentele-container">
      <div className="toate-licentele-header">
        <h1>Registru Global Licențe</h1>
        <p>Monitorizează stadiul tuturor lucrărilor de licență din facultate.</p>
      </div>

      <div className="toate-licentele-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Caută după student, coordonator sau titlu..."
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
          <table className="toate-licentele-table">
            <thead>
              <tr>
                <th>Titlu Lucrare</th>
                <th>Student</th>
                <th>Coordonator</th>
                <th>Status Global</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-600 licenta-titlu">{item.title}</td>
                    <td>{usersMap[item.studentId]?.name || item.studentId}</td>
                    <td className="text-muted">{usersMap[item.professorId]?.name || item.professorId}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.globalStatus)}`}>
                        {getStatusLabel(item.globalStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-state">
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