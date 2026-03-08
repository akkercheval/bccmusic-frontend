import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import { useAuth } from "../context/AuthContext";

const PrivateLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Redirecting to login...</div>;

  return (
    <div>
      <NavBar />
      <main style={{ paddingTop: "80px" }}>
        {" "}
        <Outlet />
      </main>
    </div>
  );
};

export default PrivateLayout;
