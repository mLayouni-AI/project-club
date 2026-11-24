import React from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <section className="container-main py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Club DIA</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Contact</h1>
        <p className="mt-4 leading-7 text-slate-600">Le canal de contact direct du club n'est pas encore configuré dans MyClub. Pour manifester votre intérêt, créez un compte puis envoyez une demande d'adhésion depuis votre espace.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/signup" className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800">Créer un compte</Link><Link to="/events" className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">Voir les événements</Link></div>
      </div>
    </section>
  );
}
