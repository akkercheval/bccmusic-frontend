import React, { useState } from "react";
import AddNewComposerPopup from "./AddEditComposerPopup";
import type { MedleyEntry } from "../types/score";
import "./MedleyList.css";

export interface MedleyListProps {
  medleys: MedleyEntry[];
  setMedleys: React.Dispatch<React.SetStateAction<MedleyEntry[]>>;
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

export default function MedleyList({
  medleys,
  setMedleys,
  existingComposers,
  setExistingComposers,
}: MedleyListProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addMedley = () => {
    setMedleys([...medleys, { pieceTitle: "" }]);
  };

  const removeMedley = (index: number) => {
    setMedleys(medleys.filter((_, i) => i !== index));
  };

  const updateMedley = (
    index: number,
    field: keyof MedleyEntry,
    value: string | number | undefined,
  ) => {
    const updatedMedleys = [...medleys];
    updatedMedleys[index] = { ...updatedMedleys[index], [field]: value };
    setMedleys(updatedMedleys);
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
      updateMedley(index, "composerId", undefined);
      return;
    }

    const parsedId = Number(value);

    if (isNaN(parsedId)) {
      console.warn(
        `[SELECT] Invalid ID conversion: "${value}" → NaN - ignoring update`,
      );
      return;
    }

    updateMedley(index, "composerId", parsedId);
  };

  const handleNewComposerSuccess = (newComposer: {
    composerId: number;
    firstName?: string;
    middleName?: string;
    lastName: string;
  }) => {
    setExistingComposers((prev) => [...prev, newComposer]);
    if (currentIndex !== -1) {
      updateMedley(currentIndex, "composerId", newComposer.composerId);
    }
    setShowPopup(false);
    setCurrentIndex(-1);
  };

  return (
    <div className="medley-section">
      <div className="section-label">Medleys</div>
      {medleys.length > 0 && (
        <>
          {medleys.map((medley, index) => (
            <div key={index} className="medley-row">
              <div className="form-group">
                <label>Piece Title</label>
                <input
                  type="text"
                  value={medley.pieceTitle}
                  onChange={(e) =>
                    updateMedley(index, "pieceTitle", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Composer:</label>
                <select
                  value={medley.composerId?.toString() ?? ""}
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
              <div className="form-group">
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeMedley(index)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      <button type="button" className="add-btn" onClick={addMedley}>
        + Add Medley
      </button>

      <AddNewComposerPopup
        open={showPopup}
        onClose={() => {
          setShowPopup(false);
          setCurrentIndex(-1);
        }}
        onSuccess={handleNewComposerSuccess}
      />
    </div>
  );
}
