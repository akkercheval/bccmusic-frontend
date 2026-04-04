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
import AddEditVendorPopup from "../components/AddEditVendorPopup";

interface Vendor {
  vendorId: number;
  vendorName: string;
}

interface CollaborationInfo {
  ownerAccountId: number;
  ownerAccountName: string;
  permissionLevel: string;
}

export default function AddNewScore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    scoreTitle: "",
    scoreSubtitle: "",
    owner: "",
    purchasedFrom: "",
    purchasedDate: null as string | null,
    purchasedCost: null as string | null,
    grade: null as string | null,
    arrangementType: "",
  });

  // Complex data states
  const [parts, setParts] = useState<Part[]>([]);
  const [scoreTags, setScoreTags] = useState<
    { scoreTagId?: number; scoreId?: number; tag: string }[]
  >([]);
  const [allowedOwners, setAllowedOwners] = useState<CollaborationInfo[]>([]);
  const [arrangementTypes, setArrangementTypes] = useState<
    { code: string; name: string }[]
  >([]);
  const [existingComposers, setExistingComposers] = useState<
    {
      composerId: number;
      firstName?: string;
      middleName?: string;
      lastName: string;
    }[]
  >([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [medleys, setMedleys] = useState<
    {
      medleyId?: number;
      scoreId?: number;
      pieceTitle: string;
      composerId?: number;
    }[]
  >([]);
  const [existingVendors, setExistingVendors] = useState<Vendor[]>([]);

  // UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVendorPopup, setShowVendorPopup] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Score composers managed by ComposerList component
  const [scoreComposers, setScoreComposers] = useState<ComposerEntry[]>([
    { contributionType: "" },
  ]);

  // Fetch all initial data safely
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchInitialData = async () => {
      setLoadingData(true);
      setServerError(null);

      try {
        const [ownersRes, composersRes, arrangementRes, vendorsRes, tagsRes] =
          await Promise.all([
            api.get("/collaborators/myAllowedOwners"),
            api.get("/composers"),
            api.get("/arrangement-types"),
            api.get("/vendors"),
            api.get("/score-tags"),
          ]);

        // Safe array handling for all responses
        setAllowedOwners(Array.isArray(ownersRes.data) ? ownersRes.data : []);
        setExistingComposers(
          Array.isArray(composersRes.data) ? composersRes.data : [],
        );
        setArrangementTypes(
          Array.isArray(arrangementRes.data) ? arrangementRes.data : [],
        );
        setExistingVendors(
          Array.isArray(vendorsRes.data) ? vendorsRes.data : [],
        );

        setExistingTags(
          Array.isArray(tagsRes.data)
            ? tagsRes.data.map((t: { tag: string }) => t.tag)
            : [],
        );
      } catch (err: any) {
        console.error("Failed to load initial data:", err);
        setServerError(
          "Failed to load some required data. Please try refreshing the page.",
        );

        // Safe fallbacks
        setAllowedOwners([]);
        setExistingComposers([]);
        setArrangementTypes([]);
        setExistingVendors([]);
        setExistingTags([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchInitialData();
  }, [authLoading, user]);

  // Redirect if not authenticated
  if (authLoading) return <div>Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "scoreTitle":
        return !value.trim() ? "Score title is required" : "";
      case "arrangementType":
        return !value.trim() ? "Arrangement type is required" : "";
      case "owner":
        return !value ? "Please select an owner" : "";
      default:
        return "";
    }
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

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setErrors({});
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Final validation
    const newErrors: Record<string, string> = {};
    if (!formData.scoreTitle.trim())
      newErrors.scoreTitle = "Score title is required";
    if (!formData.arrangementType)
      newErrors.arrangementType = "Arrangement type is required";
    if (!formData.owner) newErrors.owner = "Please select an owner";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setServerError("Please fix the errors above.");
      setIsLoading(false);
      return;
    }

    const payload = {
      scoreTitle: formData.scoreTitle.trim(),
      scoreSubtitle: formData.scoreSubtitle?.trim() || null,
      owner: { accountId: parseInt(formData.owner) },
      purchasedFrom: formData.purchasedFrom
        ? { vendorId: parseInt(formData.purchasedFrom) }
        : null,
      purchasedDate: formData.purchasedDate || null,
      purchasedCost: formData.purchasedCost
        ? parseFloat(formData.purchasedCost)
        : null,
      grade: formData.grade ? parseFloat(formData.grade) : null,
      arrangementType: { code: formData.arrangementType },
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

    try {
      await api.post("/scores", payload);
      setSuccessMessage("Score added successfully!");

      // Optional: reset form or navigate after success
      navigate("/scores"); // uncomment if you want to redirect
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
            disabled={loadingData}
          >
            <option value="">Select owner...</option>
            {allowedOwners.map((o) => (
              <option key={o.ownerAccountId} value={o.ownerAccountId}>
                {o.ownerAccountName}
              </option>
            ))}
          </select>
          {touched.owner && errors.owner && (
            <span className="error">{errors.owner}</span>
          )}
          {loadingData && <small>Loading available owners...</small>}
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
            disabled={loadingData}
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
          existingTags={existingTags}
          setExistingTags={setExistingTags}
        />

        <MedleyList
          medleys={medleys}
          setMedleys={setMedleys}
          existingComposers={existingComposers}
          setExistingComposers={setExistingComposers}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || loadingData}
        >
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
