import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const areas = [
  { number: "01", title: "Digitalisation", text: "Concevoir des services numériques utiles aux étudiants et à leur environnement." },
  { number: "02", title: "Intelligence artificielle", text: "Découvrir les méthodes d'IA et apprendre à les appliquer avec discernement." },
  { number: "03", title: "Projets en équipe", text: "Passer de l'idée au prototype, partager les compétences et documenter le travail." },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle at 75% 20%, #16a34a 0, transparent 35%), radial-gradient(circle at 15% 90%, #0f766e 0, transparent 28%)" }} />
        <div className="container-main relative grid min-h-[34rem] items-center gap-10 py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">Club DIA · Digitalisation & intelligence artificielle</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Apprendre en construisant des projets numériques.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">MyClub rassemble les membres, les projets et les activités du Club DIA dans un espace commun, de la première idée au travail d'équipe.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={user ? "/membership" : "/signup"} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-400">{user ? "Voir mon adhésion" : "Rejoindre le club"}</Link>
              <Link to="/projects" className="rounded-xl border border-white/25 px-5 py-3 font-semibold text-white hover:bg-white/10">Découvrir les projets</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">L'esprit du club</p>
            <div className="mt-7 space-y-6">
              <div><p className="text-xl font-semibold">Explorer</p><p className="mt-1 text-sm leading-6 text-slate-300">Tester des outils, partager une veille et apprendre ensemble.</p></div>
              <div className="border-t border-white/10 pt-5"><p className="text-xl font-semibold">Créer</p><p className="mt-1 text-sm leading-6 text-slate-300">Construire des applications et prototypes suivis par le club.</p></div>
              <div className="border-t border-white/10 pt-5"><p className="text-xl font-semibold">Transmettre</p><p className="mt-1 text-sm leading-6 text-slate-300">Documenter les apprentissages et aider les nouveaux membres à progresser.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Ce que nous faisons</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Des compétences qui se développent dans la pratique</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {areas.map((area) => (
            <article key={area.number} className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <span className="text-sm font-bold text-emerald-700">{area.number}</span>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{area.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{area.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="container-main flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
          <div><h2 className="text-2xl font-bold text-slate-950">Vous avez une idée ou souhaitez apprendre ?</h2><p className="mt-2 text-slate-600">Découvrez le club et envoyez une demande d'adhésion depuis votre compte.</p></div>
          <Link to={user ? "/membership" : "/signup"} className="shrink-0 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800">{user ? "Ma demande" : "Créer un compte"}</Link>
        </div>
      </section>
    </div>
  );
}
