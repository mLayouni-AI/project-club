import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, projectsAPI } from "../services/api";

/* ─── helpers ─────────────────────────────────────────────────── */
const domains = {
  web: "Application web", mobile: "Application mobile", ai: "Intelligence artificielle",
  data_science: "Data science", networks: "Réseaux", automation: "Automatisation",
  cybersecurity: "Cybersécurité", other: "Autre",
};
const statuses = {
  idea: "Idée", proposed: "Proposé", approved: "Validé", planned: "Planifié",
  in_progress: "En cours", in_review: "En revue", completed: "Terminé",
  suspended: "Suspendu", cancelled: "Annulé",
};
const taskStatuses = {
  todo: "À faire", in_progress: "En cours", in_review: "En revue",
  done: "Terminée", blocked: "Bloquée",
};
const milestoneStatuses = {
  pending: "En attente",
  completed: "Terminé",
};
const memberRoles = {
  lead: "Chef de projet", member: "Membre", supervisor: "Encadrant",
};

const statusColor = (s) => ({
  idea: "bg-slate-100 text-slate-700",
  proposed: "bg-blue-100 text-blue-800",
  approved: "bg-cyan-100 text-cyan-800",
  planned: "bg-violet-100 text-violet-700",
  in_progress: "bg-amber-100 text-amber-800",
  in_review: "bg-orange-100 text-orange-800",
  completed: "bg-emerald-100 text-emerald-800",
  suspended: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-700",
}[s] ?? "bg-slate-100 text-slate-700");

const milestoneColor = (s) => ({
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  delayed: "bg-red-100 text-red-700",
}[s] ?? "bg-slate-100 text-slate-700");

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const TABS = ["Équipe", "Jalons", "Tâches", "Livrables", "Commentaires"];

