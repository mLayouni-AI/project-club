import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { errorMessage, membershipAPI } from "../services/api";

const statuses = {
  pending: "En attente",
  information_requested: "Informations demandées",
  approved: "Acceptée",
  rejected: "Refusée",
};

export default function MembershipRequests() {
  const { user, hasCapability, hasRole } = useAuth();
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [decisionNotes, setDecisionNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const canReview = hasCapability("members.review_membership");
  const isMember = hasRole("member");

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await membershipAPI.getAll());
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Les demandes d'adhésion n'ont pas pu être chargées."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitRequest = async (event) => {
    event.preventDefault();
    setBusyId("new");
    setError("");
    try {
      await membershipAPI.create({ message });
      setMessage("");
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "La demande n'a pas pu être envoyée."));
    } finally {
      setBusyId(null);
    }
  };

  const review = async (request, status) => {
    setBusyId(request.id);
    setError("");
    try {
      await membershipAPI.review(request.id, { status, decision_note: decisionNotes[request.id] || "" });
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError, "La décision n'a pas pu être enregistrée."));
    } finally {
      setBusyId(null);
    }
  };

  const hasOpenRequest = requests.some(({ status }) => ["pending", "information_requested"].includes(status));

  return (
    <section className="container-main py-12">
      <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Club DIA</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Adhésion au club</h1><p className="mt-2 text-slate-600">Suivez votre demande ou, si vous êtes habilité, examinez les candidatures.</p></div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {!canReview && !isMember && !hasOpenRequest && <form onSubmit={submitRequest} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Envoyer une demande</h2><p className="mt-2 text-sm leading-6 text-slate-600">Présentez brièvement vos intérêts et ce que vous souhaitez apprendre ou apporter au club.</p><label className="mt-5 block text-sm font-medium text-slate-700">Message<textarea maxLength={3000} rows={5} className="input-field mt-2" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Votre motivation (facultatif)" /></label><button disabled={busyId === "new"} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busyId === "new" ? "Envoi…" : "Envoyer ma demande"}</button></form>}
      {!canReview && isMember && <p className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">Votre compte possède déjà le rôle membre du Club DIA.</p>}
      {!canReview && hasOpenRequest && <p className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">Une demande est déjà en cours de traitement.</p>}

      <div className="mt-8 space-y-4" aria-live="polite">
        {loading ? <p className="py-10 text-center text-slate-500">Chargement des demandes…</p> : requests.length ? requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{canReview ? request.applicant : "Votre demande"}</h2>{canReview && <p className="mt-1 text-sm text-slate-500">{request.email}</p>}</div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statuses[request.status] || request.status}</span></div>
            {request.message && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{request.message}</p>}
            {request.decision_note && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Retour : {request.decision_note}</p>}
            <p className="mt-4 text-xs text-slate-500">Envoyée le {new Date(request.created_at).toLocaleDateString("fr-FR")}{request.decided_by ? ` · Traitée par ${request.decided_by}` : ""}</p>
            {canReview && ["pending", "information_requested"].includes(request.status) && <div className="mt-5 border-t border-slate-100 pt-4"><label className="block text-sm font-medium text-slate-700">Note de décision<textarea maxLength={2000} rows={2} className="input-field mt-2" value={decisionNotes[request.id] || ""} onChange={(event) => setDecisionNotes({ ...decisionNotes, [request.id]: event.target.value })} /></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busyId === request.id} onClick={() => review(request, "approved")} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Accepter</button><button type="button" disabled={busyId === request.id} onClick={() => review(request, "information_requested")} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50">Demander des informations</button><button type="button" disabled={busyId === request.id} onClick={() => review(request, "rejected")} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 disabled:opacity-50">Refuser</button></div></div>}
          </article>
        )) : <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">Aucune demande enregistrée.</div>}
      </div>
    </section>
  );
}
