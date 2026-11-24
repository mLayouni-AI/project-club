import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  announcementsAPI,
  authAPI,
  clearTokens,
  dashboardAPI,
  errorMessage,
  eventsAPI,
  hasSessionToken,
  membersAPI,
  notificationsAPI,
  projectsAPI,
  saveTokens,
} from "../services/api";

const AuthContext = createContext(null);

function asList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

export function hasCapability(user, capability) {
  return Boolean(user?.is_superuser || user?.capabilities?.includes(capability));
}

export function hasRole(user, role) {
  return Boolean(user?.roles?.includes(role) || user?.role === role);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const fetchData = useCallback(async (currentUser) => {
    if (!currentUser) return;
    const requests = await Promise.allSettled([
      projectsAPI.getAll(),
      eventsAPI.getAll(),
      announcementsAPI.getAll(),
      notificationsAPI.getAll(),
      dashboardAPI.summary(),
      hasCapability(currentUser, "members.view_members") ? membersAPI.getAll() : Promise.resolve({ data: [] }),
    ]);

    const [projectResult, eventResult, announcementResult, notificationResult, dashboardResult, memberResult] = requests;
    setProjects(projectResult.status === "fulfilled" ? asList(projectResult.value) : []);
    setEvents(eventResult.status === "fulfilled" ? asList(eventResult.value) : []);
    setAnnouncements(announcementResult.status === "fulfilled" ? asList(announcementResult.value) : []);
    setNotifications(notificationResult.status === "fulfilled" ? asList(notificationResult.value) : []);
    setDashboard(dashboardResult.status === "fulfilled" ? dashboardResult.value.data : null);
    setMembers(memberResult.status === "fulfilled" ? asList(memberResult.value.data) : []);
    setDataError(requests.some((result) => result.status === "rejected")
      ? "Certaines données n'ont pas pu être chargées. Réessayez après avoir vérifié la connexion au serveur."
      : "");
  }, []);

  const clearUserSession = useCallback(() => {
    clearTokens();
    setUser(null);
    setMembers([]);
    setProjects([]);
    setEvents([]);
    setAnnouncements([]);
    setNotifications([]);
    setDashboard(null);
  }, []);

  useEffect(() => {
    const onSessionExpired = () => clearUserSession();
    window.addEventListener("myclub:session-expired", onSessionExpired);

    async function initialize() {
      try {
        // Remove credentials left behind by the previous prototype's persistent storage.
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("user");
        if (!hasSessionToken()) return;
        if (!sessionStorage.getItem("myclub.access")) {
          const refreshed = await authAPI.refresh(sessionStorage.getItem("myclub.refresh"));
          saveTokens(refreshed.data);
        }
        const response = await authAPI.me();
        setUser(response.data);
        await fetchData(response.data);
      } catch {
        clearUserSession();
      } finally {
        setLoading(false);
      }
    }

    initialize();
    return () => window.removeEventListener("myclub:session-expired", onSessionExpired);
  }, [clearUserSession, fetchData]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      saveTokens(response.data);
      setUser(response.data.user);
      await fetchData(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false, error: errorMessage(error, "Adresse e-mail ou mot de passe incorrect.") };
    }
  }, [fetchData]);

  const signup = useCallback(async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: errorMessage(error, "La création du compte a échoué.") };
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = sessionStorage.getItem("myclub.refresh");
    clearUserSession();
    if (refresh) {
      try {
        await authAPI.logout(refresh);
      } catch {
        // Local credentials have already been cleared; the server token expires on its configured schedule.
      }
    }
  }, [clearUserSession]);

  const addProject = useCallback(async (projectData) => {
    const response = await projectsAPI.create(projectData);
    setProjects((current) => [response.data, ...current]);
    return response.data;
  }, []);

  const removeProject = useCallback(async (id) => {
    await projectsAPI.delete(id);
    setProjects((current) => current.filter((project) => project.id !== id));
  }, []);

  const deactivateMember = useCallback(async (id) => {
    await membersAPI.deactivate(id);
    setMembers((current) => current.map((member) => member.id === id ? { ...member, is_active: false } : member));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    dataError,
    members,
    projects,
    events,
    announcements,
    notifications,
    dashboard,
    setMembers,
    setProjects,
    setEvents,
    setAnnouncements,
    setNotifications,
    fetchData: () => fetchData(user),
    login,
    signup,
    logout,
    addProject,
    removeProject,
    deactivateMember,
    hasCapability: (capability) => hasCapability(user, capability),
    hasRole: (role) => hasRole(user, role),
  }), [user, loading, dataError, members, projects, events, announcements, notifications, dashboard, fetchData, login, signup, logout, addProject, removeProject, deactivateMember]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous AuthProvider.");
  return context;
}
