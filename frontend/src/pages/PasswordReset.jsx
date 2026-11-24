import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authAPI, errorMessage } from "../services/api";

export default function PasswordReset() {
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const confirming = Boolean(uid && token);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setSuccess("");
    setError("");
    try {
      if (confirming) {
        const response = await authAPI.confirmPasswordReset({ uid, token, new_password: password });
        setSuccess(response.data.detail);
      } else {
        const response = await authAPI.requestPasswordReset(email);
        setSuccess(response.data.detail);
      }
    } catch (requestError) {
      setError(errorMessage(requestError, "La demande n'a pas pu être traitée."));
    } finally {
      setBusy(false);
    }
  };

  return <main className="container-main flex min-h-[70vh] items-center justify-center py-12"><section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Sécurité du compte</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{confirming ? "Choisir un nouveau mot de passe" : "Réinitialiser le mot de passe"}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{confirming ? "Saisissez un nouveau mot de passe. Le serveur invalidera vos anciens jetons de connexion." : "Si cette adresse correspond à un compte actif, un lien de réinitialisation sera envoyé."}</p>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{success && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}<form onSubmit={submit} className="mt-6 space-y-4">{confirming ? <label className="block text-sm font-medium text-slate-700">Nouveau mot de passe<input required minLength={10} type="password" autoComplete="new-password" className="input-field mt-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label> : <label className="block text-sm font-medium text-slate-700">Adresse e-mail<input required type="email" autoComplete="email" className="input-field mt-2" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}<button disabled={busy} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Envoi…" : confirming ? "Enregistrer le nouveau mot de passe" : "Envoyer le lien"}</button></form><Link to="/login" className="mt-5 inline-block text-sm font-semibold text-emerald-700">Retour à la connexion</Link></section></main>;
}
