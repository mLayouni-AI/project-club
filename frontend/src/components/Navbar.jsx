import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation links - different for admin vs member
  const navLinks = user?.role === 'admin' ? [
    { path: '/dashboard/admin', label: "Tableau de bord" },
    { path: "/members", label: "Membres" },
    { path: "/projects", label: "Projets" },
    { path: "/announcements", label: "Événements" },
    { path: "/contact", label: "Contact" },
  ] : [
    { path: '/dashboard/member', label: "Accueil" },
    { path: "/members", label: "Membres" },
    { path: "/projects", label: "Projets" },
    { path: "/announcements", label: "Événements" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="bg-[--color-primary] shadow-md sticky top-0 z-50 border-b border-[--color-secondary]">
      <div className="container-main">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group no-underline hover:no-underline focus:no-underline">
              {/* Club Logo */}
              <div className="bg-white rounded-lg p-1.5 group-hover:bg-opacity-90 transition-all duration-200">
                <img 
                  src="/images/logo.svg" 
                  alt="Club Dev Logo"
                  className="h-7 w-7 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%231A73E8'/%3E%3Cpath d='M30 30 L20 50 L30 70' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M70 30 L80 50 L70 70' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Ctext x='50' y='58' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E%26lt;/%26gt;%3C/text%3E%3Ccircle cx='35' cy='35' r='3' fill='white'/%3E%3Ccircle cx='65' cy='35' r='3' fill='white'/%3E%3Ccircle cx='50' cy='65' r='3' fill='white'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              {/* Brand Name */}
              <div className="hidden sm:block">
                <span className="text-white font-semibold text-lg tracking-tight no-underline">Club Dev</span>
                <div className="text-xs text-[--color-accent] no-underline">ISTAG Bab Tizimi</div>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`${
                  isActive(link.path)
                    ? "bg-[--color-secondary] text-white border-b-2 border-white"
                    : "text-[--color-accent] hover:text-white hover:bg-[--color-secondary] hover:bg-opacity-50"
                } px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-md no-underline hover:no-underline focus:no-underline`}
              >
                <span>{link.label}</span>
              </Link>
            ))}

            {/* User section */}
            <div className="flex items-center ml-6 pl-6 border-l border-[--color-secondary]">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-white text-sm">
                    <div className="font-medium no-underline">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-[--color-accent] no-underline">{user.role === 'admin' ? 'Administrateur' : 'Membre'}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 border border-white border-opacity-20 flex items-center space-x-2 text-sm no-underline hover:no-underline focus:no-underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-[--color-secondary] focus:outline-none transition-colors no-underline hover:no-underline focus:no-underline"
            >
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} lg:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-[--color-primary]">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`${
                isActive(link.path)
                  ? "bg-[--color-secondary] text-white"
                  : "text-[--color-accent] hover:bg-[--color-secondary] hover:bg-opacity-50 hover:text-white"
              } block px-3 py-3 rounded-md text-base font-medium transition-all duration-200 no-underline hover:no-underline focus:no-underline`}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Mobile user section */}
          {user && (
            <div className="pt-4 pb-3 border-t border-[--color-secondary]">
              <div className="px-3 mb-3">
                <div className="text-white font-medium no-underline">{user.first_name} {user.last_name}</div>
                <div className="text-sm text-[--color-accent] no-underline">{user.email}</div>
                <div className="text-xs text-[--color-accent] mt-1 no-underline">
                  {user.role === 'admin' ? 'Administrateur' : 'Membre'}
                </div>
              </div>
              <div className="px-3">
                <button
                  onClick={handleLogout}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 border border-white border-opacity-20 w-full flex items-center justify-center space-x-2 text-sm no-underline hover:no-underline focus:no-underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}