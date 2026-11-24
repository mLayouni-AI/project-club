import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, notificationsAPI } from "../services/api";

const destinations = {
  membership_request: "/membership",
  announcement: "/announcements",
  project: "/projects",
  task: "/dashboard",
  event: "/events",
};

export default function Notifications() {
  const { notifications, setNotifications } = useAuth();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const unread = notifications.filter((item) => !item.read_at);

  const markRead = async (item) => {
    setBusyId(item.id);
    setError("");
    try {
      const response = await notificationsAPI.markRead(item.id);
      setNotifications((current) => current.map((notification) => notification.id === item.id ? response.data : notification));
    } catch (requestError) {
      setError(errorMessage(requestError, "La notification n'a pas pu être mise à jour."));
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId("all");
    setError("");
    try {
      await notificationsAPI.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.read_at ? item : { ...item, read_at: readAt }));
    } catch (requestError) {
      setError(errorMessage(requestError, "Les notifications n'ont pas pu être mises à jour."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="container-main py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Votre espace</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Notifications</h1><p className="mt-2 text-slate-600">{unread.length} non lue(s)</p></div>{unread.length > 0 && <button type="button" disabled={busyId === "all"} onClick={markAllRead} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Tout marquer comme lu</button>}</div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <div className="mt-8 space-y-3">{notifications.length ? notifications.map((item) => <article key={item.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${item.read_at ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50/60"}`}><div className="min-w-0 flex-1"><h2 className="font-semibold text-slate-950">{item.title}</h2><p className="mt-1 whitespace-pre-line text-sm text-slate-700">{item.message}</p><p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString("fr-FR")}{item.read_at ? " · Lue" : " · Non lue"}</p></div><div className="flex shrink-0 items-center gap-3">{destinations[item.resource_type] && <Link to={destinations[item.resource_type]} className="text-sm font-semibold text-emerald-700">Ouvrir</Link>}{!item.read_at && <button type="button" disabled={busyId === item.id} onClick={() => markRead(item)} className="text-sm font-semibold text-slate-700 disabled:opacity-50">Marquer comme lue</button>}</div></article>) : <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center"><h2 className="font-semibold text-slate-800">Aucune notification</h2><p className="mt-2 text-sm text-slate-500">Les mises à jour de vos activités apparaîtront ici.</p></div>}</div>
    </section>
  );
}
