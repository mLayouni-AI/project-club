import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { announcementsAPI, errorMessage } from "../services/api";

const statusLabel = { draft: "Brouillon", published: "Publiée", archived: "Archivée" };

export default function Announcements() {
  const { user, hasCapability } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", content: "", audience: "members" });
  const canManage = hasCapability("announcements.manage_announcements");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await announcementsAPI.getAll());
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Les actualités ne sont pas disponibles pour le moment."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((item) => `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setBusyId("new");
    setError("");
    try {
      await announcementsAPI.create(form);
      setForm({ title: "", content: "", audience: "members" });
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "L'annonce n'a pas pu être enregistrée."));
    } finally {
      setBusyId(null);
    }
  };

  const moderate = async (item, action) => {
    if (action === "delete" && !window.confirm(`Supprimer l'annonce « ${item.title} » ?`)) return;
    setBusyId(item.id);
    setError("");
    try {
      if (action === "publish") await announcementsAPI.publish(item.id);
      if (action === "unpublish") await announcementsAPI.unpublish(item.id);
      if (action === "delete") await announcementsAPI.delete(item.id);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "Cette action n'a pas pu être enregistrée."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="container-main py-12">
      <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Vie du club</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Actualités</h1><p className="mt-2 text-slate-600">Annonces publiées par l'équipe du Club DIA.</p></div>
      <label className="mt-7 block max-w-xl text-sm font-medium text-slate-700">Rechercher<input className="input-field mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre ou contenu" /></label>
      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      {canManage && <details className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer font-semibold text-slate-900">Rédiger une annonce</summary><form onSubmit={handleCreate} className="mt-5 grid gap-4"><label className="text-sm font-medium text-slate-700">Titre<input required maxLength={200} className="input-field mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Contenu<textarea required maxLength={10000} rows={5} className="input-field mt-2" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Audience<select className="input-field mt-2 max-w-xs" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}><option value="members">Membres du club</option><option value="public">Publique</option></select></label><button disabled={busyId === "new"} className="w-fit rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busyId === "new" ? "Enregistrement…" : "Enregistrer en brouillon"}</button></form></details>}

      <div className="mt-8 space-y-4" aria-live="polite">
        {loading ? <p className="py-10 text-center text-slate-500">Chargement des actualités…</p> : filtered.length ? filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-slate-950">{item.title}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{statusLabel[item.status] || item.status} · {item.audience === "public" ? "Public" : "Membres"}</span></div>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{item.content}</p>
            <p className="mt-4 text-xs text-slate-500">{item.published_at ? `Publiée le ${new Date(item.published_at).toLocaleDateString("fr-FR")}` : `Créée le ${new Date(item.created_at).toLocaleDateString("fr-FR")}`}{item.author_name ? ` · ${item.author_name}` : ""}</p>
            {canManage && <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">{item.status === "published" ? <button type="button" disabled={busyId === item.id} onClick={() => moderate(item, "unpublish")} className="text-sm font-semibold text-emerald-700 disabled:opacity-50">Dépublier</button> : <button type="button" disabled={busyId === item.id} onClick={() => moderate(item, "publish")} className="text-sm font-semibold text-emerald-700 disabled:opacity-50">Publier</button>}<button type="button" disabled={busyId === item.id} onClick={() => moderate(item, "delete")} className="text-sm font-semibold text-red-700 disabled:opacity-50">Supprimer</button></div>}
          </article>
        )) : <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center"><h2 className="font-semibold text-slate-800">Aucune actualité disponible</h2><p className="mt-2 text-sm text-slate-500">Les annonces apparaîtront ici après leur publication.</p></div>}
      </div>
      {!user && <p className="mt-6 text-sm text-slate-500">Certaines annonces sont réservées aux membres connectés.</p>}
    </section>
  );
}
