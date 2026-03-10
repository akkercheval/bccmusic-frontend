import React, { useState } from "react";
import "./ComposerList.css";
import AddNewComposerPopup from "./AddEditComposerPopup";

export interface ComposerEntry {
  composerId?: number;
  contributionType: string;
}

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
  const [currentIndex, setCurrentIndex] = useState(-1);

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
    console.log(
      `[UPDATE] Setting row ${index}.${field} =`,
      value,
      `(type: ${typeof value})`,
    );

    const newComposers = [...composers];
    newComposers[index] = { ...newComposers[index], [field]: value };
    setComposers(newComposers);

    // Log the composers array right after update
    console.log("[UPDATE] New composers state:", newComposers);
  };

  const handleComposerSelect = (index: number, value: string) => {
    console.log(
      `[SELECT] Row ${index} - raw selected value from DOM: "${value}" (length: ${value.length}, type: ${typeof value})`,
    );

    if (value === "new") {
      setCurrentIndex(index);
      setShowPopup(true);
      return;
    }

    if (!value) {
      // blank selection
      updateComposer(index, "composerId", undefined);
      return;
    }

    const parsedId = Number(value);

    if (isNaN(parsedId)) {
      console.warn(
        `[SELECT] Invalid ID conversion: "${value}" → NaN - ignoring update`,
      );
      return; // or keep previous value
    }

    updateComposer(index, "composerId", parsedId);
  };

  const handleNewComposerSuccess = (newComposer: {
    composerId: number;
    firstName?: string;
    middleName?: string;
    lastName: string;
  }) => {
    console.log("[SUCCESS] New composer received:", newComposer);
    console.log("[SUCCESS] Current existing before update:", existingComposers);
    setExistingComposers((prev) => {
      const updated = [...prev, newComposer];
      console.log("[SUCCESS] Updated existing:", updated);
      return updated;
    });

    if (currentIndex !== -1) {
      console.log(
        "[SUCCESS] Setting composerId for row",
        currentIndex,
        "to",
        newComposer.composerId,
      );
      updateComposer(currentIndex, "composerId", newComposer.composerId);
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
        onClose={() => setShowPopup(false)}
        onSuccess={handleNewComposerSuccess}
      />
    </div>
  );
}
