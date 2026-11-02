import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Client-side validation
    if (form.password !== form.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (form.password.length < 4) {
      setError("Le mot de passe doit contenir au moins 4 caractères");
      setLoading(false);
      return;
    }

    const result = await signup(form);

    if (result.success) {
      setSuccess(result.message || "Compte créé avec succès !");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
          <h2 className="mt-4 text-3xl font-extrabold text-[--color-text-primary]">Rejoindre Club Dev</h2>
          <p className="mt-2 text-center text-sm text-[--color-text-secondary]">
            Plateforme de gestion du club de développement
          </p>
          <p className="mt-1 text-center text-sm text-[--color-text-secondary]">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-medium text-[--color-primary] hover:text-[--color-secondary] no-underline hover:no-underline focus:no-underline">
              Se connecter ici
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

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                  Prénom
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  className="input-field"
                  placeholder="Prénom"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                  Nom
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  className="input-field"
                  placeholder="Nom"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-field"
                placeholder="Entrez votre email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input-field"
                placeholder="Créez un mot de passe (min. 4 caractères)"
                value={form.password}
                onChange={handleChange}
                required
                minLength={4}
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-[--color-text-primary] mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                className="input-field"
                placeholder="Confirmez votre mot de passe"
                value={form.confirm_password}
                onChange={handleChange}
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
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                )}
                <span>{loading ? 'Création du compte...' : 'Créer un compte'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}