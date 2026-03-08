import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  const isOwner = user.accountType === "OWNER";
  const isCollaborator = user.accountType === "COLLABORATOR";
  const isAdmin = user.accountType === "ADMINISTRATOR";

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1>Welcome back, {user.accountName}!</h1>
        <p>
          Account Type: <strong>{user.accountType}</strong>
        </p>

        <div className="button-group">
          {/* Always shown: Update My Account */}
          <button
            onClick={() => navigate("/account/update")}
            className="link-button"
          >
            Update My Account
          </button>

          {/* Always shown: Search All Scores */}
          <button
            onClick={() => navigate("/search-scores")}
            className="link-button"
          >
            Search All Scores
          </button>

          {/* Owner: View My Scores */}
          {isOwner && (
            <button
              onClick={() => navigate("/my-scores")}
              className="link-button"
            >
              View My Scores
            </button>
          )}

          {/* Collaborator / Owner / Admin: Add a New Score */}
          {(isOwner || isAdmin || isCollaborator) && (
            <button
              onClick={() => navigate("/add-new-score")}
              className="link-button"
            >
              Add a New Score
            </button>
          )}

          {/* Owner / Admin: Manage My Collaborators */}
          {(isOwner || isAdmin) && (
            <button
              onClick={() => navigate("/manage-collaborators")}
              className="link-button"
            >
              Manage Collaborators
            </button>
          )}

          {/* Collaborator with SCORE_COLLAB_EDIT: View/Manage Other Accounts (future) */}
          {/* We'll add this later when you implement the permission check */}
          {/* For now, it's commented out */}
          {/* {isCollaborator && hasCollabEditPermission && ( */}
          {/*   <button */}
          {/*     onClick={() => navigate("/collaborator-dashboard")} */}
          {/*     className="link-button" */}
          {/*   > */}
          {/*     View/Manage Other Collaborators */}
          {/*   </button> */}
          {/* )} */}

          {/* Admin: Manage All Accounts */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/manage-accounts")}
              className="link-button"
            >
              Manage All Accounts
            </button>
          )}

          {/* Always shown: Logout */}
          <button onClick={() => navigate("/logout")} className="link-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
