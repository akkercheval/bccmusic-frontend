import React, { useState } from "react";
import AddNewComposerPopup from "./AddEditComposerPopup";
import type { ComposerEntry } from "../types/score";
import "./ComposerList.css";

export interface ComposerListProps {
  composers: ComposerEntry[];
  setComposers: React.Dispatch<React.SetStateAction<ComposerEntry[]>>;
  existingComposers: {
    composerId: number;
    firstName?: string;
    middleName?: string;
    lastName: string;
  }[];
  setExistingComposers: React.Dispatch<
    React.SetStateAction<
      {
        composerId: number;
        firstName?: string;
        middleName?: string;
        lastName: string;
      }[]
    >
  >;
}

const CONTRIBUTION_TYPES = [
  { value: "COMPOSER", label: "Composer" },
  { value: "ARRANGER", label: "Arranger" },
  { value: "LYRICIST", label: "Lyricist" },
  { value: "OTHER", label: "Other" },
];

export default function ComposerList({
  composers,
  setComposers,
  existingComposers,
  setExistingComposers,
}: ComposerListProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const addComposer = () => {
    setComposers([...composers, { contributionType: "" }]);
  };

  const removeComposer = (index: number) => {
    setComposers(composers.filter((_, i) => i !== index));
  };

  const updateComposer = (
    index: number,
    field: keyof ComposerEntry,
    value: string | number | undefined,
  ) => {
    const newComposers = [...composers];
    newComposers[index] = { ...newComposers[index], [field]: value };
    setComposers(newComposers);
  };

  const handleComposerSelect = (index: number, value: string) => {
    if (value === "new") {
      setPendingIndex(index);
      setShowPopup(true);
      return;
    }

    if (!value) {
      updateComposer(index, "composerId", undefined);
      return;
    }

    const parsedId = Number(value);
    if (isNaN(parsedId)) return;

    updateComposer(index, "composerId", parsedId);
  };

  const handlePopupClose = () => {
    if (pendingIndex !== null) {
      updateComposer(pendingIndex, "composerId", undefined);
      setPendingIndex(null);
    }
    setShowPopup(false);
  };

  const handleNewComposerSuccess = (newComposer: {
    composerId: number;
    firstName?: string;
    middleName?: string;
    lastName: string;
  }) => {
    setExistingComposers((prev) => [...prev, newComposer]);

    if (pendingIndex !== null) {
      updateComposer(pendingIndex, "composerId", newComposer.composerId);
      setPendingIndex(null);
    }
    setShowPopup(false);
  };

  return (
    <div className="composer-section">
      <div className="section-label">Composers & Arrangers</div>
      {composers.length > 0 && (
        <>
          {composers.map((entry, index) => (
            <div key={index} className="composer-row">
              {/* Composer selection */}
              <div className="form-group">
                <label>Composer</label>
                <select
                  value={entry.composerId?.toString() ?? ""}
                  onChange={(e) => handleComposerSelect(index, e.target.value)}
                  disabled={showPopup}
                >
                  <option value="">— Select —</option>
                  {existingComposers.map((c) => (
                    <option key={c.composerId} value={c.composerId.toString()}>
                      {[c.firstName, c.middleName, c.lastName]
                        .filter(Boolean)
                        .join(" ") || `Composer #${c.composerId}`}
                    </option>
                  ))}
                  <option value="new">+ Create new composer</option>
                </select>
              </div>

              {/* Contribution type */}
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={entry.contributionType}
                  onChange={(e) =>
                    updateComposer(index, "contributionType", e.target.value)
                  }
                  required
                >
                  <option value="">— Select —</option>
                  {CONTRIBUTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeComposer(index)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      <button type="button" className="add-btn" onClick={addComposer}>
        + Add Composer
      </button>

      <AddNewComposerPopup
        open={showPopup}
        onClose={handlePopupClose}
        onSuccess={handleNewComposerSuccess}
      />
    </div>
  );
}
