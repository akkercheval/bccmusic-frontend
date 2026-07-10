import { useEffect, useState, useRef } from "react";
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
  ScoreComment,
  Vendor,
  ComposerEntry,
} from "../types/score";

import "./ViewEditScore.css";

type FeedbackType = "success" | "error" | "warning";

interface Feedback {
  type: FeedbackType;
  message: string;
}

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

  // Inline feedback state (replaces alert/confirm)
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss success feedback after 5 seconds
  useEffect(() => {
    if (feedback?.type === "success") {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Scroll feedback into view when it appears
  useEffect(() => {
    if (feedback && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [feedback]);

  // Editing states
  const [scoreComposers, setScoreComposers] = useState<ComposerEntry[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [scoreTags, setScoreTags] = useState<ScoreTag[]>([]);
  const [medleys, setMedleys] = useState<MedleyEntry[]>([]);
  const [comments, setComments] = useState<ScoreComment[]>([]);

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

  // Collapsible sections state (view mode)
  const [showParts, setShowParts] = useState(true);
  const [showMedleys, setShowMedleys] = useState(true);
  const [showComments, setShowComments] = useState(true);

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

        // Normalize medleys: extract composerId from nested composer object
        const normalizedMedleys: MedleyEntry[] = (data.medleys || []).map(
          (m: any) => ({
            medleyId: m.medleyId,
            scoreId: m.scoreId,
            pieceTitle: m.pieceTitle,
            composerId: m.composer?.composerId,
            firstName: m.composer?.firstName,
            middleName: m.composer?.middleName,
            lastName: m.composer?.lastName,
            fullName: m.composer?.fullName,
          }),
        );
        setMedleys(normalizedMedleys);

        setComments(data.comments || []);

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

    setFeedback(null);

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
      comments: comments.map((c) => ({
        commentId: c.commentId ?? null,
        scoreId: score.scoreId,
        comment: c.comment.trim(),
      })),
    };

    const hasInvalidMedley = medleys.some(
      (m) => !m.composerId || m.composerId <= 0,
    );
    if (hasInvalidMedley) {
      setFeedback({ type: "warning", message: "Please select a composer for every medley piece." });
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/scores/${scoreId}`, payload);
      setFeedback({ type: "success", message: "Score saved successfully!" });
      setIsEditing(false);
      // Reload score data to reflect saved changes
      const res = await api.get(`/scores/${scoreId}`);
      const data: MusicScore = res.data;
      setScore(data);
      setScoreComposers(
        (data.scoreComposers || []).map((sc: any) => ({
          scoreComposerId: sc.scoreComposerId,
          composerId: sc.composer?.composerId,
          firstName: sc.composer?.firstName,
          middleName: sc.composer?.middleName,
          lastName: sc.composer?.lastName,
          fullName: sc.composer?.fullName,
          contributionType: sc.contributionType,
        })),
      );
      setParts(data.parts || []);
      setScoreTags(data.scoreTags || []);
      setMedleys(
        (data.medleys || []).map((m: any) => ({
          medleyId: m.medleyId,
          scoreId: m.scoreId,
          pieceTitle: m.pieceTitle,
          composerId: m.composer?.composerId,
          firstName: m.composer?.firstName,
          middleName: m.composer?.middleName,
          lastName: m.composer?.lastName,
          fullName: m.composer?.fullName,
        })),
      );
      setComments(data.comments || []);
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
      setFeedback({ type: "error", message: extractErrorMessage(err, "Failed to save changes.") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setFeedback(null);
    setIsDeleting(true);
    try {
      await api.delete(`/scores/${scoreId}`);
      // Brief success message before navigating away
      setFeedback({ type: "success", message: "Score deleted. Redirecting..." });
      setTimeout(() => navigate("/my-scores"), 1200);
    } catch (err) {
      setFeedback({ type: "error", message: extractErrorMessage(err, "Failed to delete score.") });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="loading">Loading score...</div>;
  if (error || !score)
    return <div className="error-message">{error || "Score not found"}</div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <PageTitle title={isEditing ? "Editing Score" : "Viewing Score"} />

        {/* Top action bar — always visible */}
        <div className="score-action-bar">
          <button
            type="button"
            className="primary-button"
            onClick={handleGoBack}
          >
            ← Back to List
          </button>
          {canEdit && !isEditing && (
            <button
              onClick={() => { setIsEditing(true); setFeedback(null); setShowDeleteConfirm(false); }}
              className="primary-button"
            >
              ✏️ Edit Score
            </button>
          )}
          {canEdit && isEditing && (
            <>
              <button onClick={handleSave} className="primary-button" disabled={isSaving}>
                {isSaving ? "💾 Saving..." : "💾 Save Changes"}
              </button>
              <button onClick={() => { setIsEditing(false); setFeedback(null); setShowDeleteConfirm(false); }} className="primary-button">
                🚫 Cancel
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="primary-button danger" disabled={showDeleteConfirm}>
                🗑️ Delete
              </button>
            </>
          )}
        </div>

        {/* Inline feedback messages */}
        {feedback && (
          <div
            ref={feedbackRef}
            className={`inline-feedback inline-feedback--${feedback.type}`}
            role={feedback.type === "error" || feedback.type === "warning" ? "alert" : "status"}
            aria-live="polite"
          >
            <span className="inline-feedback__icon">
              {feedback.type === "success" && "✓"}
              {feedback.type === "error" && "✗"}
              {feedback.type === "warning" && "⚠"}
            </span>
            <span className="inline-feedback__message">{feedback.message}</span>
            <button
              type="button"
              className="inline-feedback__dismiss"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Delete confirmation inline */}
        {showDeleteConfirm && (
          <div className="delete-confirm" role="alertdialog" aria-labelledby="delete-confirm-title">
            <p id="delete-confirm-title" className="delete-confirm__message">
              🗑️ Delete this score permanently? This cannot be undone.
            </p>
            <div className="delete-confirm__actions">
              <button
                type="button"
                className="primary-button danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* View mode */}
        {!isEditing && score && (
          <div className="score-details">
            {/* Title & ID */}
            <div className="score-header">
              <h2>{score.scoreTitle}</h2>
              <span className="score-id">Score #{score.scoreId}</span>
            </div>

            {score.scoreSubtitle && (
              <div className="score-subtitle-view">{score.scoreSubtitle}</div>
            )}

            {/* Composition section */}
            <div className="score-section">
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

              {score.arrangementType && (
                <div><strong>Arrangement Type:</strong> {score.arrangementType.name || score.arrangementType.code}</div>
              )}

              <div><strong>Grade:</strong> {score.grade ?? "—"}</div>
            </div>

            {/* Medleys */}
            {score.medleys?.length > 0 && (
              <div className="score-section">
                <div className="score-section-header" onClick={() => setShowMedleys(!showMedleys)}>
                  <span className={`score-section-toggle ${showMedleys ? "score-section-toggle--open" : ""}`}>▶</span>
                  <strong>Medleys</strong>
                  <span className="score-section-count">({score.medleys.length})</span>
                </div>
                {showMedleys && (
                  <div className="indented-list">
                    {score.medleys.map((m, i) => (
                      <p key={i}>
                        {m.pieceTitle} by {m.composer?.fullName || `Composer #${m.composer?.composerId}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Purchase info */}
            {(score.purchasedFrom || score.purchasedDate || score.purchasedCost != null) && (
              <div className="score-section">
                {score.purchasedFrom && (
                  <div><strong>Purchased From:</strong> {score.purchasedFrom.vendorName}</div>
                )}
                {score.purchasedDate && (
                  <div><strong>Purchased Date:</strong> {score.purchasedDate}</div>
                )}
                {score.purchasedCost != null && (
                  <div><strong>Purchased Cost:</strong> ${score.purchasedCost.toFixed(2)}</div>
                )}
              </div>
            )}

            {/* Parts */}
            {score.parts?.length > 0 && (
              <div className="score-section">
                <div className="score-section-header" onClick={() => setShowParts(!showParts)}>
                  <span className={`score-section-toggle ${showParts ? "score-section-toggle--open" : ""}`}>▶</span>
                  <strong>Parts</strong>
                  <span className="score-section-count">({score.parts.length})</span>
                </div>
                {showParts && (
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
                )}
              </div>
            )}

            {/* Tags */}
            {score.scoreTags?.length > 0 && (
              <div className="score-section">
                <strong>Tags:</strong> {score.scoreTags.map((t) => t.tag).join(", ")}
              </div>
            )}

            {/* Comments */}
            {score.comments?.length > 0 && (
              <div className="score-section">
                <div className="score-section-header" onClick={() => setShowComments(!showComments)}>
                  <span className={`score-section-toggle ${showComments ? "score-section-toggle--open" : ""}`}>▶</span>
                  <strong>Comments</strong>
                  <span className="score-section-count">({score.comments.length})</span>
                </div>
                {showComments && (
                  <div className="indented-list">
                    {score.comments.map((c, i) => (
                      <p key={c.commentId || i}>
                        {c.comment}
                        {c.updatedAt ? (
                          <span className="comment-view-meta">
                            {" "}— Updated {new Date(c.updatedAt).toLocaleDateString()} by {c.updatedByAccountName || "Unknown"}
                          </span>
                        ) : c.createdAt ? (
                          <span className="comment-view-meta">
                            {" "}— Added {new Date(c.createdAt).toLocaleDateString()} by {c.createdByAccountName || "Unknown"}
                          </span>
                        ) : null}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audit info */}
            {(score.updatedAt || score.updatedBy) && (
              <div className="audit-info">
                <strong>Last Updated:</strong>{" "}
                {score.updatedAt ? new Date(score.updatedAt).toLocaleDateString() : "—"}
                {score.updatedBy?.accountName && <> by {score.updatedBy.accountName}</>}
              </div>
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
              comments={comments}
              setComments={setComments}
              currentUserId={user!.accountId}
              commentPermission={canEdit ? "full" : "limited"}
            />
          </form>
        )}
      </div>
    </div>
  );
}
