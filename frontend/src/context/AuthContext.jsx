import React, { createContext, useContext, useState, useEffect } from "react";
import {
  dummyMembers,
  dummyProjects,
  dummyAnnouncements,
} from "../utils/dummyData";
import { authAPI, membersAPI, projectsAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from API on initial mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to load user from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        
        // Always try to load data from API first, regardless of authentication status
        // This allows us to use real data when available and fall back gracefully
        await fetchData();
      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to dummy data
        setMembers(dummyMembers);
        setProjects(dummyProjects);
        setAnnouncements(dummyAnnouncements);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Attempting to fetch data from API...');
      const [membersRes, projectsRes] = await Promise.all([
        membersAPI.getAll(),
        projectsAPI.getAll(),
        // Add events API when ready
      ]);
    
      console.log('Successfully fetched data from API');
      setMembers(membersRes.data);
      setProjects(projectsRes.data);
      // For announcements, we'll keep using dummy data for now
      setAnnouncements(dummyAnnouncements);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.log('API request timed out, using dummy data');
      } else if (error.message?.includes('Network Error')) {
        console.log('Network error occurred, using dummy data');
      } else {
        console.log('Unknown error occurred, using dummy data');
      }
      // Fallback to dummy data
      setMembers(dummyMembers);
      setProjects(dummyProjects);
      setAnnouncements(dummyAnnouncements);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password });
      const response = await authAPI.login({ email, password });
      
      console.log('Login response:', response);
      
      const userData = response.data.user;
      setUser(userData);
      
      // Save to localStorage
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Fetch fresh data
      await fetchData();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Invalid email or password';
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.confirm_password?.[0] ||
                          'Failed to create account. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setMembers([]);
    setProjects([]);
    setAnnouncements([]);
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // Add member
  const addMember = async (memberData) => {
    try {
      const response = await membersAPI.create(memberData);
      setMembers(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding member:', error);
      // Check if it's a timeout or network error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        // Create a mock member as fallback
        const mockMember = {
          id: Math.random().toString(36).substr(2, 9),
          ...memberData
        };
        setMembers(prev => [...prev, mockMember]);
        return mockMember;
      }
      throw error;
    }
  };

  // Remove member
  const removeMember = async (id) => {
    try {
      await membersAPI.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error removing member:', error);
      // Check if it's a timeout or network error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        // Remove the member locally as fallback
        setMembers(prev => prev.filter(m => m.id !== id));
        return;
      }
      throw error;
    }
  };

  // Update member
  const updateMember = async (id, memberData) => {
    try {
      const response = await membersAPI.update(id, memberData);
      setMembers(prev => prev.map(m => m.id === id ? response.data : m));
      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      // Check if it's a timeout or network error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        // Update the member locally as fallback
        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...memberData } : m));
        return { ...memberData, id };
      }
      throw error;
    }
  };

  // Add project
  const addProject = async (projectData) => {
    try {
      const response = await projectsAPI.create(projectData);
      setProjects(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error adding project:', error);
      // Check if it's a timeout or network error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        // Create a mock project as fallback
        const mockProject = {
          id: Math.random().toString(36).substr(2, 9),
          ...projectData,
          created_at: new Date().toISOString()
        };
        setProjects(prev => [...prev, mockProject]);
        return mockProject;
      }
      throw error;
    }
  };

  // Remove project
  const removeProject = async (id) => {
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error removing project:', error);
      // Check if it's a timeout or network error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        // Remove the project locally as fallback
        setProjects(prev => prev.filter(p => p.id !== id));
        return;
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        loading,
        members,
        setMembers,
        projects,
        setProjects,
        announcements,
        setAnnouncements,
        addMember,
        removeMember,
        updateMember,
        addProject,
        removeProject,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
