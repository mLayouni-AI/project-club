import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, projectsAPI } from "../services/api";

const statuses = {
  idea: "Idée", proposed: "Proposé", approved: "Validé", planned: "Planifié",
  in_progress: "En cours", in_review: "En revue", completed: "Terminé", suspended: "Suspendu", cancelled: "Annulé",
};
const taskStatuses = {
  todo: "À faire", in_progress: "En cours", in_review: "En revue", done: "Terminée", blocked: "Bloquée",
};

function TaskBoard({ tasks, user, canManageTasks, busyId, onStatusChange }) {
  return (
    <div className="mt-5 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Object.entries(taskStatuses).map(([status, label]) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section key={status} aria-labelledby={`task-column-${status}`} className="min-w-0 rounded-2xl bg-slate-50 p-3">
            <header className="flex items-center justify-between gap-2 px-1 pb-3">
              <h3 id={`task-column-${status}`} className="text-sm font-semibold text-slate-800">{label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{columnTasks.length}</span>
            </header>
            <ul className="space-y-3">
              {columnTasks.map((task) => {
                const canUpdate = canManageTasks || task.assignee === user?.id;
                return (
                  <li key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{task.project_name}{task.assignee_name ? ` · ${task.assignee_name}` : " · Non attribuée"}</p>
                    {task.due_date && <p className="mt-2 text-xs text-slate-500">Échéance {new Date(`${task.due_date}T00:00:00`).toLocaleDateString("fr-FR")}</p>}
                    {task.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{task.description}</p>}
                    <label className="mt-3 block text-xs font-medium text-slate-600">
                      Déplacer vers
                      <select aria-label={`Statut de ${task.title}`} disabled={!canUpdate || busyId === task.id} className="input-field mt-1 py-2 text-sm" value={task.status} onChange={(event) => onStatusChange(task, event.target.value)}>
                        {Object.entries(taskStatuses).map(([value, statusLabel]) => <option key={value} value={value}>{statusLabel}</option>)}
                      </select>
                    </label>
                  </li>
                );
              })}
              {!columnTasks.length && <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Aucune tâche</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function Projects() {
  const { user, hasCapability } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState({ name: "", description: "", domain: "other", objectives: "" });
  const [tasks, setTasks] = useState([]);
  const [taskPage, setTaskPage] = useState({ count: 0, next: null, previous: null, number: 1 });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [taskBusyId, setTaskBusyId] = useState(null);
  const [taskForm, setTaskForm] = useState({ project: "", title: "", description: "", due_date: "" });
  const canPropose = hasCapability("projects.propose_project") || hasCapability("projects.manage_projects");
  const canManage = hasCapability("projects.manage_projects");
  const canManageTasks = hasCapability("projects.manage_tasks") || canManage;

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      setProjects(await projectsAPI.getAll());
    } catch (requestError) {
      setError(errorMessage(requestError, "Les projets ne sont pas disponibles pour le moment."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const loadTasks = async (page = 1) => {
    if (!user) return;
    setTaskLoading(true);
    setTaskError("");
    try {
      const response = await projectsAPI.tasks({ page });
      setTasks(response.results || response);
      setTaskPage({ count: response.count ?? response.length, next: response.next ?? null, previous: response.previous ?? null, number: page });
    } catch (requestError) {
      setTaskError(errorMessage(requestError, "Les tâches ne sont pas disponibles pour le moment."));
    } finally {
      setTaskLoading(false);
    }
  };

  useEffect(() => { if (user) loadTasks(); }, [user]);

  const filtered = useMemo(() => projects.filter((project) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || `${project.name} ${project.description} ${project.domain}`.toLowerCase().includes(query);
    return matchesQuery && (status === "all" || project.status === status);
  }), [projects, search, status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await projectsAPI.create(form);
      setForm({ name: "", description: "", domain: "other", objectives: "" });
      await loadProjects();
    } catch (requestError) {
      setError(errorMessage(requestError, "La proposition n'a pas pu être enregistrée."));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Supprimer le projet « ${project.name} » ? Cette action retire aussi ses tâches et livrables.`)) return;
    setBusy(true);
    setError("");
    try {
      await projectsAPI.delete(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (requestError) {
      setError(errorMessage(requestError, "Le projet n'a pas pu être supprimé."));
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    setTaskBusyId("new");
    setTaskError("");
    try {
      const payload = { ...taskForm };
      if (!payload.due_date) delete payload.due_date;
      await projectsAPI.createTask(payload);
      setTaskForm({ project: "", title: "", description: "", due_date: "" });
      await loadTasks(1);
    } catch (requestError) {
      setTaskError(errorMessage(requestError, "La tâche n'a pas pu être créée."));
    } finally {
      setTaskBusyId(null);
    }
  };

  const updateTaskStatus = async (task, nextStatus) => {
    setTaskBusyId(task.id);
    setTaskError("");
    try {
      const response = await projectsAPI.updateTask(task.id, { status: nextStatus });
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...response.data } : item));
    } catch (requestError) {
      setTaskError(errorMessage(requestError, "Le statut de la tâche n'a pas pu être modifié."));
    } finally {
      setTaskBusyId(null);
    }
  };

  return (
    <section className="container-main py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Club DIA</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Projets</h1><p className="mt-2 max-w-2xl text-slate-600">Les applications développées par les équipes sont suivies ici, avec leurs objectifs et leur avancement.</p></div>
        {user && <Link to="/dashboard" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">Retour à mon espace →</Link>}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_13rem]">
        <label className="text-sm font-medium text-slate-700">Rechercher<input className="input-field mt-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, description ou domaine" /></label>
        <label className="text-sm font-medium text-slate-700">Statut<select className="input-field mt-2" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      {canPropose && (
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-900">Proposer un projet</summary>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Titre<input required maxLength={200} className="input-field mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Domaine<select className="input-field mt-2" value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })}><option value="web">Application web</option><option value="mobile">Application mobile</option><option value="ai">Intelligence artificielle</option><option value="data_science">Data science</option><option value="networks">Réseaux</option><option value="automation">Automatisation</option><option value="cybersecurity">Cybersécurité</option><option value="other">Autre</option></select></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Description<textarea required maxLength={6000} rows={3} className="input-field mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Objectifs<textarea maxLength={4000} rows={2} className="input-field mt-2" value={form.objectives} onChange={(event) => setForm({ ...form, objectives: event.target.value })} /></label>
            <div className="md:col-span-2"><button className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60" disabled={busy}>{busy ? "Enregistrement…" : "Envoyer la proposition"}</button></div>
          </form>
        </details>
      )}

      {user && (
        <section className="mt-12" aria-labelledby="project-tasks-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">Travail d'équipe</p><h2 id="project-tasks-title" className="mt-1 text-2xl font-bold text-slate-950">Tâches de projet</h2><p className="mt-1 text-sm text-slate-600">{taskPage.count} tâche(s) accessibles à votre compte.</p></div>
          </div>
          {canManageTasks && <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer font-semibold text-slate-900">Créer une tâche</summary><form onSubmit={createTask} className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-700">Projet<select required className="input-field mt-2" value={taskForm.project} onChange={(event) => setTaskForm({ ...taskForm, project: event.target.value })}><option value="">Choisir un projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Échéance<input type="date" className="input-field mt-2" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} /></label><label className="text-sm font-medium text-slate-700 md:col-span-2">Titre<input required maxLength={200} className="input-field mt-2" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label><label className="text-sm font-medium text-slate-700 md:col-span-2">Description<textarea maxLength={6000} rows={3} className="input-field mt-2" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} /></label><button disabled={taskBusyId === "new"} className="w-fit rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{taskBusyId === "new" ? "Enregistrement…" : "Créer la tâche"}</button></form></details>}
          {taskError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{taskError}</p>}
          {taskLoading ? <p className="py-8 text-center text-slate-500">Chargement des tâches…</p> : tasks.length ? <><TaskBoard tasks={tasks} user={user} canManageTasks={canManageTasks} busyId={taskBusyId} onStatusChange={updateTaskStatus} /><div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><button type="button" disabled={!taskPage.previous || taskLoading} onClick={() => loadTasks(Math.max(1, taskPage.number - 1))} className="font-semibold text-emerald-700 disabled:text-slate-400">← Précédent</button><span className="text-slate-500">Page {taskPage.number}</span><button type="button" disabled={!taskPage.next || taskLoading} onClick={() => loadTasks(taskPage.number + 1)} className="font-semibold text-emerald-700 disabled:text-slate-400">Suivant →</button></div></> : <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Aucune tâche enregistrée pour les projets auxquels vous avez accès.</p>}
        </section>
      )}

      <div className="mt-8" aria-live="polite">
        {loading ? <p className="py-12 text-center text-slate-500">Chargement des projets…</p> : filtered.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <article key={project.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-slate-950">{project.name}</h2><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{statuses[project.status] || project.status}</span></div>
                <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">{project.description || "Aucune description publiée."}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm"><div><dt className="text-slate-500">Domaine</dt><dd className="mt-1 font-medium text-slate-800">{project.domain}</dd></div><div><dt className="text-slate-500">Échéance</dt><dd className="mt-1 font-medium text-slate-800">{project.due_date ? new Date(`${project.due_date}T00:00:00`).toLocaleDateString("fr-FR") : "Non définie"}</dd></div><div><dt className="text-slate-500">Équipe</dt><dd className="mt-1 font-medium text-slate-800">{project.member_count ?? 0} membre(s)</dd></div><div><dt className="text-slate-500">Tâches</dt><dd className="mt-1 font-medium text-slate-800">{project.task_count ?? 0}</dd></div><div><dt className="text-slate-500">Responsable</dt><dd className="mt-1 font-medium text-slate-800">{project.lead_name || "À désigner"}</dd></div></dl>
                <Link to={`/projects/${project.id}`} className="mt-4 self-start text-sm font-semibold text-emerald-700 hover:text-emerald-900">Ouvrir le projet →</Link>
                {canManage && <button type="button" disabled={busy} onClick={() => handleDelete(project)} className="mt-4 self-start text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">Supprimer le projet</button>}
              </article>
            ))}
          </div>
        ) : <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center"><h2 className="font-semibold text-slate-800">Aucun projet à afficher</h2><p className="mt-2 text-sm text-slate-500">Modifiez les filtres ou revenez plus tard.</p></div>}
      </div>
    </section>
  );
}
