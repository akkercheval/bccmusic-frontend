import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ComposerList from "../components/ComposerList";
import PartList from "../components/PartList";
import TagsList from "../components/TagsList";
import MedleyList, { type MedleyEntry } from "../components/MedleyList";
import type { Part } from "../components/PartList";
import AddEditVendorPopup from "../components/AddEditVendorPopup";
import "./ViewEditScore.css";

interface Vendor {
  vendorId: number;
  vendorName: string;
}

type TagEntry = { scoreTagId?: number; tag: string };

interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  scoreSubtitle?: string;
  owner: { accountId: number; accountName: string };
  purchasedFrom?: Vendor;
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
  scoreTags: TagEntry[];
  medleys: {
    medleyId?: number;
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
  const location = useLocation();
  const navigate = useNavigate();

  const backInfo = location.state?.from as string | undefined;

  const [score, setScore] = useState<MusicScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVendorPopup, setShowVendorPopup] = useState(false);
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
  const [scoreTags, setScoreTags] = useState<TagEntry[]>([]);
  const [medleys, setMedleys] = useState<MedleyEntry[]>([]);
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
  const [existingVendors, setExistingVendors] = useState<Vendor[]>([]);

  const canEdit = user && score && user.accountId === score.owner.accountId;

  const handleGoBack = () => {
    if (backInfo) {
      if (backInfo === "all-scores") {
        navigate("/all-scores");
      } else if (backInfo === "my-scores") {
        navigate("/my-scores");
      } else {
        navigate(-1); // fallback
      }
    } else {
      // No state → probably direct link or refresh → safe back or fallback
      navigate(-1);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [scoreRes, composersRes, arrRes, vendorsRes, tagsRes] =
          await Promise.all([
            api.get(`/scores/${scoreId}`),
            api.get("/composers"),
            api.get("/arrangement-types"),
            api.get("/vendors"),
            api.get("/score-tags"),
          ]);

        setExistingComposers(composersRes.data);
        setExistingTags(tagsRes.data);
        setArrangementTypes(arrRes.data);
        setExistingVendors(vendorsRes.data);

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
        setScore(data);
        setScoreComposers(normalizedComposers);
        setParts(data.parts || []);
        setScoreTags(data.scoreTags || []);
        setMedleys(data.medleys || []);
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
        composer: { composerId: c.composer?.composerId },
        contributionType: c.contributionType,
      })),
      parts: parts,
      scoreTags: scoreTags,
      medleys: medleys.map((m) => {
        const composerId = m.composerId ?? null; // flat only now

        const composerInfo = existingComposers.find(
          (c) => c.composerId === composerId,
        );

        const displayName = composerInfo
          ? [
              composerInfo.firstName,
              composerInfo.middleName,
              composerInfo.lastName,
            ]
              .filter(Boolean)
              .join(" ") || `Composer #${composerInfo.composerId}`
          : `Composer #${composerId || "unknown"}`;

        return {
          scoreId: score.scoreId,
          pieceTitle: m.pieceTitle,
          medleyId: m.medleyId, // undefined for new = fine
          composer: composerInfo
            ? {
                composerId: composerInfo.composerId,
                firstName: composerInfo.firstName,
                middleName: composerInfo.middleName,
                lastName: composerInfo.lastName,
                fullName: displayName,
              }
            : {
                composerId: composerId,
                lastName: "Unknown Composer",
              },
        };
      }),
    };

    const hasInvalidMedley = medleys.some((m) => {
      const cid =
        (m as { composerId?: number }).composerId ??
        (m as { composer?: { composerId?: number } }).composer?.composerId;
      return !cid || cid <= 0;
    });
    if (hasInvalidMedley) {
      alert("Please select a composer for every medley piece.");
      return;
    }

    console.log("Saving score with payload:", payload);
    console.log("Parts payload:", parts);
    console.log("Tags payload:", scoreTags);
    console.log("Medleys payload:", medleys);

    try {
      console.log("Medleys being saved:", JSON.stringify(medleys, null, 2));
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

  const handleNewVendorSuccess = (newVendor: Vendor) => {
    setExistingVendors((prev) => [...prev, newVendor]);
    setScore((prev) => (prev ? { ...prev, purchasedFrom: newVendor } : prev));
    setShowVendorPopup(false);
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
            <div className="header-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleGoBack}
              >
                ← Back to List
              </button>
            </div>
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
                      part.flexMinPart != null &&
                      part.flexPartCount != null &&
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
                  setScore((prev) =>
                    prev ? { ...prev, scoreTitle: e.target.value } : prev,
                  )
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
                  setScore((prev) =>
                    prev ? { ...prev, scoreSubtitle: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="purchasedFrom">Purchased From</label>
              <select
                id="purchasedFrom"
                name="purchasedFrom"
                value={score.purchasedFrom?.vendorName || ""}
                onChange={(e) => {
                  if (e.target.value === "new") {
                    setShowVendorPopup(true);
                  } else {
                    const selectedVendor = existingVendors.find(
                      (v) => v.vendorName === e.target.value,
                    );
                    setScore((prev) =>
                      prev
                        ? {
                            ...prev,
                            purchasedFrom: selectedVendor || undefined,
                          }
                        : prev,
                    );
                  }
                }}
              >
                <option value="">— Select or create vendor —</option>
                {existingVendors.map((v) => (
                  <option key={v.vendorId} value={v.vendorName}>
                    {v.vendorName}
                  </option>
                ))}
                <option value="new">+ Create new vendor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="grade">Grade</label>
              <input
                type="number"
                step="0.5"
                id="grade"
                value={score.grade || ""}
                onChange={(e) =>
                  setScore((prev) =>
                    prev
                      ? {
                          ...prev,
                          grade: parseFloat(e.target.value) || undefined,
                        }
                      : prev,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="arrangementType">Arrangement Type*</label>
              <select
                id="arrangementType"
                value={score.arrangementType.code}
                onChange={(e) =>
                  setScore((prev) =>
                    prev
                      ? { ...prev, arrangementType: { code: e.target.value } }
                      : prev,
                  )
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
                  setScore((prev) =>
                    prev ? { ...prev, purchasedDate: e.target.value } : prev,
                  )
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
                  setScore((prev) =>
                    prev
                      ? {
                          ...prev,
                          purchasedCost:
                            parseFloat(e.target.value) || undefined,
                        }
                      : prev,
                  )
                }
              />
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
          </form>
        )}
      </div>
      <AddEditVendorPopup
        open={showVendorPopup}
        onClose={() => setShowVendorPopup(false)}
        onSuccess={handleNewVendorSuccess}
      />
    </div>
  );
}
