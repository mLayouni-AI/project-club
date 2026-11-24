import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Members from "./pages/Members";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Events from "./pages/Events";
import Announcements from "./pages/Announcements";
import MembershipRequests from "./pages/MembershipRequests";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import PasswordReset from "./pages/PasswordReset";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardMember from "./pages/DashboardMember";
import { AuthProvider, hasCapability, useAuth } from "./context/AuthContext";

function homeFor(user) {
  return hasCapability(user, "dashboard.view_all") || hasCapability(user, "members.manage_members")
    ? "/dashboard/admin"
    : "/dashboard/member";
}

function AuthPage({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

function CapabilityRoute({ capability, children }) {
  const { user } = useAuth();
  return hasCapability(user, capability) ? children : <Navigate to="/" replace />;
}

function DashboardRoleRoute({ children }) {
  const { user } = useAuth();
  const allowed = hasCapability(user, "members.manage_members") || hasCapability(user, "dashboard.view_all");
  return allowed ? children : <Navigate to="/" replace />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user)} replace /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[--color-background-light] flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/login" element={<AuthPage><Login /></AuthPage>} />
          <Route path="/signup" element={<AuthPage><Signup /></AuthPage>} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardRoleRoute><DashboardAdmin /></DashboardRoleRoute></ProtectedRoute>} />
          <Route path="/dashboard/member" element={<ProtectedRoute><DashboardMember /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><CapabilityRoute capability="members.view_members"><Members /></CapabilityRoute></ProtectedRoute>} />
          <Route path="/membership" element={<ProtectedRoute><MembershipRequests /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideNavbar && <Footer />}
    </div>
  );
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>;
}
