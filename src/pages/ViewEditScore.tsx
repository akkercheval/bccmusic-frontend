import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import { useScoreFormData } from "../hooks/useScoreFormData";
import PageTitle from "../components/PageTitle";
import ScoreForm, { type ScoreFormFields } from "../components/ScoreForm";

import type {
  MusicScore,
  MedleyEntry,
  Part,
  ScoreTag,
  Vendor,
  ComposerEntry,
} from "../types/score";

import "./ViewEditScore.css";

export default function ViewEditScore() {
  const { scoreId } = useParams<{ scoreId: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const backInfo = location.state?.from as string | undefined;

  // Shared reference data
  const {
    existingComposers,
    setExistingComposers,
    arrangementTypes,
    existingVendors,
    setExistingVendors,
    existingTags,
    setExistingTags,
  } = useScoreFormData();

  const [score, setScore] = useState<MusicScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing states
  const [scoreComposers, setScoreComposers] = useState<ComposerEntry[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [scoreTags, setScoreTags] = useState<ScoreTag[]>([]);
  const [medleys, setMedleys] = useState<MedleyEntry[]>([]);

  // Form fields for editing (derived from score)
  const [formFields, setFormFields] = useState<ScoreFormFields>({
    scoreTitle: "",
    scoreSubtitle: "",
    purchasedFrom: null,
    purchasedDate: null,
    purchasedCost: null,
    grade: null,
    arrangementType: "",
  });

  const canEdit = user && score && user.accountId === score.owner.accountId;

  const handleGoBack = () => {
    if (backInfo) {
      if (backInfo === "all-scores") navigate("/all-scores");
      else if (backInfo === "my-scores") navigate("/my-scores");
      else navigate(-1);
    } else {
      navigate(-1);
    }
  };

  // Load the score
  useEffect(() => {
    const loadScore = async () => {
      try {
        const res = await api.get(`/scores/${scoreId}`);
        const data: MusicScore = res.data;

        setScore(data);

        // Normalize composers for editing
        const normalizedComposers: ComposerEntry[] = (data.scoreComposers || []).map(
          (sc: any) => ({
            scoreComposerId: sc.scoreComposerId,
            composerId: sc.composer?.composerId,
            firstName: sc.composer?.firstName,
            middleName: sc.composer?.middleName,
            lastName: sc.composer?.lastName,
            fullName: sc.composer?.fullName,
            contributionType: sc.contributionType,
          }),
        );

        setScoreComposers(normalizedComposers);
        setParts(data.parts || []);
        setScoreTags(data.scoreTags || []);
        setMedleys(data.medleys || []);

        // Populate form fields
        setFormFields({
          scoreTitle: data.scoreTitle,
          scoreSubtitle: data.scoreSubtitle || "",
          purchasedFrom: data.purchasedFrom || null,
          purchasedDate: data.purchasedDate || null,
          purchasedCost: data.purchasedCost != null ? String(data.purchasedCost) : null,
          grade: data.grade != null ? String(data.grade) : null,
          arrangementType: data.arrangementType?.code || "",
        });
      } catch (err: unknown) {
        setError(extractErrorMessage(err, "Score not found"));
      } finally {
        setIsLoading(false);
      }
    };

    loadScore();
  }, [scoreId]);

  const handleFieldChange = (name: string, value: string) => {
    setFormFields((prev) => ({ ...prev, [name]: value }));
    // Also keep the score object in sync for view mode title
    if (name === "scoreTitle") {
      setScore((prev) => (prev ? { ...prev, scoreTitle: value } : prev));
    }
    if (name === "scoreSubtitle") {
      setScore((prev) => (prev ? { ...prev, scoreSubtitle: value } : prev));
    }
  };

  const handleVendorChange = (vendor: Vendor | null) => {
    setFormFields((prev) => ({ ...prev, purchasedFrom: vendor }));
    setScore((prev) => (prev ? { ...prev, purchasedFrom: vendor || undefined } : prev));
  };

  const handleSave = async () => {
    if (!score) return;

    const payload = {
      scoreId: score.scoreId,
      scoreTitle: formFields.scoreTitle.trim(),
      scoreSubtitle: formFields.scoreSubtitle?.trim() || null,
      owner: { accountId: score.owner.accountId },
      purchasedFrom: formFields.purchasedFrom || null,
      purchasedDate: formFields.purchasedDate || null,
      purchasedCost: formFields.purchasedCost ? parseFloat(formFields.purchasedCost) : null,
      grade: formFields.grade ? parseFloat(formFields.grade) : null,
      arrangementType: { code: formFields.arrangementType },
      scoreComposers: scoreComposers.map((c) => ({
        scoreComposerId: c.scoreComposerId ?? null,
        composer: {
          composerId: c.composerId!,
          firstName: c.firstName,
          middleName: c.middleName,
          lastName: c.lastName,
          fullName: c.fullName,
        },
        contributionType: c.contributionType,
      })),
      parts,
      scoreTags,
      medleys: medleys.map((m) => {
        const composerId = m.composerId ?? null;
        const composerInfo = existingComposers.find(
          (c) => c.composerId === composerId,
        );
        const displayName = composerInfo
          ? [composerInfo.firstName, composerInfo.middleName, composerInfo.lastName]
              .filter(Boolean)
              .join(" ") || `Composer #${composerInfo.composerId}`
          : `Composer #${composerId || "unknown"}`;

        return {
          scoreId: score.scoreId,
          pieceTitle: m.pieceTitle.trim(),
          medleyId: m.medleyId,
          composer: composerInfo
            ? {
                composerId: composerInfo.composerId,
                firstName: composerInfo.firstName,
                middleName: composerInfo.middleName,
                lastName: composerInfo.lastName,
                fullName: displayName,
              }
            : { composerId, lastName: "Unknown Composer" },
        };
      }),
    };

    const hasInvalidMedley = medleys.some(
      (m) => !m.composerId || m.composerId <= 0,
    );
    if (hasInvalidMedley) {
      alert("Please select a composer for every medley piece.");
      return;
    }

    try {
      await api.put(`/scores/${scoreId}`, payload);
      alert("✅ Score saved successfully!");
      setIsEditing(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(extractErrorMessage(err, "Failed to save changes."));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this score permanently?")) return;
    try {
      await api.delete(`/scores/${scoreId}`);
      alert("Score deleted");
      navigate("/my-scores");
    } catch (err) {
      alert("Failed to delete score.");
    }
  };

  if (isLoading) return <div className="loading">Loading score...</div>;
  if (error || !score)
    return <div className="error-message">{error || "Score not found"}</div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <PageTitle title={isEditing ? "Editing Score" : "Viewing Score"} />

        {/* View mode */}
        {!isEditing && score && (
          <div className="score-details">
            <h2>{score.scoreTitle}</h2>
            <div className="header-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleGoBack}
              >
                ← Back to List
              </button>
            </div>

            {score.scoreSubtitle && (
              <div><strong>Subtitle:</strong> {score.scoreSubtitle}</div>
            )}

            <div><strong>Owner:</strong> {score.owner.accountName}</div>

            {score.scoreComposers?.length > 0 && (
              <div>
                {score.scoreComposers.map((c, i) => {
                  const name =
                    c.composer.fullName ||
                    `${c.composer.firstName || ""} ${c.composer.middleName || ""} ${c.composer.lastName || ""}`.trim() ||
                    `Composer #${c.composer.composerId}`;
                  const contributionDisplay =
                    c.contributionType === "COMPOSER" ? "Composed by"
                    : c.contributionType === "ARRANGER" ? "Arranged by"
                    : c.contributionType === "LYRICIST" ? "Lyrics by"
                    : "Contribution by";
                  return (
                    <div key={i}><strong>{contributionDisplay}:</strong> {name}</div>
                  );
                })}
              </div>
            )}

            {score.medleys?.length > 0 && (
              <div>
                <strong>Medleys:</strong>
                <div className="indented-list">
                  {score.medleys.map((m, i) => (
                    <p key={i}>
                      {m.pieceTitle} by {m.composer?.fullName || `Composer #${m.composer?.composerId}`}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div><strong>Grade:</strong> {score.grade ?? "—"}</div>

            {score.arrangementType && (
              <div><strong>Arrangement Type:</strong> {score.arrangementType.name || score.arrangementType.code}</div>
            )}

            {score.purchasedFrom && (
              <div><strong>Purchased From:</strong> {score.purchasedFrom.vendorName}</div>
            )}

            {score.purchasedDate && (
              <div><strong>Purchased Date:</strong> {score.purchasedDate}</div>
            )}

            {score.purchasedCost != null && (
              <div><strong>Purchased Cost:</strong> ${score.purchasedCost.toFixed(2)}</div>
            )}

            {score.parts?.length > 0 && (
              <div>
                <strong>Parts:</strong>
                <div className="indented-list">
                  {score.parts.map((part) => {
                    let flexStr = "";
                    if (part.flexMinPart != null && part.flexPartCount != null && part.flexPartCount > 0) {
                      const flexNumbers = Array.from(
                        { length: part.flexPartCount },
                        (_, i) => part.flexMinPart! + i,
                      );
                      flexStr = `Flex Parts: ${flexNumbers.join(", ")}`;
                    }
                    return (
                      <p key={part.partId || part.instrument}>
                        {part.instrument} — Total Parts: {part.regularPartCount}
                        {part.hasSolo && " (Solo)"}
                        {flexStr && ` — ${flexStr}`}
                        {part.partComments && ` — ${part.partComments}`}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {score.scoreTags?.length > 0 && (
              <div><strong>Tags:</strong> {score.scoreTags.map((t) => t.tag).join(", ")}</div>
            )}

            {(score.updatedAt || score.updatedBy) && (
              <div className="audit-info">
                <strong>Last Updated:</strong>{" "}
                {score.updatedAt ? new Date(score.updatedAt).toLocaleDateString() : "—"}
                {score.updatedBy?.accountName && <> by {score.updatedBy.accountName}</>}
              </div>
            )}
          </div>
        )}

        {/* Edit controls */}
        {canEdit && (
          <div className="edit-controls">
            <button onClick={() => setIsEditing(!isEditing)} className="primary-button">
              {isEditing ? "🚫 Cancel Edit" : "✏️ Edit Score"}
            </button>
            {isEditing && (
              <>
                <button onClick={handleSave} className="primary-button">
                  💾 Save Changes
                </button>
                <button onClick={handleDelete} className="primary-button danger">
                  🗑️ Delete Score
                </button>
              </>
            )}
          </div>
        )}

        {/* Edit mode */}
        {isEditing && score && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} noValidate>
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
            />
          </form>
        )}
      </div>
    </div>
  );
}
