import { useState } from "react";
import { auth } from "../firebase";
// Importăm CSS-ul dedicat
import "./TesterPlagiatPage.css"; 

// Importăm librăriile grafice
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function TesterPlagiatPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Te rog să selectezi un fișier PDF mai întâi.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("https://gradify-497616.ew.r.appspot.com/api/plagiat/analyze-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.eroare || "Eroare necunoscută la procesare.");
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper pentru a stabili culoarea în funcție de risc
 const getRiskColor = (riskStatus) => {
  if (!riskStatus) return "#3b82f6";
  const r = riskStatus.toUpperCase();
  if (r === "VERDE") return "#10b981";
  if (r === "GALBEN") return "#f59e0b";
  if (r.includes("RO")) return "#ef4444";
  return "#3b82f6";
};

const getRiskLabel = (riskStatus) => {
  if (!riskStatus) return "";
  const r = riskStatus.toUpperCase();
  if (r === "VERDE") return "Scăzut";
  if (r === "GALBEN") return "Mediu";
  if (r.includes("RO")) return "Ridicat";
  return riskStatus;
};

  // Helper pentru formatarea tooltip-ului din grafic
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "#fff", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>{payload[0].payload.document}</p>
          <p style={{ margin: 0, color: payload[0].fill }}>Similaritate: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tester-container">
      <h1 className="tester-header">Raport Originalitate (PoC)</h1>
      <p className="tester-subtitle">
        Încarcă un document PDF pentru a genera o analiză detaliată a similarităților.
      </p>
      
      {/* 1. Zona de Upload */}
      <div className="upload-card">
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button 
          className="btn-analyze"
          onClick={handleAnalyze} 
          disabled={loading}
        >
          {loading ? "Analiză în curs..." : "Generează Raport"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* 2. Zona de Dashboard vizual */}
      {report && report.sumar_analiza && (
        <>
          <div className="results-dashboard">
            
            {/* Cardul pentru Inelul de Progres */}
            <div className="score-card">
              <div className="gauge-container">
                <CircularProgressbar 
                  value={report.sumar_analiza.scor_general} 
                  text={`${report.sumar_analiza.scor_general}%`}
                  styles={buildStyles({
                    pathColor: getRiskColor(report.sumar_analiza.stare_risc),
                    textColor: getRiskColor(report.sumar_analiza.stare_risc),
                    trailColor: '#f1f5f9',
                    strokeLinecap: 'round',
                  })}
                />
              </div>
              <h3 className={`risk-label risk-${report.sumar_analiza.stare_risc}`}>
                RISC: {getRiskLabel(report.sumar_analiza.stare_risc)}
              </h3>
              <p className="risk-message">{report.sumar_analiza.mesaj}</p>
            </div>

            {/* Cardul pentru Graficul cu Bare */}
            <div className="chart-card">
              <h3>Distribuția Surselor Identificate</h3>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={report.surse_principale}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} hide />
                    {/* Afișează doar primele 15 caractere din numele PDF-ului ca să nu strice layout-ul */}
                    <YAxis 
                      dataKey="document" 
                      type="category" 
                      width={120} 
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="procent" radius={[0, 4, 4, 0]} barSize={25}>
                      {
                        report.surse_principale.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getRiskColor(report.sumar_analiza.stare_risc)} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* 3. Zona de Fragmente Compromise */}
          {report.fragmente_suspecte.length > 0 && (
            <div className="fragments-section">
              <h3>Texte Compromise (High-Match)</h3>
              <div>
                {report.fragmente_suspecte.map((frag, idx) => (
                  <div key={idx} className="fragment-box">
                    <p className="fragment-header">
                      Sursă identificată: {frag.document_sursa} (Potrivire: {frag.scor_potrivire}%)
                    </p>
                    <p className="fragment-text">
                      "...{frag.text_student}..."
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}