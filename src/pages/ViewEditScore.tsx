import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./ViewEditScore.css";

import ComposerList from "../components/ComposerList";
import PartList from "../components/PartList";
import TagsList from "../components/TagsList";
import MedleyList from "../components/MedleyList";

import type { Part } from "../components/PartList";

interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  scoreSubtitle?: string;
  owner: { accountId: number; accountName: string };
  purchasedFrom?: { vendorId?: number; vendorName?: string };
  purchasedDate?: string;
  purchasedCost?: number;
  grade?: number;
  arrangementType: { code: string; name?: string };
  scoreComposers: {
    scoreComposerId?: number;
    scoreId?: number;
    composer: {
      composerId?: number;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      fullName?: string;
    };
    contributionType: string;
  }[];
  parts: Part[];
  scoreTags: { scoreTagId: number; tag: string }[];
  medleys: {
    medleyId: number;
    pieceTitle: string;
    composer: {
      composerId: number;
      firstName?: string;
      middleName?: string;
      lastName: string;
      fullName: string;
    };
  }[];
}

export default function ViewEditScore() {
  const { scoreId } = useParams<{ scoreId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [score, setScore] = useState<MusicScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scoreComposers, setScoreComposers] = useState<
    {
      scoreComposerId: number;
      scoreId: number;
      composer: {
        composerId: number;
        firstName: string;
        middleName: string;
        lastName: string;
        fullName: string;
      };
      contributionType: string;
    }[]
  >([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [scoreTags, setScoreTags] = useState<
    { scoreTagId: number; tag: string }[]
  >([]);
  const [medleys, setMedleys] = useState<
    {
      medleyId: number;
      pieceTitle: string;
      composer: {
        composerId: number;
        firstName?: string;
        middleName?: string;
        lastName: string;
        fullName: string;
      };
    }[]
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
  const [arrangementTypes, setArrangementTypes] = useState<
    { code: string; name: string }[]
  >([]);

  const canEdit = user && score && user.accountId === score.owner.accountId;

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [scoreRes, composersRes, arrRes, existingTagsRes] =
          await Promise.all([
            api.get(`/scores/${scoreId}`),
            api.get("/composers"),
            api.get("/arrangement-types"),
            api.get("/score-tags"),
          ]);

        const data = scoreRes.data;
        const normalizedComposers = (data.scoreComposers || []).map(
          (sc: any) => ({
            ...sc,
            composerId: sc.composer?.composerId,
            firstName: sc.composer?.firstName,
            middleName: sc.composer?.middleName,
            lastName: sc.composer?.lastName,
            fullName: sc.composer?.fullName,
          }),
        );

        const normalizedMedleys = (data.medleys || []).map((m: any) => ({
          ...m,
          composerId: m.composer?.composerId,
          firstName: m.composer?.firstName,
          middleName: m.composer?.middleName,
          lastName: m.composer?.lastName,
          fullName: m.composer?.fullName,
        }));

        setScore(data);
        setScoreComposers(normalizedComposers);
        setParts(data.parts || []);
        setScoreTags(data.scoreTags || []);
        setMedleys(normalizedMedleys);
        setExistingComposers(composersRes.data);
        setExistingTags(existingTagsRes.data);
        setArrangementTypes(arrRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Score not found");
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [scoreId]);

  const handleSave = async () => {
    if (!score) return;

    const payload = {
      scoreId: score.scoreId,
      scoreTitle: score.scoreTitle,
      scoreSubtitle: score.scoreSubtitle || null,
      owner: { accountId: score.owner.accountId },
      purchasedFrom: score.purchasedFrom || null,
      purchasedDate: score.purchasedDate || null,
      purchasedCost: score.purchasedCost || null,
      grade: score.grade || null,
      arrangementType: score.arrangementType,
      scoreComposers: scoreComposers.map((c) => ({
        scoreComposerId: c.scoreComposerId ?? null,
        composer: { composerId: c.composer?.composerId || c.composerId },
        contributionType: c.contributionType,
      })),
      parts: parts,
      scoreTags: scoreTags,
      medleys: medleys.map((m) => {
        const composerInfo = existingComposers.find(
          (c) => c.composerId === m.composerId,
        );

        const displayName =
          [
            composerInfo?.firstName,
            composerInfo?.middleName,
            composerInfo?.lastName,
          ]
            .filter(Boolean)
            .join(" ") || `Composer #${m.composerId || "unknown"}`;

        return {
          pieceTitle: m.pieceTitle,
          medleyId: m.medleyId,
          composer: composerInfo
            ? {
                composerId: composerInfo.composerId,
                firstName: composerInfo.firstName,
                middleName: composerInfo.middleName,
                lastName: composerInfo.lastName,
                fullName: displayName,
              }
            : {
                composerId: m.composerId,
                lastName: "Unknown Composer",
              }, // fallback (should never hit after a successful select)
        };
      }),
    };

    console.log("Saving score with payload:", payload);
    console.log("Parts payload:", parts);
    console.log("Tags payload:", scoreTags);
    console.log("Medleys payload:", medleys);

    try {
      await api.put(`/scores/${scoreId}`, payload);
      alert("✅ Score saved successfully!");
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save changes.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this score permanently?")) return;
    try {
      await api.delete(`/scores/${scoreId}`);
      alert("Score deleted");
      navigate("/my-scores");
    } catch (err) {
      alert("Failed to delete");
    }
  };

  if (isLoading) return <div className="loading">Loading score...</div>;
  if (error || !score)
    return <div className="error-message">{error || "Score not found"}</div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <h1>{isEditing ? "Editing" : "Viewing"}</h1>
        {!isEditing && (
          <div className="score-details">
            <h2>{score.scoreTitle}</h2>
            <button
              onClick={() => navigate("/my-scores")}
              className="back-button"
            >
              ← Back to My Scores
            </button>
            {score.owner && (
              <div>
                <strong>Owner:</strong> {score.owner.accountName}
              </div>
            )}
            {score.scoreSubtitle && (
              <div>
                <strong>Subtitle:</strong> {score.scoreSubtitle}
              </div>
            )}
            {score.scoreComposers && score.scoreComposers.length > 0 && (
              <div>
                {score.scoreComposers.map((c, i) => {
                  const name =
                    c.composer.fullName ||
                    `${c.composer.firstName || ""} ${c.composer.middleName || ""} ${c.composer.lastName || ""}`.trim() ||
                    `Composer #${c.composer.composerId}`;

                  const contributionDisplay =
                    c.contributionType === "COMPOSER"
                      ? "Composed by"
                      : c.contributionType === "ARRANGER"
                        ? "Arranged by"
                        : c.contributionType === "LYRICIST"
                          ? "Lyrics by"
                          : "Other Contribution";

                  return (
                    <span key={i}>
                      <strong>{contributionDisplay}:</strong> {name}
                      {i < score.scoreComposers.length - 1 ? <br /> : ""}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Medleys */}
            {score.medleys && score.medleys.length > 0 && (
              <div>
                <strong>Medleys:</strong>
                <div className="indented-list">
                  {score.medleys.map((m, i) => (
                    <p key={i}>
                      {m.pieceTitle} by{" "}
                      {m.composer?.fullName ||
                        `Composer #${m.composer?.composerId}`}
                      {i < score.medleys.length - 1 ? <br /> : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div>
              <strong>Grade:</strong> {score.grade ?? "—"}
            </div>

            {score.arrangementType && (
              <div>
                <strong>Arrangement Type:</strong>{" "}
                {score.arrangementType.name || score.arrangementType.code}
              </div>
            )}

            {score.purchasedFrom && (
              <div>
                <strong>Purchased From:</strong>{" "}
                {score.purchasedFrom.vendorName}
              </div>
            )}

            {score.purchasedDate && (
              <div>
                <strong>Purchased Date:</strong> {score.purchasedDate}
              </div>
            )}

            {score.purchasedCost !== undefined && (
              <div>
                <strong>Purchased Cost:</strong> $
                {score.purchasedCost.toFixed(2)}
              </div>
            )}

            {/* Parts with proper Flex Parts line */}
            {score.parts && score.parts.length > 0 && (
              <div>
                <strong>Parts:</strong>
                <div className="indented-list">
                  {score.parts.map((part) => {
                    let flexStr = "";
                    if (
                      part.flexMinPart !== null &&
                      part.flexPartCount !== null &&
                      part.flexPartCount > 0
                    ) {
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
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {score.scoreTags && score.scoreTags.length > 0 && (
              <div>
                <strong>Tags:</strong>{" "}
                {score.scoreTags.map((t) => t.tag).join(", ")}
              </div>
            )}
          </div>
        )}
        {canEdit && (
          <div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="primary-button"
            >
              {isEditing ? "🚫 Cancel Edit" : "✏️ Edit Score"}
            </button>
            {isEditing && (
              <>
                <button onClick={handleSave} className="primary-button">
                  💾 Save Changes
                </button>
                <button onClick={handleDelete} className="primary-button">
                  🗑️ Delete Score
                </button>
              </>
            )}
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleSave} noValidate>
            <div className="form-group">
              <label htmlFor="scoreTitle">Score Title*</label>
              <input
                type="text"
                id="scoreTitle"
                name="scoreTitle"
                value={score.scoreTitle}
                onChange={(e) =>
                  setScore({ ...score, scoreTitle: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="scoreSubtitle">Score Subtitle</label>
              <input
                type="text"
                id="scoreSubtitle"
                name="scoreSubtitle"
                value={score.scoreSubtitle || ""}
                onChange={(e) =>
                  setScore({ ...score, scoreSubtitle: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="grade">Grade</label>
              <input
                type="number"
                step="0.5"
                id="grade"
                value={score.grade || ""}
                onChange={(e) =>
                  setScore({
                    ...score,
                    grade: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="arrangementType">Arrangement Type*</label>
              <select
                id="arrangementType"
                value={score.arrangementType.code}
                onChange={(e) =>
                  setScore({
                    ...score,
                    arrangementType: { code: e.target.value },
                  })
                }
              >
                {arrangementTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="purchasedDate">Purchased Date</label>
              <input
                type="date"
                id="purchasedDate"
                value={score.purchasedDate || ""}
                onChange={(e) =>
                  setScore({ ...score, purchasedDate: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="purchasedCost">Purchased Cost</label>
              <input
                type="number"
                step="0.01"
                id="purchasedCost"
                value={score.purchasedCost || ""}
                onChange={(e) =>
                  setScore({
                    ...score,
                    purchasedCost: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>{" "}
            <ComposerList
              composers={scoreComposers}
              setComposers={setScoreComposers}
              existingComposers={existingComposers}
              setExistingComposers={setExistingComposers}
            />
            <MedleyList
              medleys={medleys}
              setMedleys={setMedleys}
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
          </form>
        )}
      </div>
    </div>
  );
}
