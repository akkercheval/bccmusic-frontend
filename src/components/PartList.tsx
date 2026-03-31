import React, { useState } from "react";
import "./PartList.css";
import AddEditPartPopup from "./AddEditPartPopup";

export interface Part {
  partId?: number;
  instrument: string;
  hasSolo: boolean;
  regularPartCount: number;
  flexMinPart?: number;
  flexPartCount?: number;
  partComments?: string;
}

interface PartListProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
}

export default function PartList({ parts, setParts }: PartListProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSavePart = (savedPart: Part) => {
    const cleanedData: Part = {
      ...savedPart,
      flexMinPart:
        savedPart.flexMinPart !== undefined && savedPart.flexMinPart > 0
          ? savedPart.flexMinPart
          : undefined,
      flexPartCount:
        savedPart.flexPartCount !== undefined && savedPart.flexPartCount > 0
          ? savedPart.flexPartCount
          : undefined,
      partComments: savedPart.partComments?.trim() || undefined,
    };

    if (editingIndex !== null) {
      setParts((prev) =>
        prev.map((p, i) => (i === editingIndex ? cleanedData : p)),
      );
    } else {
      setParts((prev) => [...prev, cleanedData]);
    }
    setShowPopup(false);
    setEditingIndex(null);
  };

  const handleCancelPart = () => {
    setShowPopup(false);
    setEditingIndex(null);
  };

  const editPart = (index: number) => {
    setEditingIndex(index);
    setShowPopup(true);
  };

  const removePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="parts-section">
      <div className="section-label">Instrument Parts</div>
      {parts.length > 0 && (
        <>
          {parts.map((part, index) => (
            <div key={index} className="part-row">
              <span className="part-details">
                {part.instrument} - Regular Count: {part.regularPartCount},
                Solo: {part.hasSolo ? "Yes" : "No"}
                {part.flexMinPart ? `, Flex Min: ${part.flexMinPart}` : null}
                {part.flexPartCount
                  ? `, Flex Count: ${part.flexPartCount}`
                  : null}
                {part.partComments ? ` - Comments: ${part.partComments}` : ""}
              </span>
              <button
                type="button"
                className="edit-btn"
                onClick={() => editPart(index)}
              >
                Edit
              </button>
              <button
                type="button"
                className="remove-btn"
                onClick={() => removePart(index)}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}
      <button
        type="button"
        className="add-btn"
        onClick={() => {
          setShowPopup(true);
          setEditingIndex(null);
        }}
      >
        + Add Part
      </button>

      <AddEditPartPopup
        open={showPopup}
        onClose={handleCancelPart}
        onSuccess={handleSavePart}
        initialPart={editingIndex !== null ? parts[editingIndex] : undefined}
      />
    </div>
  );
}
