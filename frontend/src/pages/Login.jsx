import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const result = await login(form.email, form.password);

    if (result.success) {
      // Redirect to appropriate dashboard based on user role
      const userRole = result.user?.role || 'member';
      const dashboardPath = userRole === 'admin' ? '/dashboard/admin' : '/dashboard/member';
      navigate(dashboardPath);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-light] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[--color-primary] bg-opacity-10 mb-4">
            <img 
              src="/images/logo.svg" 
              alt="Club Dev Logo"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%231A73E8'/%3E%3Cpath d='M30 30 L20 50 L30 70' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M70 30 L80 50 L70 70' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Ctext x='50' y='58' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E%26lt;/%26gt;%3C/text%3E%3Ccircle cx='35' cy='35' r='3' fill='white'/%3E%3Ccircle cx='65' cy='35' r='3' fill='white'/%3E%3Ccircle cx='50' cy='65' r='3' fill='white'/%3E%3C/svg%3E";
              }}
            />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-[--color-text-primary]">Connexion Club Dev</h2>
          <p className="mt-2 text-center text-sm text-[--color-text-secondary]">
            Plateforme de gestion du club de développement
          </p>
          <p className="mt-1 text-center text-sm text-[--color-text-secondary]">
            Vous n'avez pas de compte ?{' '}
            <Link to="/signup" className="font-medium text-[--color-primary] hover:text-[--color-secondary] no-underline hover:no-underline focus:no-underline">
              S'inscrire ici
            </Link>
          </p>
        </div>
        
        <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="Entrez votre email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="Entrez votre mot de passe"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}