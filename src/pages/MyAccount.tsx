import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import PageTitle from "../components/PageTitle";
import "./MyAccount.css";

const states = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District Of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "PR", label: "Puerto Rico" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VI", label: "Virgin Islands" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

interface AccountData {
  accountId: number;
  accountName: string;
  username: string;
  email: string;
  phoneNumber: string;
  phoneType: string;
  website: string;
  streetAddress: string;
  city: string;
  stateAbbr: string;
  zipCode: string;
  accountType: string;
  createdAt?: string;
  updatedAt?: string;
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

export default function MyAccount() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    accountName: "",
    email: "",
    phoneNumber: "",
    phoneType: "",
    website: "",
    streetAddress: "",
    city: "",
    stateAbbr: "",
    zipCode: "",
  });

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Upgrade request state
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadAccount();
    loadUpgradeStatus();
  }, [user, navigate]);

  // Auto-dismiss success after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadAccount = async () => {
    try {
      const res = await api.get(`/accounts/${user!.accountId}`);
      const data: AccountData = res.data;
      setAccount(data);
      setFormData({
        accountName: data.accountName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        phoneType: data.phoneType || "",
        website: data.website || "",
        streetAddress: data.streetAddress || "",
        city: data.city || "",
        stateAbbr: data.stateAbbr || "",
        zipCode: data.zipCode || "",
      });
    } catch (err: unknown) {
      setServerError(extractErrorMessage(err, "Failed to load account information."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpgradeStatus = async () => {
    try {
      const res = await api.get("/account-upgrade-requests/my-status");
      const requests: UpgradeRequest[] = res.data;
      if (requests && requests.length > 0) {
        // Show the most recent request (last in list, or find PENDING first)
        const pending = requests.find((r) => r.status === "PENDING");
        const latest = pending || requests[requests.length - 1];
        setUpgradeRequest(latest);
      }
    } catch {
      // No pending request or endpoint not yet available — that's fine
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = "Account name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.zipCode && !/^\d{5}(?:[-\s]\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Invalid ZIP code format (e.g., 46052 or 46052-1234)";
    }
    if (formData.phoneNumber && !/^\+?\d[\d\s()-]{7,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setIsSaving(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/accounts/${user!.accountId}`, {
        accountId: user!.accountId,
        username: account!.username,
        ...formData,
      });
      setSuccessMessage("Account updated successfully!");
      setIsEditing(false);
      await loadAccount();
      await refreshUser();
    } catch (err: unknown) {
      setServerError(extractErrorMessage(err, "Failed to update account."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.patch(`/accounts/${user!.accountId}/password`, null, {
        params: {
          currentPassword: passwordData.currentPassword,
          updatedPassword: passwordData.newPassword,
        },
      });
      setSuccessMessage("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (err: unknown) {
      setServerError(extractErrorMessage(err, "Failed to change password."));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUpgrade(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.post("/account-upgrade-requests", {
        reason: upgradeReason.trim() || null,
      });
      setSuccessMessage("Upgrade request submitted! An administrator will review it.");
      setShowUpgradeForm(false);
      setUpgradeReason("");
      await loadUpgradeStatus();
    } catch (err: unknown) {
      setServerError(extractErrorMessage(err, "Failed to submit upgrade request."));
    } finally {
      setIsSubmittingUpgrade(false);
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

  const formatRoleName = (type: string) => {
    switch (type) {
      case "ADMINISTRATOR": return "Administrator";
      case "OWNER": return "Owner";
      case "COLLABORATOR": return "Collaborator";
      case "VIEWER": return "Viewer";
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="myaccount-container">
        <div className="myaccount-card">
          <div className="myaccount-loading">
            <div className="myaccount-loading-notes">
              <span className="loading-note">♩</span>
              <span className="loading-note">♪</span>
              <span className="loading-note">♫</span>
            </div>
            <p>Loading your account...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="myaccount-container">
        <div className="myaccount-card">
          <PageTitle title="My Account" />
          <div className="server-error">{serverError || "Unable to load account."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="myaccount-container">
      <div className="myaccount-card">
        <PageTitle title="My Account" />

        {/* Role badge */}
        <div className="myaccount-role-section">
          <span className={getRoleBadgeClass(account.accountType)}>
            {formatRoleName(account.accountType)}
          </span>
          <span className="myaccount-username">@{account.username}</span>
        </div>

        {/* Staff line accent */}
        <div className="myaccount-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Feedback messages */}
        {serverError && <div className="server-error">{serverError}</div>}
        {successMessage && <div className="success">{successMessage}</div>}

        {/* View Mode */}
        {!isEditing && (
          <div className="myaccount-details">
            <div className="myaccount-detail-row">
              <span className="myaccount-label">Account Name</span>
              <span className="myaccount-value">{account.accountName}</span>
            </div>
            <div className="myaccount-detail-row">
              <span className="myaccount-label">Username</span>
              <span className="myaccount-value">{account.username}</span>
            </div>
            <div className="myaccount-detail-row">
              <span className="myaccount-label">Email</span>
              <span className="myaccount-value">{account.email || "—"}</span>
            </div>
            <div className="myaccount-detail-row">
              <span className="myaccount-label">Phone</span>
              <span className="myaccount-value">
                {account.phoneNumber || "—"}
                {account.phoneType && ` (${account.phoneType})`}
              </span>
            </div>
            <div className="myaccount-detail-row">
              <span className="myaccount-label">Website</span>
              <span className="myaccount-value">{account.website || "—"}</span>
            </div>
            <div className="myaccount-detail-row">
              <span className="myaccount-label">Address</span>
              <span className="myaccount-value">
                {[account.streetAddress, account.city, account.stateAbbr, account.zipCode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
            {account.updatedAt && (
              <div className="myaccount-detail-row myaccount-detail-row--muted">
                <span className="myaccount-label">Last Updated</span>
                <span className="myaccount-value">
                  {new Date(account.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} noValidate>
            <div className="form-group">
              <label htmlFor="accountName">Account Name:</label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                required
              />
              {errors.accountName && <span className="error">{errors.accountName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone:</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                placeholder="XXX-XXX-XXXX"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneType">Phone Type:</label>
              <select
                id="phoneType"
                name="phoneType"
                value={formData.phoneType}
                onChange={handleChange}
              >
                <option value="">Select a Phone Type</option>
                <option value="mobile">Mobile / Cell</option>
                <option value="home">Home</option>
                <option value="work">Work / Office</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="website">Website:</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="streetAddress">Street Address:</label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stateAbbr">State:</label>
              <select
                id="stateAbbr"
                name="stateAbbr"
                value={formData.stateAbbr}
                onChange={handleChange}
              >
                <option value="">Select a State</option>
                {states.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="zipCode">Zip Code:</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
              {errors.zipCode && <span className="error">{errors.zipCode}</span>}
            </div>
          </form>
        )}

        {/* Edit/Save controls */}
        <div className="myaccount-actions">
          {!isEditing ? (
            <button
              onClick={() => { setIsEditing(true); setServerError(null); setSuccessMessage(null); }}
              className="primary-button"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <>
              <button onClick={handleSaveProfile} className="primary-button" disabled={isSaving}>
                {isSaving ? "Saving..." : "💾 Save Changes"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setErrors({}); setServerError(null); loadAccount(); }}
                className="primary-button"
              >
                🚫 Cancel
              </button>
            </>
          )}
        </div>

        {/* Staff line divider */}
        <div className="myaccount-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Password Change Section */}
        <div className="myaccount-section">
          <h2 className="myaccount-section-title">Change Password</h2>
          {!showPasswordSection ? (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="primary-button"
            >
              🔒 Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} noValidate>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password:</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                {errors.currentPassword && <span className="error">{errors.currentPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password:</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
                {errors.newPassword && <span className="error">{errors.newPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
                {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
              </div>

              <div className="myaccount-actions">
                <button type="submit" className="primary-button" disabled={isChangingPassword}>
                  {isChangingPassword ? "Changing..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setErrors({});
                  }}
                  className="primary-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Upgrade Request Section (Viewers only) */}
        {account.accountType === "VIEWER" && (
          <>
            <div className="myaccount-staff" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>

            <div className="myaccount-section">
              <h2 className="myaccount-section-title">Request Owner Access</h2>

              {upgradeRequest && upgradeRequest.status === "PENDING" && (
                <div className="warning">
                  Your upgrade request is pending review (submitted{" "}
                  {new Date(upgradeRequest.requestedAt).toLocaleDateString()}).
                </div>
              )}

              {upgradeRequest && upgradeRequest.status === "DENIED" && (
                <div className="server-error">
                  Your upgrade request was denied.
                  {upgradeRequest.adminNotes && (
                    <> Reason: {upgradeRequest.adminNotes}</>
                  )}
                </div>
              )}

              {(!upgradeRequest || upgradeRequest.status === "DENIED") && !showUpgradeForm && (
                <>
                  <p className="myaccount-upgrade-desc">
                    Owner accounts can add music to their collection and manage collaborators.
                    Submit a request and an administrator will review it.
                  </p>
                  <button
                    onClick={() => setShowUpgradeForm(true)}
                    className="primary-button"
                  >
                    📋 Request Owner Access
                  </button>
                </>
              )}

              {showUpgradeForm && (
                <form onSubmit={handleRequestUpgrade} noValidate>
                  <div className="form-group">
                    <label htmlFor="upgradeReason">Reason (optional):</label>
                    <input
                      type="text"
                      id="upgradeReason"
                      value={upgradeReason}
                      onChange={(e) => setUpgradeReason(e.target.value)}
                      placeholder="Why would you like Owner access?"
                    />
                  </div>
                  <div className="myaccount-actions">
                    <button type="submit" className="primary-button" disabled={isSubmittingUpgrade}>
                      {isSubmittingUpgrade ? "Submitting..." : "Submit Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowUpgradeForm(false); setUpgradeReason(""); }}
                      className="primary-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
