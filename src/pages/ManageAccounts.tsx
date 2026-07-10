import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import PageTitle from "../components/PageTitle";
import "./ManageAccounts.css";

interface Account {
  accountId: number;
  accountName: string;
  username: string;
  email: string;
  accountType: string;
  createdAt?: string;
}

interface UpgradeRequest {
  requestId: number;
  accountId: number;
  accountName: string | null;
  status: string;
  reason: string | null;
  adminNotes: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedByUsername: string | null;
}

type RoleType = "ADMINISTRATOR" | "OWNER" | "COLLABORATOR" | "VIEWER";

export default function ManageAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Role change state
  const [roleChangeTarget, setRoleChangeTarget] = useState<Account | null>(null);
  const [newRole, setNewRole] = useState<RoleType>("VIEWER");
  const [isChangingRole, setIsChangingRole] = useState(false);

  // Upgrade request resolve state
  const [resolvingRequest, setResolvingRequest] = useState<UpgradeRequest | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.accountType !== "ADMINISTRATOR") {
      navigate("/dashboard");
      return;
    }
    loadData();
  }, [user, navigate]);

  // Auto-dismiss success
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadData = async () => {
    try {
      const [accountsRes, requestsRes] = await Promise.all([
        api.get("/accounts"),
        api.get("/account-upgrade-requests"),
      ]);
      setAccounts(accountsRes.data);
      setUpgradeRequests(requestsRes.data);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to load account data."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;

    setIsChangingRole(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.patch(`/accounts/${roleChangeTarget.accountId}/role`, null, {
        params: { accountType: newRole },
      });
      setSuccessMessage(
        `${roleChangeTarget.accountName} updated to ${formatRole(newRole)}.`
      );
      setRoleChangeTarget(null);
      await loadData();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to update role."));
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleResolveRequest = async (status: "APPROVED" | "DENIED") => {
    if (!resolvingRequest) return;

    setIsResolving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/account-upgrade-requests/${resolvingRequest.requestId}`, {
        status,
        adminNotes: resolveNotes.trim() || null,
      });
      setSuccessMessage(
        `Request from ${resolvingRequest.accountName || "user"} ${status.toLowerCase()}.`
      );
      setResolvingRequest(null);
      setResolveNotes("");
      await loadData();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to resolve request."));
    } finally {
      setIsResolving(false);
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR": return "Administrator";
      case "OWNER": return "Owner";
      case "COLLABORATOR": return "Collaborator";
      case "VIEWER": return "Viewer";
      default: return role;
    }
  };

  const getRoleBadgeClass = (type: string) => {
    switch (type) {
      case "ADMINISTRATOR": return "role-badge role-badge--admin";
      case "OWNER": return "role-badge role-badge--owner";
      case "COLLABORATOR": return "role-badge role-badge--collaborator";
      default: return "role-badge role-badge--viewer";
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.accountName.toLowerCase().includes(term) ||
      a.username.toLowerCase().includes(term) ||
      (a.email && a.email.toLowerCase().includes(term)) ||
      a.accountType.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      name: "Account Name",
      selector: (row: Account) => row.accountName,
      sortable: true,
      grow: 2,
    },
    {
      name: "Username",
      selector: (row: Account) => row.username,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: Account) => row.email || "—",
      sortable: true,
      hide: 768 as const,
    },
    {
      name: "Role",
      sortable: true,
      selector: (row: Account) => row.accountType,
      cell: (row: Account) => (
        <span className={getRoleBadgeClass(row.accountType)}>
          {formatRole(row.accountType)}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row: Account) => (
        <button
          className="manage-role-btn"
          onClick={(e) => {
            e.stopPropagation();
            setRoleChangeTarget(row);
            setNewRole(row.accountType as RoleType);
            setError(null);
          }}
          disabled={row.accountId === user!.accountId}
          title={row.accountId === user!.accountId ? "Cannot change your own role" : "Change role"}
        >
          Change Role
        </button>
      ),
      ignoreRowClick: true,
    },
  ];

  const pendingRequests = upgradeRequests.filter((r) => r.status === "PENDING");

  if (isLoading) {
    return (
      <div className="manage-accounts-container">
        <div className="manage-accounts-loading">
          <div className="manage-accounts-loading-notes">
            <span className="loading-note">♩</span>
            <span className="loading-note">♪</span>
            <span className="loading-note">♫</span>
            <span className="loading-note">♬</span>
            <span className="loading-note">♩</span>
          </div>
          <p>Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-accounts-container">
      <PageTitle title="Manage All Accounts" />

      {/* Feedback */}
      {error && <div className="server-error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      {/* Pending Upgrade Requests */}
      {pendingRequests.length > 0 && (
        <div className="manage-upgrade-section">
          <h2 className="manage-section-title">
            📋 Pending Upgrade Requests ({pendingRequests.length})
          </h2>
          <div className="manage-upgrade-list">
            {pendingRequests.map((req) => (
              <div key={req.requestId} className="manage-upgrade-card">
                <div className="manage-upgrade-info">
                  <strong>{req.accountName || `Account #${req.accountId}`}</strong>
                  <span className="manage-upgrade-date">
                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                  </span>
                  {req.reason && (
                    <p className="manage-upgrade-reason">"{req.reason}"</p>
                  )}
                </div>
                <div className="manage-upgrade-actions">
                  {resolvingRequest?.requestId === req.requestId ? (
                    <div className="manage-resolve-form">
                      <input
                        type="text"
                        placeholder="Admin notes (optional)"
                        value={resolveNotes}
                        onChange={(e) => setResolveNotes(e.target.value)}
                        className="manage-resolve-input"
                      />
                      <div className="manage-resolve-buttons">
                        <button
                          className="primary-button"
                          onClick={() => handleResolveRequest("APPROVED")}
                          disabled={isResolving}
                        >
                          {isResolving ? "..." : "✓ Approve"}
                        </button>
                        <button
                          className="primary-button danger"
                          onClick={() => handleResolveRequest("DENIED")}
                          disabled={isResolving}
                        >
                          {isResolving ? "..." : "✗ Deny"}
                        </button>
                        <button
                          className="primary-button"
                          onClick={() => { setResolvingRequest(null); setResolveNotes(""); }}
                          disabled={isResolving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={() => setResolvingRequest(req)}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Staff divider */}
          <div className="manage-staff" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      )}

      {/* Role Change Confirmation */}
      {roleChangeTarget && (
        <div className="manage-role-change" role="alertdialog">
          <h3 className="manage-role-change-title">
            Change Role for {roleChangeTarget.accountName}
          </h3>
          <p className="manage-role-change-current">
            Current role: <span className={getRoleBadgeClass(roleChangeTarget.accountType)}>
              {formatRole(roleChangeTarget.accountType)}
            </span>
          </p>
          <div className="form-group">
            <label htmlFor="new-role-select">New Role:</label>
            <select
              id="new-role-select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as RoleType)}
            >
              <option value="VIEWER">Viewer</option>
              <option value="COLLABORATOR">Collaborator</option>
              <option value="OWNER">Owner</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
          <div className="manage-role-change-actions">
            <button
              className="primary-button"
              onClick={handleRoleChange}
              disabled={isChangingRole || newRole === roleChangeTarget.accountType}
            >
              {isChangingRole ? "Updating..." : "Confirm Change"}
            </button>
            <button
              className="primary-button"
              onClick={() => setRoleChangeTarget(null)}
              disabled={isChangingRole}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="manage-search">
        <label htmlFor="account-search">Search:</label>
        <input
          id="account-search"
          type="text"
          placeholder="Filter by name, username, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Accounts Table */}
      <DataTable
        columns={columns}
        data={filteredAccounts}
        pagination
        highlightOnHover
        defaultSortFieldId={1}
        theme="dark"
        noDataComponent={
          <div className="manage-empty">
            <p>No accounts found.</p>
          </div>
        }
      />
    </div>
  );
}
