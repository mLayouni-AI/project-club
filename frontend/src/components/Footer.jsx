import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-emerald-950 text-slate-300">
      <div className="container-main grid gap-8 py-10 sm:grid-cols-2">
        <div>
          <p className="text-base font-semibold text-white">Club DIA</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Digitalisation & intelligence artificielle. Un espace étudiant pour apprendre, expérimenter et mener des projets numériques.</p>
        </div>
        <nav aria-label="Navigation de pied de page" className="flex flex-wrap content-start gap-x-5 gap-y-3 text-sm">
          <Link className="hover:text-white" to="/about">À propos</Link>
          <Link className="hover:text-white" to="/projects">Projets</Link>
          <Link className="hover:text-white" to="/events">Événements</Link>
          <Link className="hover:text-white" to="/announcements">Actualités</Link>
          <Link className="hover:text-white" to="/contact">Contact</Link>
        </nav>
      </div>
      <div className="border-t border-emerald-900 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} Club DIA · MyClub</div>
    </footer>
  );
}
