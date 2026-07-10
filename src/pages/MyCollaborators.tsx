import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import { useNavigate } from "react-router-dom";
import PageTitle from "../components/PageTitle";
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

export default function MyCollaborators() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchMyCollaborators = async () => {
      try {
        const response = await api.get("/collaborators");
        setCollaborators(response.data);
      } catch (err: unknown) {
        setError(extractErrorMessage(err, "Failed to load your collaborators"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCollaborators();
  }, [user]);

  const columns = [
    {
      name: "Collaborator",
      selector: (row: Collaborator) =>
        row.collaborator?.accountName || row.collaborator?.username,
      sortable: true,
      grow: 2,
    },
    {
      name: "Permission",
      selector: (row: Collaborator) => row.permissionLevel,
      sortable: true,
    },
    {
      name: "Granted By",
      selector: (row: Collaborator) =>
        row.grantedBy?.accountName || row.grantedBy?.username,
      sortable: true,
      hide: 768 as const,
    },
    {
      name: "Granted At",
      selector: (row: Collaborator) => row.grantedAt,
      sortable: true,
      hide: 768 as const,
      cell: (row: Collaborator) =>
        row.grantedAt ? new Date(row.grantedAt).toLocaleDateString() : "—",
    },
  ];

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="collaborators-container">
      <PageTitle title="My Collaborators" />
      <p className="collaborators-subtitle">
        Managing collaborators for <strong>{user.accountName}</strong>
      </p>

      <div className="collaborators-actions">
        <button
          onClick={() => navigate("/add-collaborator")}
          className="primary-button"
        >
          ➕ Add a New Collaborator
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="collaborators-loading">
          <div className="collaborators-loading-notes">
            <span className="loading-note">♩</span>
            <span className="loading-note">♪</span>
            <span className="loading-note">♫</span>
            <span className="loading-note">♬</span>
            <span className="loading-note">♩</span>
          </div>
          <p>Loading your collaborators...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="collaborators-error">
          <span className="collaborators-error-icon">𝄞</span>
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && collaborators.length === 0 && (
        <div className="collaborators-empty">
          <span className="collaborators-empty-icon">𝄻</span>
          <p>You don't have any collaborators yet.</p>
          <p>Add one to get started sharing your music collection.</p>
        </div>
      )}

      {/* Data table */}
      {!isLoading && !error && collaborators.length > 0 && (
        <DataTable
          columns={columns}
          data={collaborators}
          pagination
          highlightOnHover
          pointerOnHover
          defaultSortFieldId={1}
          theme="dark"
          onRowClicked={(row) =>
            navigate(`/collaborators/${row.collaboratorId}`)
          }
        />
      )}
    </div>
  );
}
