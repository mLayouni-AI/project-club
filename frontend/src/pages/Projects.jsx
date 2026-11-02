import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { user, projects, addProject, removeProject } = useAuth();
  const [form, setForm] = useState({ name: "", description: "", status: "on hold" });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = 
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = filterStatus === "All" || (p.status && p.status === filterStatus);
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, filterStatus]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    // Check if user is admin before allowing add
    if (!isAdmin) {
      setError("Only administrators can add projects.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const projectData = {
        name: form.name,
        description: form.description,
        status: form.status
      };
      
      await addProject(projectData);
      setForm({ name: "", description: "", status: "on hold" });
      setSuccess("Projet ajouté avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Check if it's a permission error
      if (err.response?.status === 403) {
        setError("Permission refusée : Seuls les administrateurs peuvent ajouter des projets.");
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError("Impossible de se connecter au serveur. Les modifications seront enregistrées localement.");
      } else {
        setError("Échec de l'ajout du projet : " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    // Check if user is admin before allowing delete
    if (!isAdmin) {
      setError("Only administrators can remove projects.");
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      await removeProject(id);
      setSuccess("Projet supprimé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Check if it's a permission error
      if (err.response?.status === 403) {
        setError("Permission refusée : Seuls les administrateurs peuvent supprimer des projets.");
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError("Impossible de se connecter au serveur. Les modifications seront enregistrées localement.");
      } else {
        setError("Échec de la suppression du projet : " + (err.response?.data?.detail || err.message));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "on hold": return "bg-yellow-100 text-yellow-800";
      case "in progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "on hold": return "En attente";
      case "in progress": return "En cours";
      case "completed": return "Terminé";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--color-text-primary] mb-2">Projets</h1>
          <p className="text-[--color-text-secondary]">
            Gérer et suivre tous les projets du club
            {!isAdmin && " · Accès en lecture seule (Seuls les administrateurs peuvent ajouter/modifier/supprimer des projets)"}
          </p>
        </div>

        <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-6 card mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher des projets par titre ou description..."
                className="input-field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Tous les statuts</option>
                <option value="on hold">En attente</option>
                <option value="in progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
          </div>

          {/* Only show add project form for admins */}
          {isAdmin && (
            <form onSubmit={handleAdd} className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4 text-[--color-text-primary]">Ajouter un nouveau projet</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[--color-text-primary] mb-1">Nom du projet</label>
              <input
                type="text"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[--color-text-primary] mb-1">Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-[--color-text-primary] mb-1">Statut</label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="on hold">En attente</option>
                  <option value="in progress">En cours</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn-primary mt-6 sm:mt-0 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Ajout en cours...' : 'Ajouter le projet'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}
          </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-6 card-hover" key={p.id}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-[--color-text-primary]">{p.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-[--color-text-secondary] mb-2">{p.description || "Aucune description fournie"}</p>
                  <div className="flex items-center text-sm text-[--color-text-secondary]">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Créé : {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                {/* Only show delete button for admins */}
                {isAdmin && (
                  <div className="flex justify-end">
                    <button
                      className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
                      onClick={() => handleRemove(p.id)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-[--color-card-bg] rounded-2xl shadow-xl card">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-[--color-text-primary] mb-1">Aucun projet trouvé</h3>
              <p className="text-[--color-text-secondary]">Commencez par créer un nouveau projet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}