import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./AddNewCollaborator.css";
import type { Account } from "../types/Account";

export default function AddNewCollaborator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableCollaborators, setAvailableCollaborators] = useState<
    Account[]
  >([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [permissionLevel, setPermissionLevel] = useState<string | null>(null);

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
    setIsLoading(true);

    if (!selectedAccountId) {
      setErrors({ collaborator: "Please select a collaborator." });
      setIsLoading(false);
      return;
    }
    if (!permissionLevel) {
      setErrors({ permissionLevel: "Please select a permission level." });
      setIsLoading(false);
      return;
    }

    // Clean, minimal payload — only IDs + permissionLevel
    const payload = {
      ownerAccountId: user!.accountId,
      collaboratorAccountId: selectedAccountId,
      permissionLevel: permissionLevel,
    };

    console.log("Sending clean collaborator payload:", payload);

    try {
      await api.post("/collaborators", payload);
      setSuccessMessage("Collaborator added successfully!");

      // Reset form
      setSelectedAccountId(null);
      setPermissionLevel("VIEW_ONLY");
    } catch (error: any) {
      console.error("Error adding collaborator:", error);
      setServerError(
        error.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-collaborator-form">
      <h2>Add New Collaborator</h2>

      {serverError && <div className="server-error">{serverError}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <div className="form-group">
        <label htmlFor="account-select">User to add as a Collaborator:</label>
        <select
          id="account-select"
          value={selectedAccountId ?? ""}
          onChange={(e) => setSelectedAccountId(Number(e.target.value))}
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
  );
}
