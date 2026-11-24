import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, eventsAPI } from "../services/api";

const statusLabel = { draft: "Brouillon", published: "Publié", full: "Complet", completed: "Terminé", cancelled: "Annulé" };

function EventAttendance({ eventItem }) {
  const [participants, setParticipants] = useState([]);
  const [records, setRecords] = useState([]);
  const [selection, setSelection] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [participantsResponse, recordsResponse] = await Promise.all([
        eventsAPI.participants(eventItem.id),
        eventsAPI.attendance(eventItem.id),
      ]);
      const registrations = participantsResponse.data.results || participantsResponse.data;
      setParticipants(registrations);
      setRecords(recordsResponse.data);
      setSelection(Object.fromEntries(registrations.map((item) => {
        const record = recordsResponse.data.find((entry) => entry.user === item.user);
        return [item.user, record?.status || ""];
      })));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError, "La liste de présence n'a pas pu être chargée."));
    } finally {
      setLoading(false);
    }
  };

  const saveAttendance = async (userId) => {
    if (!selection[userId]) return;
    setBusyId(userId);
    setError("");
    try {
      const response = await eventsAPI.attendance(eventItem.id, { user: userId, status: selection[userId] });
      setRecords((current) => [...current.filter((record) => record.user !== userId), response.data]);
    } catch (requestError) {
      setError(errorMessage(requestError, "La présence n'a pas pu être enregistrée."));
    } finally {
      setBusyId(null);
    }
  };

  return <details className="mt-4 border-t border-slate-100 pt-4" onToggle={(event) => { if (event.currentTarget.open) load(); }}><summary className="cursor-pointer text-sm font-semibold text-slate-800">Gérer les présences</summary><div className="mt-4">{error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{loading ? <p className="text-sm text-slate-500">Chargement des inscrits…</p> : participants.length ? <ul className="divide-y divide-slate-100">{participants.map((person) => <li key={person.user} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-800">{person.user_name}</p><p className="text-xs text-slate-500">{records.find((record) => record.user === person.user)?.status === "present" ? "Présent" : records.find((record) => record.user === person.user)?.status === "absent" ? "Absent" : "À marquer"}</p></div><div className="flex gap-2"><select aria-label={`Présence de ${person.user_name}`} value={selection[person.user] || ""} onChange={(event) => setSelection((current) => ({ ...current, [person.user]: event.target.value }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"><option value="">Choisir…</option><option value="present">Présent</option><option value="absent">Absent</option></select><button type="button" disabled={!selection[person.user] || busyId === person.user} onClick={() => saveAttendance(person.user)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Enregistrer</button></div></li>)}</ul> : <p className="text-sm text-slate-500">Aucun participant inscrit.</p>}</div></details>;
}

export default function Events() {
  const { user, hasCapability, hasRole } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", starts_at: "", ends_at: "", location: "", capacity: "", audience: "public", event_type: "atelier" });
  const canManage = hasCapability("events.manage_events");

  const load = async () => {
    setLoading(true);
    try {
      setEvents(await eventsAPI.getAll());
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Les événements ne sont pas disponibles pour le moment."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createEvent = async (event) => {
    event.preventDefault();
    setBusyId("new");
    setError("");
    try {
      await eventsAPI.create({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: "draft",
      });
      setForm({ name: "", description: "", starts_at: "", ends_at: "", location: "", capacity: "", audience: "public", event_type: "atelier" });
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "L'événement n'a pas pu être enregistré."));
    } finally {
      setBusyId(null);
    }
  };

  const register = async (eventItem, cancel = false) => {
    setBusyId(eventItem.id);
    setError("");
    try {
      if (cancel) await eventsAPI.cancelRegistration(eventItem.id);
      else await eventsAPI.register(eventItem.id);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "Votre inscription n'a pas pu être mise à jour."));
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = async (eventItem, status) => {
    setBusyId(eventItem.id);
    setError("");
    try {
      await eventsAPI.update(eventItem.id, { status });
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "Le statut de l'événement n'a pas été modifié."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="container-main py-12">
      <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Activités du Club DIA</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Événements</h1><p className="mt-2 text-slate-600">Ateliers, rencontres et activités publiés par le club.</p></div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {canManage && <details className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer font-semibold text-slate-900">Créer un événement</summary><form onSubmit={createEvent} className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-700">Nom<input required maxLength={200} className="input-field mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Type<input maxLength={80} className="input-field mt-2" value={form.event_type} onChange={(event) => setForm({ ...form, event_type: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Début<input required type="datetime-local" className="input-field mt-2" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Fin<input type="datetime-local" className="input-field mt-2" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Lieu<input maxLength={200} className="input-field mt-2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Capacité (facultatif)<input type="number" min="1" className="input-field mt-2" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Audience<select className="input-field mt-2" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}><option value="public">Publique</option><option value="members">Membres uniquement</option></select></label><label className="text-sm font-medium text-slate-700 md:col-span-2">Description<textarea rows={3} maxLength={6000} className="input-field mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button disabled={busyId === "new"} className="w-fit rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busyId === "new" ? "Enregistrement…" : "Enregistrer en brouillon"}</button></form></details>}

      <div className="mt-8 space-y-4" aria-live="polite">
        {loading ? <p className="py-10 text-center text-slate-500">Chargement des événements…</p> : events.length ? events.map((item) => {
          const ownsEvent = user && (item.responsible === user.id || hasCapability("members.manage_members"));
          const canJoin = user && ["published", "full"].includes(item.status) && (item.audience === "public" || hasRole("member"));
          return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.event_type || "Activité"}</span><h2 className="mt-1 text-xl font-semibold text-slate-950">{item.name}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel[item.status] || item.status}</span></div><p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{item.description || "Plus de détails seront communiqués par l'organisateur."}</p><dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Date</dt><dd className="mt-1 font-medium text-slate-800">{item.starts_at ? new Date(item.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "À confirmer"}</dd></div><div><dt className="text-slate-500">Lieu</dt><dd className="mt-1 font-medium text-slate-800">{item.location || "À confirmer"}</dd></div><div><dt className="text-slate-500">Places disponibles</dt><dd className="mt-1 font-medium text-slate-800">{item.capacity_remaining === null ? "Sans limite" : item.capacity_remaining}</dd></div></dl><div className="mt-5 flex flex-wrap items-center gap-3">{item.is_registered ? <button type="button" disabled={busyId === item.id} onClick={() => register(item, true)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Annuler mon inscription</button> : canJoin && item.status === "published" && item.capacity_remaining !== 0 ? <button type="button" disabled={busyId === item.id} onClick={() => register(item)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busyId === item.id ? "En cours…" : "M'inscrire"}</button> : !user && item.status === "published" ? <Link to="/login" className="text-sm font-semibold text-emerald-700">Connectez-vous pour vous inscrire</Link> : null}{ownsEvent && item.status === "draft" && <button type="button" disabled={busyId === item.id} onClick={() => changeStatus(item, "published")} className="text-sm font-semibold text-emerald-700 disabled:opacity-50">Publier</button>}{ownsEvent && item.status !== "cancelled" && <button type="button" disabled={busyId === item.id} onClick={() => { if (window.confirm(`Annuler l'événement « ${item.name} » ?`)) changeStatus(item, "cancelled"); }} className="text-sm font-semibold text-red-700 disabled:opacity-50">Annuler l'événement</button>}</div>{ownsEvent && <EventAttendance eventItem={item} />}</article>;
        }) : <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center"><h2 className="font-semibold text-slate-800">Aucun événement publié</h2><p className="mt-2 text-sm text-slate-500">Les événements apparaîtront ici lorsqu'ils seront publiés.</p></div>}
      </div>
    </section>
  );
}
