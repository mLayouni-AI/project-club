import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container-main py-16 text-center" role="status">Chargement de votre session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
