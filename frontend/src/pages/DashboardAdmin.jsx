import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const projectStatuses = {
  idea: "Idée", proposed: "Proposé", approved: "Validé", planned: "Planifié",
  in_progress: "En cours", in_review: "En revue", completed: "Terminé", suspended: "Suspendu", cancelled: "Annulé",
};

export default function DashboardAdmin() {
  const { user, dashboard, dataError, hasCapability } = useAuth();
  const admin = dashboard?.administration;
  const overview = dashboard?.club_overview;
  const cards = [
    ["Membres actifs", admin?.active_members ?? overview?.members],
    ["Demandes en attente", admin?.pending_membership_requests ?? overview?.pending_membership_requests],
    ["Projets", overview?.projects],
    ["Événements à venir", admin?.upcoming_events],
    ["Tâches en retard", admin?.overdue_tasks],
  ].filter(([, value]) => value !== undefined);

  return (
    <section className="container-main py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Pilotage du club</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Bonjour {user?.first_name}</h1><p className="mt-2 text-slate-600">Indicateurs issus des données enregistrées dans MyClub.</p></div><button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Actualiser</button></div>
      {dataError && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{dataError}</p>}
      {!dashboard ? <p role="status" className="mt-8 text-slate-500">Chargement des indicateurs…</p> : <>
        {cards.length > 0 ? <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p></article>)}</div> : <p className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Aucun indicateur global n'est associé à vos permissions.</p>}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {admin?.projects_by_status && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Projets par statut</h2>{admin.projects_by_status.length ? <ul className="mt-4 divide-y divide-slate-100">{admin.projects_by_status.map((item) => <li key={item.status} className="flex justify-between py-3 text-sm"><span className="text-slate-700">{projectStatuses[item.status] || item.status}</span><strong className="text-slate-950">{item.count}</strong></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Aucun projet enregistré.</p>}<Link className="mt-4 inline-block text-sm font-semibold text-emerald-700" to="/projects">Voir les projets →</Link></section>}
          {admin?.recent_members && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Membres récemment inscrits</h2>{admin.recent_members.length ? <ul className="mt-4 divide-y divide-slate-100">{admin.recent_members.map((member) => <li key={member.id} className="flex justify-between gap-3 py-3 text-sm"><span className="font-medium text-slate-800">{member.first_name} {member.last_name}</span><span className="text-slate-500">{new Date(member.date_joined).toLocaleDateString("fr-FR")}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Aucun membre enregistré.</p>}<Link className="mt-4 inline-block text-sm font-semibold text-emerald-700" to="/members">Gérer les membres →</Link></section>}
          {hasCapability("members.review_membership") && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Adhésions</h2><p className="mt-2 text-sm text-slate-600">Consultez les candidatures et enregistrez les décisions.</p><Link className="mt-4 inline-block text-sm font-semibold text-emerald-700" to="/membership">Ouvrir les demandes →</Link></section>}
          {admin?.recent_sensitive_activity && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Activité sensible récente</h2>{admin.recent_sensitive_activity.length ? <ul className="mt-4 divide-y divide-slate-100">{admin.recent_sensitive_activity.map((item) => <li key={item.id} className="py-3"><p className="text-sm font-medium text-slate-800">{item.action}</p><p className="mt-1 text-xs text-slate-500">{item.actor__email || "Système"} · {new Date(item.created_at).toLocaleString("fr-FR")}</p></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Aucune activité récente.</p>}</section>}
        </div>
      </>}
    </section>
  );
}
