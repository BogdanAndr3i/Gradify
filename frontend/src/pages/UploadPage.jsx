import { useState } from "react";
import BorderGlow from "../components/BorderGlow"; // <-- Importăm componenta
import "./UploadPage.css";

export const FileTextIcon = ({ size = 24, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const ArchiveIcon = ({ size = 24, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export default function UploadPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);

  const handlePdfChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setStatus("idle"); 
    }
  };

  const handleZipChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setZipFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pdfFile || !zipFile) return;

    setStatus("uploading");
    setProgress(15);

    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) {
          clearInterval(interval);
          return 90; 
        }
        return oldProgress + 25;
      });
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setStatus("success");
      
      setPdfFile(null);
      setZipFile(null);
    }, 2000);
  };

  const isSuccess = status === "success";
  const isReadyToSubmit = pdfFile && zipFile && status === "idle";

  let currentGlowColor = "210 100 60"; 
  let currentGradientColors = ['#1a8cff', '#60a5fa', '#93c5fd'];
  let currentIntensity = 1.0;

  if (isReadyToSubmit) {
    currentIntensity = 1.3;
  }
  else if (isSuccess) {
    currentGlowColor = "160 84 40"; // Nuanță de verde HSL
    currentGradientColors = ['#10b981', '#34d399', '#6ee7b7'];
    currentIntensity = 1.2;
  }

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Încărcare Materiale Licență</h1>
        <p>Selectează documentul scris în format PDF și arhiva ZIP conținând codul sursă sau anexele proiectului tău.</p>
      </div>

      <BorderGlow
        backgroundColor="#ffffff"
        borderRadius={12}
        glowColor={currentGlowColor}
        colors={currentGradientColors}
        glowIntensity={currentIntensity}
      >
        <form onSubmit={handleSubmit} className="upload-form">
          
          <div className="upload-slot">
            <label className="upload-slot__label">Documentul Scris (Format PDF)</label>
            <div className={`upload-box ${pdfFile ? "has-file" : ""}`}>
              <input 
                type="file" 
                accept=".pdf" 
                id="pdf-input" 
                onChange={handlePdfChange} 
                disabled={status === "uploading"}
              />
              <label htmlFor="pdf-input" className="upload-box__content">
                <FileTextIcon className="upload-box__icon" />
                <span className="upload-box__text">
                  {pdfFile ? pdfFile.name : "Alege sau trage fișierul PDF aici"}
                </span>
                {pdfFile && (
                  <span className="upload-box__size">
                    ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="upload-slot">
            <label className="upload-slot__label">Arhivă Cod Sursă / Anexe (Format ZIP)</label>
            <div className={`upload-box ${zipFile ? "has-file" : ""}`}>
              <input 
                type="file" 
                accept=".zip,.rar,.7z" 
                id="zip-input" 
                onChange={handleZipChange}
                disabled={status === "uploading"}
              />
              <label htmlFor="zip-input" className="upload-box__content">
                <ArchiveIcon className="upload-box__icon" />
                <span className="upload-box__text">
                  {zipFile ? zipFile.name : "Alege sau trage fișierul ZIP aici"}
                </span>
                {zipFile && (
                  <span className="upload-box__size">
                    ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="upload-actions">
            
            {status === "uploading" && (
              <div className="upload-progress-wrapper">
                <div className="upload-progress-text">Se încarcă în Google Cloud Storage... {progress}%</div>
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="upload-alert upload-alert--success">
                <strong>🎉 Încărcare reușită!</strong> Documentele au fost salvate securizat și profesorul tău coordonator a fost notificat.
              </div>
            )}

            <button 
              type="submit" 
              className="btn-submit-upload" 
              disabled={status === "uploading" || !pdfFile || !zipFile}
            >
              {status === "uploading" ? "Se trimite..." : "Trimite spre Revizuire"}
            </button>
          </div>

        </form>
      </BorderGlow>
    </div>
  );
}