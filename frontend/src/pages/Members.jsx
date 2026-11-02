import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function Members() {
  const { user, members, addMember, removeMember, updateMember } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", role: "member", email: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", role: "", email: "" });

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  const filtered = useMemo(() => {
    return members.filter(
      (m) =>
        (m.first_name && m.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (m.last_name && m.last_name.toLowerCase().includes(search.toLowerCase())) ||
        (m.role && m.role.toLowerCase().includes(search.toLowerCase())) ||
        (m.email && m.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [members, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) return;
    
    // Check if user is admin before allowing add
    if (!isAdmin) {
      setError("Only administrators can add members.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const memberData = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role
      };
      
      await addMember(memberData);
      setForm({ first_name: "", last_name: "", role: "member", email: "" });
      setSuccess("Member added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Check if it's a permission error
      if (err.response?.status === 403) {
        setError("Permission denied: Only administrators can add members.");
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError("Unable to connect to server. Changes will be saved locally.");
      } else {
        setError("Failed to add member: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    // Check if user is admin before allowing delete
    if (!isAdmin) {
      setError("Only administrators can remove members.");
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      await removeMember(id);
      setSuccess("Member removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Check if it's a permission error
      if (err.response?.status === 403) {
        setError("Permission denied: Only administrators can remove members.");
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError("Unable to connect to server. Changes will be saved locally.");
      } else {
        setError("Failed to remove member: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  const startEdit = (member) => {
    setEditingMember(member.id);
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      role: member.role,
      email: member.email
    });
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setEditForm({ first_name: "", last_name: "", role: "", email: "" });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError("Only administrators can edit members.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await updateMember(editingMember, editForm);
      setSuccess("Member updated successfully!");
      setEditingMember(null);
      setEditForm({ first_name: "", last_name: "", role: "", email: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Check if it's a permission error
      if (err.response?.status === 403) {
        setError("Permission denied: Only administrators can edit members.");
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError("Unable to connect to server. Changes will be saved locally.");
      } else {
        setError("Failed to update member: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
              Membres du Club
            </h2>
            {!isAdmin && (
              <p className="text-sm text-[--color-text-secondary]">
                Accès en lecture seule · Seuls les administrateurs peuvent ajouter, modifier ou supprimer des membres
              </p>
            )}
          </div>
          <div className="text-sm text-[--color-text-secondary]">
            {filtered.length} {filtered.length === 1 ? "membre" : "membres"} trouvé(s)
          </div>
        </div>

        <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-6 card mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 lg:max-w-xs">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des membres..."
                  className="input-field pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Only show add member button for admins */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="btn-primary flex items-center justify-center space-x-1"
                  onClick={() => document.getElementById('add-member-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Ajouter un membre</span>
                </button>
              </div>
            )}
          </div>

          {/* Only show add member form for admins */}
          {isAdmin && (
            <div id="add-member-form" className="mb-6">
              <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleAdd}>
                <input
                  type="text"
                  placeholder="Prénom"
                  className="input-field"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Nom"
                  className="input-field"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <select
                  className="input-field"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Administrateur</option>
                </select>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-1"
                  disabled={loading}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span>Ajouter</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
            
            {/* Edit member form - shown when editing */}
            {isAdmin && editingMember && (
              <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleEdit}>
                <input
                  type="text"
                  placeholder="Prénom"
                  className="input-field"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Nom"
                  className="input-field"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="input-field"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
                <select
                  className="input-field"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Administrateur</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn-primary flex items-center justify-center space-x-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Enregistrer</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-center space-x-1"
                    onClick={cancelEdit}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Annuler</span>
                  </button>
                </div>
              </form>
            )}
          
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
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-12 card text-center">
            <div className="text-gray-400 text-5xl mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[--color-text-primary] mb-1">Aucun membre trouvé</h3>
            <p className="text-[--color-text-secondary]">Essayez d'ajuster votre recherche ou d'ajouter un nouveau membre</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-6 card-hover" key={m.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-[--color-primary] bg-opacity-10 text-[--color-primary] rounded-full p-3 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[--color-text-primary]">{m.first_name} {m.last_name}</h3>
                      <p className="text-sm text-[--color-text-secondary]">
                        {m.role === 'admin' ? 'Administrateur' : 'Membre'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-[--color-text-secondary] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {m.email || "Aucun email fourni"}
                </div>
                
                {/* Only show edit/delete buttons for admins */}
                {isAdmin && (
                  <div className="flex justify-end space-x-2">
                    <button
                      className="btn-outline text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center space-x-1"
                      onClick={() => startEdit(m)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span>Modifier</span>
                    </button>
                    <button
                      className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1"
                      onClick={() => handleRemove(m.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}