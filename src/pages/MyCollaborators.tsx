import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./MyCollaborators.css";

interface Collaborator {
  collaboratorId: number;
  owner: {
    accountId: number;
    username: string;
    accountName: string;
  };
  collaborator: {
    accountId: number;
    username: string;
    accountName: string;
  };
  grantedBy: {
    accountId: number;
    username: string;
    accountName: string;
  };
  grantedAt: string;
  permissionLevel: string;
}

const columns = [
  {
    name: "Collaborator",
    selector: (row: Collaborator) =>
      row.collaborator?.accountName || row.collaborator?.username,
  },
  {
    name: "Granted By",
    selector: (row: Collaborator) =>
      row.grantedBy?.accountName || row.grantedBy?.username,
  },
  {
    name: "Granted At",
    selector: (row: Collaborator) => row.grantedAt,
  },
  {
    name: "Permission Level",
    selector: (row: Collaborator) => row.permissionLevel,
  },
];

export default function MyCollaborators() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchMyCollaborators = async () => {
      try {
        const response = await api.get("/collaborators");
        setCollaborators(response.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load your collaborators",
        );
        console.error("Error fetching collaborators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCollaborators();
  }, [user, navigate]);
  if (loading)
    return <div className="loading">Loading your Collaborators...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-collaborators-container">
      <h2>My Collaborators</h2>
      <p>
        Logged in as: <strong>{user.accountName}</strong>
      </p>
      <button
        onClick={() => navigate("/add-collaborator")}
        className="primary-button"
      >
        Add a New Collaborator
      </button>
      {collaborators.length === 0 ? (
        <p>You don't have any collaborators yet.</p>
      ) : (
        <DataTable
          columns={columns}
          data={collaborators}
          pagination
          highlightOnHover
          pointerOnHover
          defaultSortFieldId={1}
          theme="dark"
          customStyles={tableCustomStyles}
        />
      )}
    </div>
  );
}

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#101585", color: "#FFDD44" } },
  rows: { style: { backgroundColor: "#1e1e4d", color: "white" } },
  pagination: { style: { backgroundColor: "#101585", color: "white" } },
};
