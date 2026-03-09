import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import api from "../services/api";
import ComposerList from "../components/ComposerList";
import PartList from "../components/PartList";
import type { Part } from "../components/PartList";
import type { ComposerEntry } from "../components/ComposerList";
import "./AddNewScore.css";

interface CollaborationAccount {
  ownerAccountId: number;
  ownerAccountName: string;
  collaboratorAccountId: number;
  collaboratorAccountName: string;
  permissionLevel: string;
}

export default function AddNewScore() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    scoreTitle: "",
    scoreSubtitle: "",
    selectedOwnerId: "",
    purchasedName: "",
    purchasedDate: null,
    purchasedCost: null,
    grade: null,
    arrangementTypeCode: "",
    composers: "",
    parts: "",
    tags: "",
    medleyPieces: "",
  });

  const [parts, setParts] = useState<Part[]>([]);
  const [allowedOwners, setAllowedOwners] = useState<CollaborationAccount[]>(
    [],
  );
  const [arrangementTypes, setArrangementTypes] = useState<
    { code: string; name: string }[]
  >([]);
  const [existingComposers, setExistingComposers] = useState<
    { id: number; firstName?: string; middleName?: string; lastName: string }[]
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [composerRows, setComposerRows] = useState<ComposerEntry[]>([
    { contributionType: "" },
  ]);

  useEffect(() => {
    if (loading || !user) return;

    api
      .get("/collaborators/my-collaborations")
      .then((res) => {
        const owners = res.data;
        setAllowedOwners(owners);

        if (owners.length > 0) {
          setFormData((prev) => ({
            ...prev,
            selectedOwnerId: owners[0].ownerAccountId.toString(),
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch collaborations", err);
        setServerError("Failed to load owner options. Please try again.");
      });

    api
      .get("/composers")
      .then((res) => setExistingComposers(res.data))
      .catch((err) => console.error("Failed to fetch composers", err));

    api.get("/arrangement-types").then((res) => {
      setArrangementTypes(res.data);
    });
  }, [loading, user]);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "scoreTitle":
        if (!value.trim()) error = "Score title is required";
        break;
      case "arrangementTypeCode":
        if (!value.trim()) error = "Arrangement type is required";
        break;
      case "selectedOwnerId":
        if (!value) error = "Please select an owner";
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value as string);
      if (error) newErrors[name] = error;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const payload = {
        scoreTitle: formData.scoreTitle,
        scoreSubtitle: formData.scoreSubtitle,
        ownerAccountId: Number(formData.selectedOwnerId),
        purchasedName: formData.purchasedName,
        purchasedDate: formData.purchasedDate,
        purchasedCost: formData.purchasedCost,
        grade: formData.grade,
        arrangementTypeCode: formData.arrangementTypeCode,
        composers: composerRows
          .map((row) => {
            if (row.composerId) {
              return {
                composerId: row.composerId,
                contributionType: row.contributionType,
              };
            }
            return null;
          })
          .filter(Boolean),
        parts: parts,
        tags: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        medleyPieces: formData.medleyPieces
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await api.post("/scores", payload);

      setSuccessMessage("Score added successfully! Redirecting...");
      setTimeout(() => navigate("/my-scores"), 2000);
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || "Failed to add score. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-score-form">
      <h1>Add a New Score</h1>

      {serverError && <div className="server-error">{serverError}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="scoreTitle">Score Title*</label>
          <input
            type="text"
            id="scoreTitle"
            name="scoreTitle"
            value={formData.scoreTitle}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.scoreTitle && errors.scoreTitle && (
            <span className="error">{errors.scoreTitle}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="scoreSubtitle">Score Subtitle</label>
          <input
            type="text"
            id="scoreSubtitle"
            name="scoreSubtitle"
            value={formData.scoreSubtitle}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="owner">Score Owner*</label>
          <select
            id="owner"
            name="selectedOwnerId"
            value={formData.selectedOwnerId}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select owner...</option>
            {allowedOwners.map((o) => (
              <option key={o.ownerAccountId} value={o.ownerAccountId}>
                {o.ownerAccountName} ({o.permissionLevel})
              </option>
            ))}
          </select>
          {touched.selectedOwnerId && errors.selectedOwnerId && (
            <span className="error">{errors.selectedOwnerId}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="purchasedName">Purchased From</label>
          <input
            type="text"
            id="purchasedName"
            name="purchasedName"
            value={formData.purchasedName}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="purchasedDate">Purchased Date</label>
          <input
            type="date"
            id="purchasedDate"
            name="purchasedDate"
            value={formData.purchasedDate || ""}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="purchasedCost">Purchased Cost</label>
          <input
            type="number"
            step="0.01"
            id="purchasedCost"
            name="purchasedCost"
            value={formData.purchasedCost || ""}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="grade">Grade</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="10"
            id="grade"
            name="grade"
            value={formData.grade || ""}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="arrangementTypeCode">Arrangement Type*</label>
          <select
            id="arrangementTypeCode"
            name="arrangementTypeCode"
            value={formData.arrangementTypeCode}
            onChange={handleChange}
            required
          >
            <option value="">Select type...</option>
            {arrangementTypes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <ComposerList
          composers={composerRows}
          setComposers={setComposerRows}
          existingComposers={existingComposers}
          setExistingComposers={setExistingComposers}
        />

        <PartList parts={parts} setParts={setParts} />

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="medleyPieces">Medley Pieces (comma-separated)</label>
          <input
            type="text"
            id="medleyPieces"
            name="medleyPieces"
            value={formData.medleyPieces}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Adding Score..." : "Add Score"}
        </button>
      </form>
    </div>
  );
}