/* ─── subcomponents ────────────────────────────────────────────── */
function Badge({ label, color }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

function SectionTitle({ children }) {
  return <h3 className="mt-6 mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">{children}</h3>;
}

function EmptySlate({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

/* ─── tabs ─────────────────────────────────────────────────────── */
function TeamTab({ projectId, canManage }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ user: "", role: "member" });
  const [allMembers, setAllMembers] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getMemberships(projectId);
      setMembers(Array.isArray(res) ? res : res.results ?? []);
    } catch (e) {
      setError(errorMessage(e, "Impossible de charger l'équipe."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Load available users for the add-member form (only if admin/lead)
  useEffect(() => {
    if (!canManage) return;
    projectsAPI.getMembershipCandidates(projectId).then((res) => {
      setAllMembers(Array.isArray(res) ? res : res.results ?? []);
    }).catch(() => {});
  }, [canManage, projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await projectsAPI.addMembership(projectId, form);
      setForm({ user: "", role: "member" });
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible d'ajouter ce membre."));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (membershipId) => {
    if (!window.confirm("Retirer ce membre du projet ?")) return;
    setBusy(true);
    setError("");
    try {
      await projectsAPI.removeMembership(projectId, membershipId);
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible de retirer ce membre."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-8 text-center text-slate-500">Chargement de l'équipe…</p>;

  return (
    <div>
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {members.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-semibold text-slate-900">{m.user_name || `#${m.user}`}</p>
                <p className="mt-0.5 text-sm text-slate-500">{memberRoles[m.role] || m.role}</p>
              </div>
              {canManage && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemove(m.id)}
                  className="text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                >
                  Retirer
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : <EmptySlate message="Aucun membre assigné à ce projet." />}

      {canManage && (
        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-900">Ajouter un membre</summary>
          <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Membre
              <select
                required
                className="input-field mt-2"
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
              >
                <option value="">Choisir un membre</option>
                {allMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Rôle
              <select
                className="input-field mt-2"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {Object.entries(memberRoles).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-3">
              <button
                disabled={busy}
                className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Ajout…" : "Ajouter"}
              </button>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}

function MilestonesTab({ projectId, canManage }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getMilestones(projectId);
      setMilestones(Array.isArray(res) ? res : res.results ?? []);
    } catch (e) {
      setError(errorMessage(e, "Impossible de charger les jalons."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.due_date) delete payload.due_date;
      await projectsAPI.createMilestone(projectId, payload);
      setForm({ title: "", description: "", due_date: "" });
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible de créer ce jalon."));
    } finally {
      setBusy(false);
    }
  };

  const setCompletion = async (milestone) => {
    setBusy(true);
    setError("");
    try {
      if (milestone.completed_at) await projectsAPI.reopenMilestone(milestone.id);
      else await projectsAPI.completeMilestone(milestone.id);
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible de mettre à jour ce jalon."));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce jalon ?")) return;
    setBusy(true);
    try {
      await projectsAPI.deleteMilestone(projectId, id);
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible de supprimer ce jalon."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-8 text-center text-slate-500">Chargement des jalons…</p>;

  return (
    <div>
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {milestones.length ? (
        <ul className="space-y-3">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  <Badge label={milestoneStatuses[m.completed_at ? "completed" : "pending"]} color={milestoneColor(m.completed_at ? "completed" : "pending")} />
                </div>
                {m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}
                <p className="mt-2 text-xs text-slate-400">Échéance : {fmt(m.due_date)}</p>
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-3">
                  <button type="button" disabled={busy} onClick={() => setCompletion(m)} className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50">
                    {m.completed_at ? "Rouvrir" : "Terminer"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => handleDelete(m.id)} className="text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <EmptySlate message="Aucun jalon défini pour ce projet." />}

      {canManage && (
        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-900">Ajouter un jalon</summary>
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Titre
              <input required maxLength={200} className="input-field mt-2" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <p className="self-end text-sm text-slate-500">Le jalon démarre en attente et peut être marqué comme terminé après sa création.</p>
            <label className="text-sm font-medium text-slate-700">
              Échéance
              <input type="date" className="input-field mt-2" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <textarea rows={2} maxLength={2000} className="input-field mt-2" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="md:col-span-2">
              <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? "Création…" : "Créer le jalon"}
              </button>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}

function TasksTab({ projectId, tasks, canManageTasks, user, onTaskUpdated }) {
  const projectTasks = tasks.filter((t) => String(t.project) === String(projectId));

  if (!projectTasks.length) return <EmptySlate message="Aucune tâche pour ce projet." />;

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {projectTasks.map((task) => {
        const canUpdate = canManageTasks || task.assignee === user?.id;
        return (
          <li key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{task.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {task.assignee_name ? task.assignee_name : "Non attribuée"}
                {task.due_date ? ` · Échéance ${fmt(task.due_date)}` : ""}
              </p>
              {task.description && (
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{task.description}</p>
              )}
            </div>
            <div className="shrink-0">
              <Badge
                label={taskStatuses[task.status] || task.status}
                color={{
                  todo: "bg-slate-100 text-slate-700",
                  in_progress: "bg-amber-100 text-amber-800",
                  in_review: "bg-orange-100 text-orange-800",
                  done: "bg-emerald-100 text-emerald-800",
                  blocked: "bg-red-100 text-red-700",
                }[task.status] ?? "bg-slate-100 text-slate-700"}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FilesTab({ projectId, canManage }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getFiles(projectId);
      setFiles(Array.isArray(res) ? res : res.results ?? []);
    } catch (e) {
      setError(errorMessage(e, "Impossible de charger les livrables."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await projectsAPI.uploadFile(projectId, file);
      fileRef.current.value = "";
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible de téléverser le fichier."));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Supprimer ce livrable ?")) return;
    setError("");
    try {
      await projectsAPI.deleteFile(projectId, fileId);
      await load();
    } catch (e) {
      setError(errorMessage(e, "Impossible de supprimer ce livrable."));
    }
  };

  const handleDownload = async (file) => {
    setError("");
    try {
      const response = await projectsAPI.downloadFile(file.id);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.original_name || "livrable";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(errorMessage(e, "Impossible de télécharger ce livrable."));
    }
  };

  if (loading) return <p className="py-8 text-center text-slate-500">Chargement des livrables…</p>;

  return (
    <div>
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {files.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{f.original_name}</p>
                <p className="text-xs text-slate-400">
                  {f.uploaded_by_name && `Par ${f.uploaded_by_name} · `}
                  {f.created_at ? new Date(f.created_at).toLocaleDateString("fr-FR") : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleDownload(f)} className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">Télécharger</button>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="text-sm font-semibold text-red-700 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptySlate message="Aucun livrable déposé pour ce projet." />}

      {canManage && (
        <form onSubmit={handleUpload} className="mt-5 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            aria-label="Fichier à téléverser"
            accept=".pdf,.png,.jpg,.jpeg,.csv,.docx,.xlsx"
            className="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? "Envoi…" : "Déposer"}
          </button>
        </form>
      )}
    </div>
  );
}

function CommentsTab({ projectId }) {
  const { user } = useAuth();
  // We display task comments for all tasks of this project
  // Load tasks first, then pick a task to view its comments
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    projectsAPI.tasks({ project: projectId }).then((res) => {
      const t = Array.isArray(res) ? res : res.results ?? [];
      const filtered = t.filter((task) => String(task.project) === String(projectId));
      setTasks(filtered);
      if (filtered.length) setSelectedTask(String(filtered[0].id));
    }).catch(() => {});
  }, [projectId]);

  const loadComments = useCallback(async () => {
    if (!selectedTask) return;
    setLoading(true);
    setError("");
    try {
      const res = await projectsAPI.getTaskComments(selectedTask);
      setComments(Array.isArray(res) ? res : res.results ?? []);
    } catch (e) {
      setError(errorMessage(e, "Impossible de charger les commentaires."));
    } finally {
      setLoading(false);
    }
  }, [selectedTask]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedTask) return;
    setPosting(true);
    setError("");
    try {
      await projectsAPI.addTaskComment(selectedTask, { content: text });
      setText("");
      await loadComments();
    } catch (e) {
      setError(errorMessage(e, "Impossible de poster le commentaire."));
    } finally {
      setPosting(false);
    }
  };

  if (!tasks.length) return <EmptySlate message="Aucune tâche dans ce projet pour laisser des commentaires." />;

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        Tâche concernée
        <select
          className="input-field mt-2"
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
        >
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </label>

      {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {loading ? (
        <p className="mt-5 text-sm text-slate-500">Chargement…</p>
      ) : comments.length ? (
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{c.author_name || c.author_email || `#${c.author}`}</p>
                <time className="text-xs text-slate-400">
                  {c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{c.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-slate-500">Aucun commentaire pour cette tâche.</p>
      )}

      {user && (
        <form onSubmit={handlePost} className="mt-5">
          <label className="text-sm font-medium text-slate-700">
            Votre commentaire
            <textarea
              required
              rows={3}
              maxLength={2000}
              className="input-field mt-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Rédigez votre commentaire…"
            />
          </label>
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="mt-3 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {posting ? "Envoi…" : "Publier"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────── */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, hasCapability } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const canManage = hasCapability("projects.manage_projects") || hasCapability("projects.manage_team");
  const canManageTasks = hasCapability("projects.manage_tasks") || canManage;

  useEffect(() => {
    if (authLoading) return undefined;
    let current = true;
    setLoading(true);
    setError("");
    Promise.all([
      projectsAPI.getById(id),
      user ? projectsAPI.tasks({ page: 1, project: id }) : Promise.resolve({ results: [] }),
    ]).then(([proj, taskRes]) => {
      if (!current) return;
      setProject(proj.data ?? proj);
      const all = Array.isArray(taskRes) ? taskRes : taskRes.results ?? taskRes.data?.results ?? [];
      setTasks(all);
    }).catch((e) => {
      if (!current) return;
      setError(errorMessage(e, "Ce projet est introuvable ou inaccessible."));
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id, user, authLoading]);

  if (loading) return (
    <section className="container-main py-16 text-center text-slate-500">Chargement du projet…</section>
  );

  if (error || !project) return (
    <section className="container-main py-16 text-center">
      <p className="mb-6 text-red-700">{error || "Projet introuvable."}</p>
      <Link to="/projects" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
        ← Retour aux projets
      </Link>
    </section>
  );

  return (
    <section className="container-main py-10">
      {/* breadcrumb */}
      <nav className="mb-6 text-sm" aria-label="Fil d'Ariane">
        <Link to="/projects" className="font-medium text-emerald-700 hover:text-emerald-900">Projets</Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-600">{project.name}</span>
      </nav>

      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-950">{project.name}</h1>
            <Badge label={statuses[project.status] || project.status} color={statusColor(project.status)} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {domains[project.domain] || project.domain}
            {project.lead_name ? ` · Responsable : ${project.lead_name}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Retour
        </button>
      </div>

      {/* meta grid */}
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Membres</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{project.member_count ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tâches</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{project.task_count ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Échéance</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{fmt(project.due_date)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Créé le</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {project.created_at ? new Date(project.created_at).toLocaleDateString("fr-FR") : "—"}
          </dd>
        </div>
      </dl>

      {/* description */}
      {project.description && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle>Description</SectionTitle>
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{project.description}</p>
        </div>
      )}

      {/* objectives */}
      {project.objectives && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle>Objectifs</SectionTitle>
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{project.objectives}</p>
        </div>
      )}

      {/* tabs — only shown to authenticated users */}
      {user && (
        <div className="mt-10">
          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === i
                    ? "border-b-2 border-emerald-700 text-emerald-700"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === 0 && <TeamTab projectId={id} canManage={canManage} />}
            {activeTab === 1 && <MilestonesTab projectId={id} canManage={canManage} />}
            {activeTab === 2 && (
              <TasksTab
                projectId={id}
                tasks={tasks}
                canManageTasks={canManageTasks}
                user={user}
              />
            )}
            {activeTab === 3 && <FilesTab projectId={id} canManage={canManage} />}
            {activeTab === 4 && <CommentsTab projectId={id} />}
          </div>
        </div>
      )}
    </section>
  );
}
