import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoGradify from "../assets/logo_gradify.svg";
import DotGrid from "../components/DotGrid"; 
import BorderGlow from "../components/BorderGlow";
import RotatingText from "../components/RotatingText"; 
import "./Login.css";

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.6 35.6 16.3 40 24 40v4z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41.6 35.3 44 30 44 24c0-1.3-.1-2.7-.4-3.9z"/>
  </svg>
);

const TEST_ROLES = [
  { role: "pending",  label: "⏳ Pending"  },
  { role: "student",  label: "🎓 Student"  },
  { role: "prof",     label: "📚 Profesor" },
  { role: "admin",    label: "🛡️ Admin"    },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = (role) => {
    login(role);
    navigate("/", { replace: true });
  };

  return (
    <div className="login-page">
      
      <div className="login-background">
        <DotGrid
          dotSize={5}
          gap={15}
          baseColor="#cbd5e1"     
          activeColor="#1a8cff"   
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      <div className="login-glow-wrapper">
        <div className="login-slogan">
          <span>Un singur loc pentru</span>
          <RotatingText
            texts={['drafturi', 'feedback', 'aprobări', 'succes!']}
            mainClassName="rotating-word-container"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2500}
            splitBy="characters"
            auto
            loop
          />
        </div>

        <BorderGlow
          backgroundColor="#ffffff"
          borderRadius={16}
          glowColor="210 100 60"
          colors={['#1a8cff', '#60a5fa', '#93c5fd']}
          glowIntensity={1.2} 
          edgeSensitivity={40} 
        >
          <div className="login-card">
            <img src={logoGradify} alt="Gradify Logo" className="login-card__logo-img" />
            
            <p className="login-card__subtitle">
              Autentifică-te cu contul instituțional pentru a continua.
            </p>

            <button className="btn-google" onClick={() => handleLogin("pending")}>
              <GoogleLogo />
              Continuă cu Google
            </button>

            <div className="login-card__divider">sau alege un rol pentru testare</div>

            <span className="role-picker__label">Rol de test</span>
            <div className="role-picker__grid">
              {TEST_ROLES.map(({ role, label }) => (
                <button key={role} className="btn-role" onClick={() => handleLogin(role)}>
                  {label}
                </button>
              ))}
            </div>

            <p className="login-card__footer">
              Prin autentificare, ești de acord cu politica de confidențialitate<br />a instituției tale.
            </p>
          </div>
        </BorderGlow>
        
      </div>
    </div>
  );
}