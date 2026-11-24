import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI, errorMessage } from "../services/api";

const roleLabels = {
  visitor: "Visiteur",
  member: "Membre",
  club_admin: "Administrateur du club",
  project_lead: "Chef de projet",
  president: "Président du club",
  event_manager: "Responsable des événements",
  pedagogical_supervisor: "Encadrant pédagogique",
  communications_manager: "Responsable de la communication",
};

export default function Profile() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    study_program: "",
    study_year: "",
    skills_text: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const response = await authAPI.me();
        const data = response.data;
        const prof = data.profile || {};
        const skillsList = Array.isArray(prof.skills) ? prof.skills.join(", ") : "";
        setProfileForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: prof.phone || "",
          study_program: prof.study_program || "",
          study_year: prof.study_year || "",
          skills_text: skillsList,
        });
      } catch (err) {
        setProfileError(errorMessage(err, "Impossible de charger les données du profil."));
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");

    const skillsArray = profileForm.skills_text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await authAPI.updateMe({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        profile: {
          phone: profileForm.phone,
          study_program: profileForm.study_program,
          study_year: profileForm.study_year,
          skills: skillsArray,
        },
      });
      setProfileSuccess("Profil mis à jour avec succès.");
    } catch (err) {
      setProfileError(errorMessage(err, "Erreur lors de la mise à jour du profil."));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.new_password.length < 10) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 10 caractères.");
      setPasswordSaving(false);
      return;
    }

    try {
      const response = await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess(response.data?.detail || "Mot de passe modifié avec succès.");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    } catch (err) {
      setPasswordError(errorMessage(err, "Erreur lors de la modification du mot de passe."));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="container-main py-12">
        <p className="text-center text-slate-500">Chargement de votre profil…</p>
      </main>
    );
  }

  return (
    <main className="container-main py-12 max-w-4xl space-y-10">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Paramètres</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Mon profil</h1>
        <p className="mt-2 text-slate-600">Gérez vos informations personnelles, académiques et la sécurité de votre compte.</p>
      </div>

      {/* Rôles et statut */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Statut et rôles</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {user?.roles?.length ? (
            user.roles.map((code) => (
              <span key={code} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {roleLabels[code] || code}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Visiteur</span>
          )}
          {user?.is_active && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Compte actif</span>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">Identifiant e-mail : {user?.email}</p>
      </section>

      {/* Informations personnelles et académiques */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Informations du membre</h2>
        {profileSuccess && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {profileSuccess}
          </p>
        )}
        {profileError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {profileError}
          </p>
        )}
        <form onSubmit={handleProfileSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Prénom
            <input
              required
              className="input-field mt-2"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Nom
            <input
              required
              className="input-field mt-2"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Téléphone
            <input
              type="tel"
              className="input-field mt-2"
              placeholder="+212 6..."
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Année d'études
            <input
              className="input-field mt-2"
              placeholder="Ex: 2ème année, M1, L3"
              value={profileForm.study_year}
              onChange={(e) => setProfileForm({ ...profileForm, study_year: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Filière / Programme d'études
            <input
              className="input-field mt-2"
              placeholder="Ex: Génie Informatique, Data Science & IA"
              value={profileForm.study_program}
              onChange={(e) => setProfileForm({ ...profileForm, study_program: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Compétences techniques (séparées par des virgules)
            <input
              className="input-field mt-2"
              placeholder="Ex: Python, React, PostgreSQL, PyTorch, Docker"
              value={profileForm.skills_text}
              onChange={(e) => setProfileForm({ ...profileForm, skills_text: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 mt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {profileSaving ? "Enregistrement…" : "Mettre à jour le profil"}
            </button>
          </div>
        </form>
      </section>

      {/* Sécurité et mot de passe */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Changer de mot de passe</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pour votre sécurité, un mot de passe fort d'au moins 10 caractères est exigé.
        </p>
        {passwordSuccess && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {passwordSuccess}
          </p>
        )}
        {passwordError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {passwordError}
          </p>
        )}
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 max-w-lg">
          <label className="block text-sm font-medium text-slate-700">
            Mot de passe actuel
            <input
              required
              type="password"
              autoComplete="current-password"
              className="input-field mt-2"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nouveau mot de passe (min. 10 caractères)
            <input
              required
              minLength={10}
              type="password"
              autoComplete="new-password"
              className="input-field mt-2"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirmer le nouveau mot de passe
            <input
              required
              minLength={10}
              type="password"
              autoComplete="new-password"
              className="input-field mt-2"
              value={passwordForm.confirm_new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_new_password: e.target.value })}
            />
          </label>
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {passwordSaving ? "Modification…" : "Modifier mon mot de passe"}
          </button>
        </form>
      </section>
    </main>
  );
}
