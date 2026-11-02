import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import About from "./pages/About";
import Members from "./pages/Members";
import Projects from "./pages/Projects";
import Announcements from "./pages/Announcements";
import Contact from "./pages/Contact";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardMember from "./pages/DashboardMember";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";

// Component to redirect logged-in users from login/signup to dashboard
function PublicRoute({ children }) {
  const { user } = useAuth();
  
  if (user) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/member';
    return <Navigate to={dashboardPath} replace />;
  }
  
  return children;
}

// Component to redirect to appropriate dashboard based on role
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const dashboardPath = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/member';
  return <Navigate to={dashboardPath} replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Hide navbar on login and signup pages
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />

          {/* Root path redirects to appropriate dashboard */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          {/* Landing page route - can be accessed directly but is protected */}
          <Route path="/landing" element={
            <ProtectedRoute>
              <Landing />
            </ProtectedRoute>
          } />

          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard/member"
            element={
              <ProtectedRoute>
                <DashboardMember />
              </ProtectedRoute>
            }
          />

          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect to login by default when app starts */}
          <Route path="" element={<Navigate to="/login" replace />} />
          
          {/* Redirect any unknown route to login if not authenticated, dashboard if authenticated */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </main>
      {!hideNavbar && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
