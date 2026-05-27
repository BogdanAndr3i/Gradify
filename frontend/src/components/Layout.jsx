import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";
import logoGradify from "../assets/logo_gradify.svg";
import DotGrid from "./DotGrid";

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ProfilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const getNavItems = (role) => {
  switch (role) {
    case "student":
      return [
        { to: "/dashboard", label: "Panou Student",    icon: <GridIcon /> },
        { to: "/upload",    label: "Upload Materiale", icon: <FileIcon /> },
        { to: "/istoric",   label: "Status & Istoric", icon: <FileIcon /> },
        { to: "/profil",    label: "Profil",           icon: <ProfilIcon /> },
      ];
    case "prof":
      return [
        { to: "/dashboard", label: "Panou Profesor", icon: <GridIcon /> },
        { to: "/studenti",  label: "Studenți",       icon: <UsersIcon /> },
        { to: "/profil",    label: "Profil",         icon: <ProfilIcon /> },
      ];
    case "admin":
      return [
        { to: "/dashboard",   label: "Panou Admin",      icon: <GridIcon /> },
        { to: "/utilizatori", label: "Utilizatori",      icon: <UsersIcon /> },
        { to: "/licente",     label: "Toate Licențele",  icon: <FileIcon /> },
        { to: "/profil",      label: "Profil",           icon: <ProfilIcon /> },
      ];
    default:
      return [
        { to: "/dashboard", label: "Panou Principal", icon: <GridIcon /> },
        { to: "/profil",    label: "Profil",           icon: <ProfilIcon /> },
      ];
  }
};

const NOTIFICATIONS = [
  { id: 1, text: "Licența #4821 expiră în 3 zile.", time: "acum 5 min" },
  { id: 2, text: "Utilizator nou înregistrat.",      time: "acum 1 oră" },
  { id: 3, text: "Raportul lunar este disponibil.", time: "ieri" },
];

function Navbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar__logo">
        <img src={logoGradify} alt="Gradify Logo" className="navbar__logo-img" />
      </div>
      <nav className="navbar__actions">
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className={`navbar__btn navbar__btn--ghost ${notifOpen ? "active" : ""}`}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notificări"
            aria-expanded={notifOpen}
          >
            <BellIcon />
            Notificări
            <span className="notif-badge">{NOTIFICATIONS.length}</span>
          </button>

          {notifOpen && (
            <div className="notif-popup" role="dialog">
              <div className="notif-popup__header">Notificări recente</div>
              <ul className="notif-popup__list">
                {NOTIFICATIONS.map((n) => (
                  <li key={n.id} className="notif-popup__item">
                    <span className="notif-popup__dot" />
                    <div>
                      <p className="notif-popup__text">{n.text}</p>
                      <time className="notif-popup__time">{n.time}</time>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginLeft: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: "500" }}>
            Salut, {user?.name}
          </span>
          <button className="navbar__btn navbar__btn--solid" onClick={logout}>
            <UserIcon />
            Deconectare
          </button>
        </div>
      </nav>
    </header>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const currentNavItems = getNavItems(user?.role);

  return (
    <aside className="sidebar">
      <nav aria-label="Navigare principală">
        <ul className="sidebar__list">
          {currentNavItems.map(({ to, label, icon }) => (
            <li key={to} className="sidebar__item">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                }
              >
                <span className="sidebar__link-icon">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default function Layout() {
  return (
    <div className="shell">
      <Navbar />
      <div className="shell__body">
        <Sidebar />
        <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
            <DotGrid
              dotSize={4}
              gap={18}
              baseColor="#e2e8f0"
              activeColor="#1a8cff"
              proximity={100}
              shockRadius={200}
              shockStrength={4}
              resistance={750}
              returnDuration={1.2}
            />
          </div>
          <main className="main-content" style={{ zIndex: 1, width: "100%", background: "transparent" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}