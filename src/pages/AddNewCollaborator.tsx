import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import PageTitle from "../components/PageTitle";
import "./AddNewCollaborator.css";

interface Account {
  accountId: number;
  accountName: string;
}

export default function AddNewCollaborator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableCollaborators, setAvailableCollaborators] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [permissionLevel, setPermissionLevel] = useState<string>("VIEW_ONLY");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    api.get("/collaborators/available-collaborators").then((response) => {
      setAvailableCollaborators(response.data);
    });
  }, [user, navigate]);

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setErrors({});
    setServerError(null);
    setSuccessMessage(null);

    if (!selectedAccountId) {
      setErrors({ collaborator: "Please select a collaborator." });
      return;
    }
    if (!permissionLevel) {
      setErrors({ permissionLevel: "Please select a permission level." });
      return;
    }

    setIsLoading(true);

    const payload = {
      ownerAccountId: user!.accountId,
      collaboratorAccountId: selectedAccountId,
      permissionLevel: permissionLevel,
    };

    try {
      await api.post("/collaborators", payload);
      setSuccessMessage("Collaborator added successfully! Redirecting...");
      setTimeout(() => navigate("/my-collaborators"), 1200);
    } catch (error: unknown) {
      setServerError(extractErrorMessage(error, "An error occurred. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-collab-container">
      <div className="add-collab-card">
        <PageTitle title="Add New Collaborator" />
        <p className="add-collab-subtitle">
          Grant another user access to your music collection.
        </p>

        {/* Staff line accent */}
        <div className="add-collab-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {serverError && <div className="server-error">{serverError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="server-error">
            {Object.values(errors).map((err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        )}
        {successMessage && <div className="success">{successMessage}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="account-select">User to add:</label>
            <select
              id="account-select"
              value={selectedAccountId ?? ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedAccountId(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            >
              <option value="" disabled>
                -- Select an account --
              </option>
              {availableCollaborators.map((account) => (
                <option key={account.accountId} value={account.accountId}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </div>

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

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Adding..." : "➕ Add Collaborator"}
          </button>
        </form>

        {/* Staff line accent */}
        <div className="add-collab-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Back link */}
        <div className="add-collab-footer">
          <Link to="/my-collaborators" className="add-collab-back-link">
            ← Back to My Collaborators
          </Link>
        </div>
      </div>
    </div>
  );
}
