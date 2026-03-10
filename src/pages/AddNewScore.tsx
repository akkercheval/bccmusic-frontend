import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import api from "../services/api";
import ComposerList from "../components/ComposerList";
import PartList from "../components/PartList";
import type { Part } from "../components/PartList";
import type { ComposerEntry } from "../components/ComposerList";
import "./AddNewScore.css";
import TagsList from "../components/TagsList";
import MedleyList from "../components/MedleyList";
import type { Account } from "../types/Account";
import AddEditVendorPopup from "../components/AddEditVendorPopup";

interface CollaborationAccount {
  ownerAccountId: number;
  ownerAccountName: string;
  collaboratorAccountId: number;
  collaboratorAccountName: string;
  permissionLevel: string;
}

interface Vendor {
  vendorId: number;
  vendorName: string;
}

export default function AddNewScore() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    scoreTitle: "",
    scoreSubtitle: "",
    owner: "",
    purchasedFrom: "",
    purchasedDate: null,
    purchasedCost: null,
    grade: null,
    arrangementType: "",
    scoreComposers: "",
    parts: "",
    scoreTags: "",
    medleys: "",
  });

  const [parts, setParts] = useState<Part[]>([]);
  const [scoreTags, setScoreTags] = useState<
    { scoreTagId?: number; scoreId?: number; tag: string }[]
  >([]);
  const [allowedOwners, setAllowedOwners] = useState<Account[]>([]);
  const [arrangementTypes, setArrangementTypes] = useState<
    { code: string; name: string }[]
  >([]);
  const [existingComposers, setExistingComposers] = useState<
    { id: number; firstName?: string; middleName?: string; lastName: string }[]
  >([]);
  const [medleys, setMedleys] = useState<
    {
      medleyId?: number;
      scoreId?: number;
      pieceTitle: string;
      composerId?: number;
    }[]
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scoreComposers, setScoreComposers] = useState<ComposerEntry[]>([
    { contributionType: "" },
  ]);
  const [existingVendors, setExistingVendors] = useState<Vendor[]>([]);
  const [showVendorPopup, setShowVendorPopup] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    api
      .get("/collaborators/my-collaborations")
      .then((res) => {
        const collaborations: CollaborationAccount[] = res.data;
        const validCollaborations = collaborations.filter(
          (collab) =>
            collab.ownerAccountId === user.accountId ||
            collab.collaboratorAccountId === user.accountId,
        );
        const ownerAccounts = validCollaborations.map((collab) => ({
          accountId: collab.ownerAccountId,
          accountName: collab.ownerAccountName,
        }));
        setAllowedOwners(ownerAccounts);

        if (ownerAccounts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            owner: ownerAccounts[0].accountId.toString(),
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
    api
      .get("/vendors")
      .then((res) => setExistingVendors(res.data))
      .catch((err) => console.error("Failed to fetch vendors", err));
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
      case "arrangementType":
        if (!value.trim()) error = "Arrangement type is required";
        break;
      case "owner":
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
    setErrors({});
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.scoreTitle.trim())
      newErrors.scoreTitle = "Score title is required";
    if (!formData.arrangementType)
      newErrors.arrangementTypeCode = "Arrangement type is required";
    if (!formData.owner) newErrors.owner = "Please select an owner";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors); // Debug
      setServerError("Please fix the errors above.");
      setIsLoading(false);
      return;
    }

    const payload = {
      scoreTitle: formData.scoreTitle.trim(),
      scoreSubtitle: formData.scoreSubtitle?.trim() || null,
      owner: { accountId: parseInt(formData.owner) },
      purchasedFrom: formData.purchasedFrom
        ? { vendorId: parseInt(formData.purchasedFrom) } // ← now sends ID (matches backend)
        : null,
      purchasedDate: formData.purchasedDate || null,
      purchasedCost: formData.purchasedCost
        ? parseFloat(formData.purchasedCost)
        : null,
      grade: formData.grade ? parseFloat(formData.grade) : null,
      arrangementType: { code: formData.arrangementType }, // Key change: send object
      scoreComposers: scoreComposers.map((c) => ({
        composer: { composerId: c.composerId },
        contributionType: c.contributionType.trim(),
      })),
      parts: parts.map((p) => ({
        instrument: p.instrument,
        hasSolo: p.hasSolo,
        regularPartCount: p.regularPartCount,
        flexMinPart: p.flexMinPart ?? null,
        flexPartCount: p.flexPartCount ?? null,
        partComments: p.partComments?.trim() || null,
      })),
      scoreTags: scoreTags.map((t) => ({ tag: t.tag.trim() })),
      medleys: medleys.map((m) => ({
        pieceTitle: m.pieceTitle.trim(),
        composer: m.composerId ? { composerId: m.composerId } : null,
      })),
    };

    console.log("Submitting payload:", payload); // Debug to verify structure

    try {
      const response = await api.post("/scores", payload);
      setSuccessMessage("Score added successfully!");
      // Optional: Reset form or navigate
      // setFormData({ ...initialFormData });
      // navigate("/scores");
    } catch (err: any) {
      console.error("Submit error:", err);
      setServerError(
        err.response?.data?.message || "Failed to add score. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewVendorSuccess = (newVendor: Vendor) => {
    setExistingVendors((prev) => [...prev, newVendor]);
    setFormData((prev) => ({
      ...prev,
      purchasedFrom: newVendor.vendorId.toString(),
    }));
    setShowVendorPopup(false);
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
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          >
            <option value="">Select owner...</option>
            {allowedOwners.map((o) => (
              <option key={o.accountId} value={o.accountId}>
                {o.accountName}
              </option>
            ))}
          </select>
          {touched.owner && errors.owner && (
            <span className="error">{errors.owner}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="purchasedFrom">Purchased From</label>
          <select
            id="purchasedFrom"
            name="purchasedFrom"
            value={formData.purchasedFrom}
            onChange={(e) => {
              if (e.target.value === "new") {
                setShowVendorPopup(true);
              } else {
                setFormData((prev) => ({
                  ...prev,
                  purchasedFrom: e.target.value,
                }));
              }
            }}
          >
            <option value="">— Select or create vendor —</option>
            {existingVendors.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.vendorName}
              </option>
            ))}
            <option value="new">+ Create new vendor</option>
          </select>
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
          <label htmlFor="arrangementType">Arrangement Type*</label>
          <select
            id="arrangementType"
            name="arrangementType"
            value={formData.arrangementType}
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
          composers={scoreComposers}
          setComposers={setScoreComposers}
          existingComposers={existingComposers}
          setExistingComposers={setExistingComposers}
        />

        <PartList parts={parts} setParts={setParts} />

        <TagsList
          tags={scoreTags}
          setTags={setScoreTags}
          existingTags={scoreTags}
          setExistingTags={setScoreTags}
        />

        <MedleyList
          medleys={medleys}
          setMedleys={setMedleys}
          existingComposers={existingComposers}
          setExistingComposers={setExistingComposers}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Adding Score..." : "Add Score"}
        </button>
      </form>
      <AddEditVendorPopup
        open={showVendorPopup}
        onClose={() => setShowVendorPopup(false)}
        onSuccess={handleNewVendorSuccess}
      />
    </div>
  );
}
