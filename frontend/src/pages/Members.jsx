import React, { useEffect, useState } from "react";
import { membersAPI, errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const roles = [
  ["visitor", "Visiteur"], ["member", "Membre"], ["club_admin", "Administrateur"],
  ["project_lead", "Chef de projet"], ["president", "Président"],
  ["event_manager", "Responsable événements"], ["pedagogical_supervisor", "Encadrant pédagogique"],
  ["communications_manager", "Responsable communication"],
];

export default function Members() {
  const { user, hasCapability, deactivateMember } = useAuth();
  const [members, setMembers] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const canManageMembers = hasCapability("members.manage_members");
  const canManageRoles = hasCapability("members.manage_roles");

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const response = await membersAPI.getAll({ page: targetPage, search: search || undefined });
      setMembers(response.data.results || response.data);
      setCount(response.data.count ?? response.data.length ?? 0);
      setNext(response.data.next || null);
      setPrevious(response.data.previous || null);
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Le répertoire des membres n'a pas pu être chargé."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); load(1); }, [search]);

  const updateRoles = async (member, selected) => {
    setBusyId(member.id);
    setError("");
    try {
      const response = await membersAPI.assignRoles(member.id, selected);
      setMembers((current) => current.map((item) => item.id === member.id ? response.data : item));
    } catch (requestError) {
      setError(errorMessage(requestError, "Les rôles n'ont pas été modifiés."));
    } finally {
      setBusyId(null);
    }
  };

  const deactivate = async (member) => {
    if (!window.confirm(`Désactiver le compte de ${member.full_name || member.email} ?`)) return;
    setBusyId(member.id);
    setError("");
    try {
      await deactivateMember(member.id);
      setMembers((current) => current.map((item) => item.id === member.id ? { ...item, is_active: false } : item));
    } catch (requestError) {
      setError(errorMessage(requestError, "Le compte n'a pas été désactivé."));
    } finally {
      setBusyId(null);
    }
  };

  const activate = async (member) => {
    setBusyId(member.id);
    setError("");
    try {
      const response = await membersAPI.activate(member.id);
      setMembers((current) => current.map((item) => item.id === member.id ? response.data : item));
    } catch (requestError) {
      setError(errorMessage(requestError, "Le compte n'a pas pu être réactivé."));
    } finally {
      setBusyId(null);
    }
  };

  const exportMembers = async () => {
    try {
      const response = await membersAPI.export({ search: search || undefined });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "myclub-members.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(errorMessage(requestError, "L'export n'a pas pu être téléchargé."));
    }
  };

  return (
    <section className="container-main py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Administration du club</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Membres</h1><p className="mt-2 text-slate-600">Comptes et rôles enregistrés dans MyClub.</p></div>{canManageMembers && <button type="button" onClick={exportMembers} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Exporter CSV</button>}</div>
      <label className="mt-7 block max-w-xl text-sm font-medium text-slate-700">Rechercher<input className="input-field mt-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou adresse e-mail" /></label>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-8 text-center text-slate-500">Chargement du répertoire…</p> : members.length ? <>
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Membre</th><th className="px-5 py-3">Rôles</th><th className="px-5 py-3">Statut</th>{canManageRoles && <th className="px-5 py-3">Modifier les rôles</th>}{canManageMembers && <th className="px-5 py-3">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100">{members.map((member) => <tr key={member.id} className="align-top"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{member.full_name || `${member.first_name} ${member.last_name}`}</p><p className="mt-1 text-slate-500">{member.email}</p></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{member.roles.map((role) => <span key={role} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{roles.find(([code]) => code === role)?.[1] || role}</span>)}</div></td><td className="px-5 py-4">{member.is_active ? <span className="text-emerald-700">Actif</span> : <span className="text-slate-500">Désactivé</span>}</td>{canManageRoles && <td className="px-5 py-4"><select aria-label={`Rôles de ${member.full_name || member.email}`} multiple value={member.roles} disabled={busyId === member.id || member.id === user?.id} onChange={(event) => updateRoles(member, Array.from(event.target.selectedOptions, (option) => option.value))} className="min-h-28 min-w-48 rounded-lg border border-slate-300 p-2 text-xs">{roles.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><p className="mt-1 text-xs text-slate-500">Ctrl/Cmd pour sélectionner plusieurs rôles.</p></td>}{canManageMembers && <td className="px-5 py-4">{member.is_active && member.id !== user?.id && <button type="button" disabled={busyId === member.id} onClick={() => deactivate(member)} className="font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">Désactiver</button>}</td>}</tr>)}</tbody></table></div>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm"><span className="text-slate-500">{count} compte(s)</span><div className="flex gap-2"><button disabled={!previous || loading} onClick={() => { setPage((value) => Math.max(value - 1, 1)); load(page - 1); }} className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40">Précédent</button><span className="px-2 py-1.5 text-slate-600">Page {page}</span><button disabled={!next || loading} onClick={() => { setPage((value) => value + 1); load(page + 1); }} className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40">Suivant</button></div></div>
        </> : <p className="p-8 text-center text-slate-500">Aucun compte ne correspond à cette recherche.</p>}
      </div>
    </section>
  );
}
