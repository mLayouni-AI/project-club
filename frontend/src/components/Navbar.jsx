import React, { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, hasCapability, notifications } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/", label: "Accueil" },
    { to: "/about", label: "Le club" },
    { to: "/projects", label: "Projets" },
    { to: "/events", label: "Événements" },
    { to: "/announcements", label: "Actualités" },
    ...(user ? [{ to: "/membership", label: "Adhésion" }] : []),
    ...(user ? [{ to: "/notifications", label: `Notifications${notifications.some((item) => !item.read_at) ? ` · ${notifications.filter((item) => !item.read_at).length}` : ""}` }] : []),
    ...(hasCapability("members.view_members") ? [{ to: "/members", label: "Membres" }] : []),
    ...(user ? [{ to: "/dashboard", label: "Espace membre" }] : []),
    ...(user ? [{ to: "/profile", label: "Mon profil" }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="container-main flex min-h-16 items-center justify-between gap-4" aria-label="Navigation principale">
        <Link to="/" className="flex items-center gap-3 text-slate-900" onClick={() => setMenuOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-sm font-bold text-white" aria-hidden="true">DIA</span>
          <span>
            <span className="block text-sm font-bold tracking-wide">MyClub</span>
            <span className="block text-xs text-slate-500">Digitalisation & intelligence artificielle</span>
          </span>
        </Link>

        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="main-navigation-links"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Fermer" : "Menu"}
        </button>

        <div id="main-navigation-links" className={`${menuOpen ? "absolute inset-x-0 top-16 flex flex-col border-b bg-white p-4 shadow-lg" : "hidden"} lg:static lg:flex lg:flex-row lg:items-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-slate-100 text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
            >
              {label}
            </NavLink>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-slate-200 pt-3 lg:mt-0 lg:border-0 lg:pt-0">
            {user ? (
              <>
                <span className="hidden max-w-40 truncate px-2 text-sm text-slate-600 xl:block" title={user.email}>{user.first_name} {user.last_name}</span>
                <button type="button" onClick={handleLogout} className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" state={{ from: location.pathname }} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Connexion</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Adhérer</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
