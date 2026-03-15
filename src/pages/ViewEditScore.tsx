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
    composer: { composerId: number; fullName: string };
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
      composer: { composerId: number; fullName: string };
    }[]
  >([]);

  const canEdit = user && score && user.accountId === score.owner.accountId;

  // Fetch the score
  useEffect(() => {
    const loadScore = async () => {
      try {
        const res = await api.get(`/scores/${scoreId}`);
        const data = res.data;

        setScore(data);
        setScoreComposers(data.scoreComposers || []);
        setParts(data.parts || []);
        setScoreTags(data.scoreTags || []);
        setMedleys(data.medleys || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Score not found");
      } finally {
        setIsLoading(false);
      }
    };
    loadScore();
  }, [scoreId]);

  const handleSave = async () => {
    if (!score) return;

    const payload = {
      scoreTitle: score.scoreTitle,
      scoreSubtitle: score.scoreSubtitle || null,
      owner: { accountId: score.owner.accountId },
      purchasedFrom: score.purchasedFrom || null,
      purchasedDate: score.purchasedDate || null,
      purchasedCost: score.purchasedCost || null,
      grade: score.grade || null,
      arrangementType: score.arrangementType,
      scoreComposers: scoreComposers,
      parts: parts,
      scoreTags: scoreTags,
      medleys: medleys,
    };

    try {
      await api.put(`/scores/${scoreId}`, payload);
      alert("Score saved successfully!");
      setIsEditing(false);
      // Refresh the page data
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save");
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
        <h1>
          {isEditing ? "Editing" : "Viewing"}
          <br />
        </h1>
        <div className="score-details">
          <h2>{score.scoreTitle}</h2>
          {score.owner && (
            <p>
              <strong>Owner:</strong> {score.owner.accountName}
            </p>
          )}
          {score.scoreSubtitle && (
            <p>
              <strong>Subtitle:</strong> {score.scoreSubtitle}
            </p>
          )}
          {score.scoreComposers && score.scoreComposers.length > 0 && (
            <p>
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
            </p>
          )}

          {/* Medleys */}
          {score.medleys && score.medleys.length > 0 && (
            <p>
              <strong>Medleys:</strong>
              <br />
              {score.medleys.map((m, i) => (
                <span key={i}>
                  {m.pieceTitle} by{" "}
                  {m.composer?.fullName ||
                    `Composer #${m.composer?.composerId}`}
                  {i < score.medleys.length - 1 ? <br /> : ""}
                </span>
              ))}
            </p>
          )}

          <p>
            <strong>Grade:</strong> {score.grade ?? "—"}
          </p>

          {score.arrangementType && (
            <p>
              <strong>Arrangement Type:</strong>{" "}
              {score.arrangementType.name || score.arrangementType.code}
            </p>
          )}

          {score.purchasedFrom && (
            <p>
              <strong>Purchased From:</strong> {score.purchasedFrom.vendorName}
            </p>
          )}

          {score.purchasedDate && (
            <p>
              <strong>Purchased Date:</strong> {score.purchasedDate}
            </p>
          )}

          {score.purchasedCost !== undefined && (
            <p>
              <strong>Purchased Cost:</strong> ${score.purchasedCost.toFixed(2)}
            </p>
          )}

          {/* Parts with proper Flex Parts line */}
          {score.parts && score.parts.length > 0 && (
            <p>
              <strong>Parts:</strong>
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
                  <p key={part.partId || part.instrument} className="part-row">
                    {part.instrument} — Regular: {part.regularPartCount}
                    {part.hasSolo && " (Solo)"}
                    {flexStr && ` — ${flexStr}`}
                  </p>
                );
              })}
            </p>
          )}

          {/* Tags */}
          {score.scoreTags && score.scoreTags.length > 0 && (
            <p>
              <strong>Tags:</strong>{" "}
              {score.scoreTags.map((t) => t.tag).join(", ")}
            </p>
          )}
        </div>

        {canEdit && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="primary-button"
            >
              {isEditing ? "Cancel Edit" : "✏️ Edit Score"}
            </button>
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="primary-button"
                  style={{ marginLeft: "1rem" }}
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={handleDelete}
                  className="secondary-button"
                  style={{ marginLeft: "1rem", background: "#ff6b6b" }}
                >
                  🗑️ Delete Score
                </button>
              </>
            )}
          </div>
        )}

        {/* Reusable components — editable only when isEditing === true */}
        {isEditing && (
          <>
            <ComposerList
              composers={scoreComposers}
              setComposers={isEditing ? setScoreComposers : () => {}}
              existingComposers={[]}
              setExistingComposers={() => {}}
            />
            <PartList
              parts={parts}
              setParts={isEditing ? setParts : () => {}}
            />
            <TagsList
              tags={scoreTags}
              setTags={isEditing ? setScoreTags : () => {}}
              existingTags={[]}
              setExistingTags={() => {}}
            />
            <MedleyList
              medleys={medleys}
              setMedleys={isEditing ? setMedleys : () => {}}
              existingComposers={[]}
              setExistingComposers={() => {}}
            />
          </>
        )}
      </div>
    </div>
  );
}
