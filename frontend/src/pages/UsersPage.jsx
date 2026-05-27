import { useState } from "react";
import { listaUtilizatori } from "../data/mockData";
import BorderGlow from "../components/BorderGlow"; // <-- 1. Importăm componenta
import "./UsersPage.css";

export default function UsersPage() {
  const [users, setUsers] = useState(listaUtilizatori);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) =>
    user.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (id, newRole) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, rol: newRole, statusCont: "Activ" } : user
      )
    );
    alert(`Contul a fost aprobat cu succes ca ${newRole.toUpperCase()}.`);
  };

  const getRoleBadge = (rol) => {
    switch (rol) {
      case "admin": return <span className="badge badge-admin">Admin</span>;
      case "prof": return <span className="badge badge-prof">Profesor</span>;
      case "student": return <span className="badge badge-student">Student</span>;
      case "pending": return <span className="badge badge-pending">Nespecificat</span>;
      default: return null;
    }
  };

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
                <th>Status</th>
                <th>Data Înregistrării</th>
                <th>Acțiuni Admin</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={user.statusCont === "În așteptare" ? "row-pending" : ""}>
                    <td className="fw-600">{user.nume}</td>
                    <td className="text-muted">{user.email}</td>
                    <td>{getRoleBadge(user.rol)}</td>
                    <td>
                      <span className={`status-dot ${user.statusCont === "Activ" ? "dot-active" : "dot-pending"}`}></span>
                      {user.statusCont}
                    </td>
                    <td className="text-muted">{user.dataInregistrare}</td>
                    <td>
                      {user.statusCont === "În așteptare" ? (
                        <div className="action-buttons">
                          <button 
                            className="btn-approve-role btn-student"
                            onClick={() => handleApprove(user.id, "student")}
                            title="Aprobă ca Student"
                          >
                            Student
                          </button>
                          <button 
                            className="btn-approve-role btn-prof"
                            onClick={() => handleApprove(user.id, "prof")}
                            title="Aprobă ca Profesor"
                          >
                            Prof
                          </button>
                        </div>
                      ) : (
                        <button className="btn-manage">Gestionează</button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Niciun utilizator găsit.
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