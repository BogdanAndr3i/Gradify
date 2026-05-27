import { useState, useEffect } from "react";
import { api } from "../api";
import BorderGlow from "../components/BorderGlow";
import "./UploadPage.css";

const FileIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const PlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function UploadPage() {
  const [thesis,          setThesis]          = useState(null);
  const [sections,        setSections]        = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [file,            setFile]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // creare secțiune nouă
  const [creatingNew,   setCreatingNew]   = useState(false);
  const [newTitle,      setNewTitle]      = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // upload state
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const theses = await api.get("/api/theses");
        if (!theses.length) { setLoading(false); return; }
        const th = theses[0];
        setThesis(th);
        const secs = await api.get(`/api/theses/${th.id}/sections`);
        setSections(secs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateSection = async () => {
    if (!newTitle.trim()) return;
    setSavingSection(true);
    try {
      const created = await api.post(`/api/theses/${thesis.id}/sections`, {
        title: newTitle.trim(),
      });
      const updated = await api.get(`/api/theses/${thesis.id}/sections`);
      setSections(updated);
      setSelectedSection(updated.find(s => s.id === created.id) || created);
      setCreatingNew(false);
      setNewTitle("");
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingSection(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedSection) return;
    setUploading(true);
    setSuccess(false);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.upload(
        `/api/theses/${thesis.id}/sections/${selectedSection.id}/versions/upload`,
        form
      );
      setSuccess(true);
      setFile(null);
      // refresh secțiuni (type poate fi actualizat)
      const updated = await api.get(`/api/theses/${thesis.id}/sections`);
      setSections(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="upload-container"><p>Se încarcă...</p></div>;
  if (error)   return <div className="upload-container"><p style={{ color: "red" }}>{error}</p></div>;
  if (!thesis) return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Încărcare Fișiere</h1>
        <p>Nu ai nicio lucrare asignată momentan. Contactează profesorul coordonator.</p>
      </div>
    </div>
  );

  const canUpload = selectedSection && file && !uploading;

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Încărcare Fișiere</h1>
        <p>Lucrare: <strong>{thesis.title}</strong></p>
      </div>

      {/* STEP 1 — Selectează sau creează secțiune */}
      <BorderGlow
        backgroundColor="#ffffff"
        borderRadius={12}
        glowColor="210 100 60"
        colors={['#1a8cff', '#60a5fa', '#93c5fd']}
        glowIntensity={0.9}
      >
        <div className="upload-section-picker">
          <h3 className="section-picker__title">1. Selectează secțiunea</h3>
          <div className="section-chips">
            {sections.map(s => (
              <button
                key={s.id}
                className={`section-chip ${selectedSection?.id === s.id ? "selected" : ""}`}
                onClick={() => { setSelectedSection(s); setSuccess(false); setFile(null); }}
              >
                {s.title}
                {s.type && s.type !== "pending" && (
                  <span className="chip-type">{s.type}</span>
                )}
              </button>
            ))}

            {!creatingNew ? (
              <button className="section-chip section-chip--new" onClick={() => setCreatingNew(true)}>
                <PlusIcon /> Secțiune nouă
              </button>
            ) : (
              <div className="new-section-inline">
                <input
                  autoFocus
                  className="new-section-input"
                  placeholder="Titlu secțiune (ex: Introducere)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreateSection(); if (e.key === "Escape") { setCreatingNew(false); setNewTitle(""); } }}
                  disabled={savingSection}
                />
                <button
                  className="btn-confirm-section"
                  onClick={handleCreateSection}
                  disabled={!newTitle.trim() || savingSection}
                >
                  {savingSection ? "..." : "Confirmă"}
                </button>
                <button
                  className="btn-cancel-section"
                  onClick={() => { setCreatingNew(false); setNewTitle(""); }}
                  disabled={savingSection}
                >
                  Anulează
                </button>
              </div>
            )}
          </div>
        </div>
      </BorderGlow>

      {/* STEP 2 — Upload fișier */}
      {selectedSection && (
        <BorderGlow
          backgroundColor="#ffffff"
          borderRadius={12}
          glowColor={success ? "160 84 40" : "210 100 60"}
          colors={success
            ? ['#10b981', '#34d399', '#6ee7b7']
            : ['#1a8cff', '#60a5fa', '#93c5fd']}
          glowIntensity={canUpload ? 1.3 : 1.0}
        >
          <div className="upload-form">
            <h3 className="section-picker__title">
              2. Fișier pentru: <em>{selectedSection.title}</em>
            </h3>

            <div className={`upload-box ${file ? "has-file" : ""}`}>
              <input
                type="file"
                id="file-input"
                onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setSuccess(false); } }}
                disabled={uploading}
              />
              <label htmlFor="file-input" className="upload-box__content">
                <FileIcon size={32} color={file ? "#1a8cff" : "#94a3b8"} />
                <span className="upload-box__text">
                  {file ? file.name : "Alege sau trage fișierul aici"}
                </span>
                {file && (
                  <span className="upload-box__size">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </label>
            </div>

            {success && (
              <div className="upload-alert upload-alert--success">
                🎉 Fișier încărcat cu succes! Profesorul coordonator a fost notificat.
              </div>
            )}

            <div className="upload-actions">
              <button
                className="btn-submit-upload"
                onClick={handleUpload}
                disabled={!canUpload}
              >
                {uploading ? "Se trimite..." : "Trimite spre Revizuire"}
              </button>
            </div>
          </div>
        </BorderGlow>
      )}
    </div>
  );
}