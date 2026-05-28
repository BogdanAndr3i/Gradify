import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import "./StudentiPage.css";

export default function StudentiPage() {
  const [theses,      setTheses]      = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [searchTerm,  setSearchTerm]  = useState("");
  const navigate = useNavigate();

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalOpen,        setModalOpen]        = useState(false);
  const [unassigned,       setUnassigned]        = useState([]);
  const [modalLoading,     setModalLoading]      = useState(false);
  const [modalSearch,      setModalSearch]       = useState("");
  const [selectedStudent,  setSelectedStudent]   = useState(null);
  const [thesisTitle,      setThesisTitle]       = useState("");
  const [submitting,       setSubmitting]        = useState(false);
  const [modalError,       setModalError]        = useState(null);

  // ── Load theses + students map ───────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [thesesData, studentsData] = await Promise.all([
          api.get("/api/theses"),
          api.get("/api/admin/students"),
        ]);
        const map = {};
        studentsData.forEach(s => { map[s.id] = s; });
        setStudentsMap(map);
        setTheses(thesesData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Open modal: fetch unassigned students ────────────────────────────────
  async function openModal() {
    setModalOpen(true);
    setModalSearch("");
    setSelectedStudent(null);
    setThesisTitle("");
    setModalError(null);
    setModalLoading(true);
    try {
      const data = await api.get("/api/admin/students?unassigned=true");
      setUnassigned(data);
    } catch (e) {
      setModalError("Nu s-au putut încărca studenții.");
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedStudent(null);
    setThesisTitle("");
    setModalError(null);
  }

  // ── Submit: POST /api/theses ─────────────────────────────────────────────
  async function handleCreate() {
    if (!selectedStudent) return setModalError("Selectează un student.");
    if (!thesisTitle.trim()) return setModalError("Titlul este obligatoriu.");
    setSubmitting(true);
    setModalError(null);
    try {
      await api.post("/api/theses", {
        studentId: selectedStudent.id,
        title: thesisTitle.trim(),
      });
      // Refresh theses + students map
      const [thesesData, studentsData] = await Promise.all([
        api.get("/api/theses"),
        api.get("/api/admin/students"),
      ]);
      const map = {};
      studentsData.forEach(s => { map[s.id] = s; });
      setStudentsMap(map);
      setTheses(thesesData);
      closeModal();
    } catch (e) {
      setModalError(e.message || "Eroare la crearea lucrării.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const filteredTheses = theses.filter((t) => {
    const studentName = studentsMap[t.studentId]?.name || "";
    const term = searchTerm.toLowerCase();
    return (
      studentName.toLowerCase().includes(term) ||
      t.title?.toLowerCase().includes(term)
    );
  });

  const filteredUnassigned = unassigned.filter(s =>
    s.name?.toLowerCase().includes(modalSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(modalSearch.toLowerCase())
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
  if (error)   return <div className="studenti-container"><p style={{ color: "red" }}>{error}</p></div>;

  return (
    <div className="studenti-container">
      <div className="studenti-header">
        <div className="studenti-header-row">
          <div>
            <h1>Studenți Alocați</h1>
            <p>Gestionează studenții pe care îi coordonezi și verifică stadiul lucrărilor de licență.</p>
          </div>
          <button className="btn-asigneaza" onClick={openModal}>
            + Asignează student
          </button>
        </div>
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
                <th>Student</th>
                <th>Titlu Lucrare</th>
                <th>Status</th>
                <th>Creat</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filteredTheses.length > 0 ? (
                filteredTheses.map((thesis) => (
                  <tr key={thesis.id}>
                    <td className="fw-600">{studentsMap[thesis.studentId]?.name || "—"}</td>
                    <td>{thesis.title}</td>
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
                  <td colSpan="5" className="empty-state">
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

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Asignează student nou</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Titlu lucrare */}
              <label className="modal-label">Titlu lucrare</label>
              <input
                type="text"
                className="modal-input"
                placeholder="ex: Sistem de gestiune a licențelor..."
                value={thesisTitle}
                onChange={(e) => setThesisTitle(e.target.value)}
              />

              {/* Search studenți */}
              <label className="modal-label" style={{ marginTop: 16 }}>
                Selectează student
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="Caută după nume sau email..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />

              {/* Lista studenți */}
              <div className="modal-student-list">
                {modalLoading ? (
                  <p className="modal-info">Se încarcă studenții...</p>
                ) : filteredUnassigned.length === 0 ? (
                  <p className="modal-info">Niciun student disponibil.</p>
                ) : (
                  filteredUnassigned.map(s => (
                    <div
                      key={s.id}
                      className={`modal-student-row ${selectedStudent?.id === s.id ? "selected" : ""}`}
                      onClick={() => setSelectedStudent(s)}
                    >
                      <span className="modal-student-name">{s.name}</span>
                      <span className="modal-student-email">{s.email}</span>
                    </div>
                  ))
                )}
              </div>

              {selectedStudent && (
                <p className="modal-selected-info">
                  ✓ Selectat: <strong>{selectedStudent.name}</strong>
                </p>
              )}

              {modalError && (
                <p className="modal-error">{modalError}</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal} disabled={submitting}>
                Anulează
              </button>
              <button className="btn-create" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Se creează..." : "Creează lucrare"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}