import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import PageTitle from "../components/PageTitle";
import "./EditCollaborator.css";

export default function EditCollaborator() {
  const { collaboratorId } = useParams<{ collaboratorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collaborator, setCollaborator] = useState<any>(null);
  const [permissionLevel, setPermissionLevel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      } catch (err: unknown) {
        const axiosErr = err as any;
        if (axiosErr?.response?.status === 403) {
          setError("You do not have permission to edit this collaboration.");
        } else {
          setError(extractErrorMessage(err, "Collaboration not found or could not be loaded."));
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (collaboratorId) loadData();
  }, [collaboratorId, navigate, user]);

  const handleSave = async () => {
    if (!collaborator) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/collaborators/${collaboratorId}`, {
        permissionLevel,
      });

      setSuccessMessage("Collaboration updated successfully!");
      setTimeout(() => {
        navigate("/my-collaborators");
      }, 1500);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to update collaboration."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.delete(`/collaborators/${collaboratorId}`);
      setSuccessMessage("Collaborator removed successfully. Redirecting...");
      setShowDeleteConfirm(false);
      setTimeout(() => navigate("/my-collaborators"), 1500);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to delete collaborator."));
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="edit-collab-container">
        <div className="edit-collab-card">
          <div className="edit-collab-loading">
            <div className="edit-collab-loading-notes">
              <span className="loading-note">♩</span>
              <span className="loading-note">♪</span>
              <span className="loading-note">♫</span>
            </div>
            <p>Loading collaboration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !collaborator) {
    return (
      <div className="edit-collab-container">
        <div className="edit-collab-card">
          <PageTitle title="Access Denied" />
          <div className="server-error">{error}</div>
          <div className="edit-collab-footer">
            <Link to="/my-collaborators" className="edit-collab-back-link">
              ← Back to My Collaborators
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-collab-container">
      <div className="edit-collab-card">
        <PageTitle title="Edit Collaboration" />
        <p className="edit-collab-subtitle">
          Update permissions for this collaborator.
        </p>

        {/* Staff line accent */}
        <div className="edit-collab-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Feedback messages */}
        {error && <div className="server-error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}

        {/* Collaborator info */}
        <div className="edit-collab-info">
          <div className="edit-collab-info-item">
            <span className="edit-collab-info-label">Collaborator:</span>
            <span className="edit-collab-info-value">
              {collaborator?.collaborator?.accountName}
            </span>
          </div>
          {collaborator?.grantedAt && (
            <div className="edit-collab-info-item">
              <span className="edit-collab-info-label">Granted:</span>
              <span className="edit-collab-info-value">
                {new Date(collaborator.grantedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Permission form */}
        <div className="form-group">
          <label htmlFor="permission-select">Permission Level:</label>
          <select
            id="permission-select"
            value={permissionLevel}
            onChange={(e) => setPermissionLevel(e.target.value)}
          >
            <option value="VIEW_ONLY">View Scores Only</option>
            <option value="LIMITED_SCORE_EDIT">Limited Add and Edit Scores</option>
            <option value="FULL_SCORE_EDIT">Full Edit Scores</option>
            <option value="SCORE_COLLAB_EDIT">Full Collaboration</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="edit-collab-actions">
          <button
            onClick={handleSave}
            className="primary-button"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "💾 Save Changes"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="primary-button danger"
            disabled={showDeleteConfirm}
          >
            🗑️ Remove Collaborator
          </button>
        </div>

        {/* Inline delete confirmation */}
        {showDeleteConfirm && (
          <div className="edit-collab-delete-confirm" role="alertdialog" aria-labelledby="delete-collab-title">
            <p id="delete-collab-title" className="edit-collab-delete-message">
              🗑️ Remove this collaborator? They will lose access to your collection.
            </p>
            <div className="edit-collab-delete-actions">
              <button
                type="button"
                className="primary-button danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Removing..." : "Yes, Remove"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Staff line accent */}
        <div className="edit-collab-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Back link */}
        <div className="edit-collab-footer">
          <Link to="/my-collaborators" className="edit-collab-back-link">
            ← Back to My Collaborators
          </Link>
        </div>
      </div>
    </div>
  );
}
