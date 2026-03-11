import { Outlet, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const PrivateLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null; // will redirect immediately

  return (
    <div>
      <NavBar />
      <main style={{ paddingTop: "80px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default PrivateLayout;
