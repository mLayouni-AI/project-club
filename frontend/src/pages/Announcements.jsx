import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Announcements() {
  const { user, announcements, setAnnouncements } = useAuth();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  const handleAdd = (e) => {
    e.preventDefault();
    if (!text) return;
    setAnnouncements([...announcements, { 
      id: Date.now(), 
      text,
      title: title || "Annonce",
      priority,
      date: new Date().toLocaleDateString(),
      author: "Administrateur"
    }]);
    setText("");
    setTitle("");
    setPriority("normal");
  };

  const handleRemove = (id) => {
    // Check if user is admin before allowing delete
    if (!isAdmin) {
      setError("Seuls les administrateurs peuvent supprimer des annonces.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setError("");
    setSuccess("");
    
    setAnnouncements(announcements.filter((a) => a.id !== id));
    setSuccess("Annonce supprimée avec succès !");
    setTimeout(() => setSuccess(""), 3000);
  };

  const filteredAnnouncements = announcements.filter(a => 
    (a.text && a.text.toLowerCase().includes(search.toLowerCase())) ||
    (a.title && a.title.toLowerCase().includes(search.toLowerCase()))
  );

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "normal":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Haute priorité";
      case "medium":
        return "Priorité moyenne";
      case "normal":
      default:
        return "Standard";
    }
  };

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--color-text-primary] mb-2">Annonces</h1>
          <p className="text-[--color-text-secondary]">Partager les mises à jour importantes et les nouvelles avec les membres du club</p>
        </div>

        <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-6 card mb-8">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Rechercher des annonces..."
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Only show create announcement form for admins */}
          {isAdmin && (
            <form onSubmit={handleAdd} className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4 text-[--color-text-primary]">Créer une nouvelle annonce</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[--color-text-primary] mb-1">Titre</label>
              <input
                type="text"
                className="input-field"
                placeholder="Titre de l'annonce"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[--color-text-primary] mb-1">Message</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Écrivez votre annonce ici..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-[--color-text-primary] mb-1">Priorité</label>
                <select
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="normal">Standard</option>
                  <option value="medium">Priorité moyenne</option>
                  <option value="high">Haute priorité</option>
                </select>
              </div>
              <button type="submit" className="btn-primary mt-6 sm:mt-0">Publier l'annonce</button>
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

        <div className="space-y-6">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((a) => (
              <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-6 card" key={a.id}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-[--color-text-primary]">{a.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(a.priority)}`}>
                      {getPriorityLabel(a.priority)}
                    </span>
                    {/* Only show delete button for admins */}
                    {isAdmin && (
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleRemove(a.id)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-[--color-text-secondary] mb-4">{a.text}</div>
                
                <div className="flex items-center text-sm text-[--color-text-secondary] border-t border-gray-200 pt-3">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {a.date}
                  <span className="mx-2">•</span>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {a.author}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-[--color-card-bg] rounded-2xl shadow-xl card">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <h3 className="text-lg font-medium text-[--color-text-primary] mb-1">Aucune annonce trouvée</h3>
              <p className="text-[--color-text-secondary]">Créez votre première annonce pour la partager avec les membres du club.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}