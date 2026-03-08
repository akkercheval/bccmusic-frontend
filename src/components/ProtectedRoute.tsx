import { Navigate } from "react-router-dom";
import { type JSX } from "react";
import { useEffect, useState } from "react";
import api from "../services/api";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get("/api/auth/status")
      .then((res) => setIsAuth(res.data.authenticated))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Loading...</div>;
  if (!isAuth) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
