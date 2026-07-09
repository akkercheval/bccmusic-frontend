import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import api from "../services/api";
import PageTitle from "../components/PageTitle";
import "./Dashboard.css";

interface NavCard {
  icon: string;
  label: string;
  description: string;
  path: string;
}

export default function Dashboard() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  const isOwner = user.accountType === "OWNER";
  const isCollaborator = user.accountType === "COLLABORATOR";
  const isAdmin = user.accountType === "ADMINISTRATOR";

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      refreshUser();
      navigate("/login?logout=success");
    } catch (err) {
      console.error("Logout failed", err);
      navigate("/login");
    }
  };

  // Build nav cards based on role
  const cards: NavCard[] = [];

  cards.push({
    icon: "𝄞",
    label: "All Scores",
    description: "Search and browse the full music catalog",
    path: "/all-scores",
  });

  if (isOwner) {
    cards.push({
      icon: "♫",
      label: "My Scores",
      description: "View and manage your personal collection",
      path: "/my-scores",
    });
  }

  if (isOwner || isAdmin || isCollaborator) {
    cards.push({
      icon: "✚",
      label: "Add a New Score",
      description: "Catalog a new piece in the library",
      path: "/add-new-score",
    });
  }

  if (isOwner) {
    cards.push({
      icon: "♪♪",
      label: "My Collaborators",
      description: "Manage who can edit your scores",
      path: "/my-collaborators",
    });
  }

  if (isAdmin) {
    cards.push({
      icon: "⚙",
      label: "Manage Accounts",
      description: "Administer all user accounts",
      path: "/admin/manage-accounts",
    });
  }

  return (
    <div className="dashboard-container">
      <PageTitle title="Welcome Back" />

      <div className="dashboard-greeting">
        <p className="dashboard-user-name">{user.accountName}</p>
        <p className="dashboard-account-type">{user.accountType}</p>
      </div>

      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <div className="dashboard-grid">
          {cards.map((card) => (
            <button
              key={card.path}
              className="dashboard-card"
              onClick={() => navigate(card.path)}
              aria-label={`${card.label}: ${card.description}`}
            >
              <span className="dashboard-card-icon" aria-hidden="true">
                {card.icon}
              </span>
              <span className="dashboard-card-label">{card.label}</span>
              <span className="dashboard-card-desc">{card.description}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="dashboard-footer">
        <button onClick={handleLogout} className="dashboard-logout">
          Logout
        </button>
      </div>

      {/* Decorative staff at bottom */}
      <div className="dashboard-staff" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  );
}
