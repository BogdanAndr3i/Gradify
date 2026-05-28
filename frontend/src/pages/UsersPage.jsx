import { useState, useEffect } from "react";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import "./UsersPage.css";

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);  

  useEffect(() => {
    api.get("/api/admin/users")
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (userId, role) => {
    setApproving(userId);
    try {
      await api.put(`/api/admin/users/${userId}/approve`, { role });
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role } : u)
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId) => {
  if (!window.confirm("Sigur vrei să respingi și să ștergi acest cont?")) return;
  setRejecting(userId);
  try {
    await api.delete(`/api/admin/users/${userId}/reject`);
    setUsers(prev => prev.filter(u => u.id !== userId));
  } catch (e) {
    alert(e.message);
  } finally {
    setRejecting(null);
  }
};

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":   return <span className="badge badge-admin">Admin</span>;
      case "prof":    return <span className="badge badge-prof">Profesor</span>;
      case "student": return <span className="badge badge-student">Student</span>;
      case "pending": return <span className="badge badge-pending">Nespecificat</span>;
      default:        return null;
    }
  };

  function formatDate(ts) {
    if (!ts) return "—";
    const ms = ts._seconds ? ts._seconds * 1000 : Date.parse(ts);
    return new Date(ms).toLocaleDateString("ro-RO");
  }

  if (loading) return <div className="users-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="users-container"><p style={{ color: "red" }}>{error}</p></div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Management Utilizatori</h1>
        <p>Aprobă conturile noi și gestionează accesul studenților și profesorilor în platformă.</p>
      </div>

      <div className="users-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Caută utilizator după nume sau email..."
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
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilizator</th>
                <th>Contact (Email)</th>
                <th>Rol Sistem</th>
                <th>Data Înregistrării</th>
                <th>Acțiuni Admin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((user) => (
                  <tr key={user.id} className={user.role === "pending" ? "row-pending" : ""}>
                    <td className="fw-600">{user.name}</td>
                    <td className="text-muted">{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td className="text-muted">{formatDate(user.createdAt)}</td>
                    <td>
                      {user.role === "pending" ? (
                        <div className="action-buttons">
                          <button
                            className="btn-approve-role btn-student"
                            onClick={() => handleApprove(user.id, "student")}
                            disabled={approving === user.id || rejecting === user.id}
                            title="Aprobă ca Student"
                          >
                            Student
                          </button>
                          <button
                            className="btn-approve-role btn-prof"
                            onClick={() => handleApprove(user.id, "prof")}
                            disabled={approving === user.id || rejecting === user.id}
                            title="Aprobă ca Profesor"
                          >
                            Prof
                          </button>
                          <button
                            className="btn-approve-role btn-reject"
                            onClick={() => handleReject(user.id)}
                            disabled={approving === user.id || rejecting === user.id}
                            title="Respinge și șterge contul"
                          >
                            Respinge
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">Niciun utilizator găsit.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BorderGlow>
    </div>
  );
}