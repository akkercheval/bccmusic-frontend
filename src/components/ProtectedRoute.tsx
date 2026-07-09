import { Navigate } from "react-router-dom";
import { type JSX } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute wraps child routes and redirects to login
 * if the user is not authenticated (based on AuthContext).
 *
 * Note: Most routes use PrivateLayout instead. This component
 * is available for one-off protected routes outside the layout.
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
