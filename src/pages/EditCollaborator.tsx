import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function EditCollaborator() {
  const { collaboratorId } = useParams<{ collaboratorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collaborator, setCollaborator] = useState<any>(null);
  const [permissionLevel, setPermissionLevel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load collaborator details + permission check
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // 1. Check if current user can edit this collaboration
        const permRes = await api.get(
          `/collaborators/${collaboratorId}/can-edit`,
        );

        if (!permRes.data) {
          setError("You do not have permission to edit this collaboration.");
          setIsLoading(false);
          return;
        }

        // 2. Fetch the collaborator details
        const collabRes = await api.get(`/collaborators/${collaboratorId}`);
        const data = collabRes.data;

        setCollaborator(data);
        setPermissionLevel(data.permissionLevel || "VIEW_ONLY");
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("You do not have permission to edit this collaboration.");
        } else {
          setError("Collaboration not found or could not be loaded.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (collaboratorId) loadData();
  }, [collaboratorId, navigate, user]);

  const handleSave = async () => {
    if (!collaborator) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.put(`/collaborators/${collaboratorId}`, {
        permissionLevel,
      });

      setSuccessMessage("Collaboration updated successfully!");
      setTimeout(() => {
        navigate("/my-collaborators");
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update collaboration.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this collaborator?")) return;

    try {
      await api.delete(`/collaborators/${collaboratorId}`);
      setSuccessMessage("Collaborator removed successfully.");
      setTimeout(() => navigate("/my-collaborators"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete collaborator.");
    }
  };

  if (isLoading) return <div className="loading">Loading collaboration...</div>;

  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1>Access Denied</h1>
          <p className="server-error">{error}</p>
          <button
            onClick={() => navigate("/my-collaborators")}
            className="primary-button"
          >
            ← Back to My Collaborators
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <h1>Edit Collaboration</h1>

        {successMessage && <div className="success">{successMessage}</div>}

        <div className="form-group">
          <label>Collaborator:</label>
          <p>
            <strong>{collaborator?.collaborator?.accountName}</strong>
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="permission-select">Permission Level:</label>
          <select
            id="permission-select"
            value={permissionLevel}
            onChange={(e) => setPermissionLevel(e.target.value)}
          >
            <option value="VIEW_ONLY">View Scores Only</option>
            <option value="LIMITED_SCORE_EDIT">
              Limited Add and Edit Scores
            </option>
            <option value="FULL_SCORE_EDIT">Full Edit Scores</option>
            <option value="SCORE_COLLAB_EDIT">Full Collaboration</option>
          </select>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={handleSave}
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "💾 Save Changes"}
          </button>

          <button
            onClick={handleDelete}
            className="secondary-button"
            style={{ marginLeft: "1rem", background: "#ff6b6b" }}
          >
            🗑️ Remove Collaborator
          </button>
        </div>
      </div>
    </div>
  );
}
