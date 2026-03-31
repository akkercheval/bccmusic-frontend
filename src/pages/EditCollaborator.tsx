import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function EditCollaborator() {
  const { collaboratorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collaborator, setCollaborator] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  interface Collaborator {
    collaboratorId: number;
    owner: {
       accountId: number;
       accountName: string; 
    };
    collaborator: {
      accountId: number;
      accountName: string;
    };
    grantedBy: {
      accountId: number;
      accountName: string;
    };
    grantedAt: string;
    permissionLevel: string;
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check permission
        const permRes = await api.get(
          `/collaborators/${collaboratorId}/can-edit`,
        );
        setCanEdit(permRes.data);

        if (canEdit) {
          const collabRes = await api.get(`/collaborators/${collaboratorId}`);
          setCollaborator(collabRes.data);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("You do not have permission to edit this collaboration.");
        } else {
          setError("Collaboration not found.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [collaboratorId]);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error || !canEdit) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1>Access Denied</h1>
          <p>{error}</p>
          <button
            onClick={() => navigate("/my-collaborators")}
            className="primary-button"
          >
            Back to My Collaborators
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {


  return (
    <div className="page-container">
      <div className="page-card">
        <h1>Edit Collaboration</h1>
        {error && <div className="server-error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}

        <div className="form-group">
          <label htmlFor="permission-select">Collaboration Type:</label>
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
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="primary-button"
        >
          {isLoading ? "Adding..." : "Add Collaborator"}
        </button>
      </div>
    </div>
  );
}
