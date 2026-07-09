import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import { useScoreFormData } from "../hooks/useScoreFormData";
import PageTitle from "../components/PageTitle";
import ScoreForm, { type ScoreFormFields } from "../components/ScoreForm";
import type {
  Part,
  ComposerEntry,
  MedleyEntry,
  ScoreTag,
  Vendor,
  CreateScoreRequest,
} from "../types/score";
import "./AddNewScore.css";

interface CollaborationInfo {
  ownerAccountId: number;
  ownerAccountName: string;
  permissionLevel: string;
}

export default function AddNewScore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Shared reference data
  const {
    existingComposers,
    setExistingComposers,
    arrangementTypes,
    existingVendors,
    setExistingVendors,
    existingTags,
    setExistingTags,
    loading: refDataLoading,
    error: refDataError,
  } = useScoreFormData();

  // Form state
  const [formFields, setFormFields] = useState<ScoreFormFields>({
    scoreTitle: "",
    scoreSubtitle: "",
    purchasedFrom: null,
    purchasedDate: null,
    purchasedCost: null,
    grade: null,
    arrangementType: "",
  });

  const [owner, setOwner] = useState("");
  const [allowedOwners, setAllowedOwners] = useState<CollaborationInfo[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);

  const [parts, setParts] = useState<Part[]>([]);
  const [scoreTags, setScoreTags] = useState<ScoreTag[]>([]);
  const [medleys, setMedleys] = useState<MedleyEntry[]>([]);
  const [scoreComposers, setScoreComposers] = useState<ComposerEntry[]>([
    { contributionType: "" },
  ]);

  // UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isOwner = user && user.accountType === "OWNER";

  // Fetch allowed owners (specific to Add page)
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchOwners = async () => {
      try {
        const res = await api.get("/collaborators/myAllowedOwners");
        const owners: CollaborationInfo[] = Array.isArray(res.data) ? res.data : [];
        setAllowedOwners(owners);

        // Default the owner selection
        if (owners.length > 0) {
          const selfOwner = owners.find((o) => o.ownerAccountId === user.accountId);
          const defaultOwner = selfOwner || owners[0];
          setOwner(String(defaultOwner.ownerAccountId));
        }
      } catch (err) {
        console.error("Failed to load owners:", err);
      } finally {
        setOwnersLoading(false);
      }
    };

    fetchOwners();
  }, [authLoading, user]);

  // Show ref data error
  useEffect(() => {
    if (refDataError) setServerError(refDataError);
  }, [refDataError]);

  // Redirect if not authenticated
  if (authLoading) return <div>Loading...</div>;
  if (!user) {
    navigate("/login");
    return null;
  }

  const loadingData = refDataLoading || ownersLoading;

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

  const handleFieldChange = (name: string, value: string) => {
    setFormFields((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleVendorChange = (vendor: Vendor | null) => {
    setFormFields((prev) => ({ ...prev, purchasedFrom: vendor }));
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOwner(e.target.value);
    if (touched.owner) {
      const error = validateField("owner", e.target.value);
      setErrors((prev) => ({ ...prev, owner: error }));
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
    if (!formFields.scoreTitle.trim()) newErrors.scoreTitle = "Score title is required";
    if (!formFields.arrangementType) newErrors.arrangementType = "Arrangement type is required";
    if (!owner) newErrors.owner = "Please select an owner";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setServerError("Please fix the errors above.");
      setIsLoading(false);
      return;
    }

    const payload: CreateScoreRequest = {
      scoreTitle: formFields.scoreTitle.trim(),
      scoreSubtitle: formFields.scoreSubtitle?.trim() || null,
      owner: { accountId: parseInt(owner) },
      purchasedFrom: formFields.purchasedFrom || null,
      purchasedDate: formFields.purchasedDate || null,
      purchasedCost: formFields.purchasedCost ? parseFloat(formFields.purchasedCost) : null,
      grade: formFields.grade ? parseFloat(formFields.grade) : null,
      arrangementType: { code: formFields.arrangementType },
      scoreComposers: scoreComposers.map((c) => ({
        composer: { composerId: c.composerId! },
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
      if (isOwner) navigate("/my-scores");
      else navigate("/all-scores");
    } catch (err: unknown) {
      console.error("Submit error:", err);
      setServerError(extractErrorMessage(err, "Failed to add score. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-score-form">
      <PageTitle title="Add a New Score" />

      {serverError && <div className="server-error">{serverError}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <ScoreForm
          fields={formFields}
          onFieldChange={handleFieldChange}
          onVendorChange={handleVendorChange}
          arrangementTypes={arrangementTypes}
          existingComposers={existingComposers}
          setExistingComposers={setExistingComposers}
          existingVendors={existingVendors}
          setExistingVendors={setExistingVendors}
          existingTags={existingTags}
          setExistingTags={setExistingTags}
          composers={scoreComposers}
          setComposers={setScoreComposers}
          parts={parts}
          setParts={setParts}
          scoreTags={scoreTags}
          setScoreTags={setScoreTags}
          medleys={medleys}
          setMedleys={setMedleys}
          errors={errors}
          touched={touched}
          onBlur={handleBlur}
          loadingData={loadingData}
        >
          {/* Owner selector — only on Add page */}
          <div className="form-group">
            <label htmlFor="owner">Score Owner*</label>
            <select
              id="owner"
              name="owner"
              value={owner}
              onChange={handleOwnerChange}
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
          </div>
        </ScoreForm>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || loadingData}
          className="primary-button"
        >
          {isLoading ? "Adding Score..." : "Save Score"}
        </button>
      </form>
    </div>
  );
}
