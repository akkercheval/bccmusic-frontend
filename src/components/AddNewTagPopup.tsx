import React, { useState } from "react";
import Popup from "reactjs-popup";
import { type ScoreTag } from "../types/score";
import "./AddNewTagPopup.css";

interface AddNewTagPopupProps {
  open: boolean;
  onClose: () => void;
  existingTags: string[];
  onSuccess: (tag: ScoreTag) => void;
}

export default function AddNewTagPopup({
  open,
  onClose,
  existingTags,
  onSuccess,
}: AddNewTagPopupProps) {
  const [selectedValue, setSelectedValue] = useState("");
  const [newTagText, setNewTagText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    let tag: string;

    if (selectedValue === "new") {
      tag = newTagText.trim();
      if (!tag) {
        setError("Please enter a tag name.");
        return;
      }
    } else if (selectedValue) {
      tag = selectedValue;
    } else {
      setError("Please select or create a tag.");
      return;
    }

    onSuccess({ tag, scoreTagId: undefined });
    setSelectedValue("");
    setNewTagText("");
    onClose();
  };

  return (
    <Popup open={open} onClose={onClose} modal nested>
      <div className="popup-content">
        <h2>Add Tag</h2>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tag">Select Tag: </label>
            <select
              id="tag"
              value={selectedValue}
              onChange={(e) => {
                setSelectedValue(e.target.value);
                setError(null);
              }}
            >
              <option value="">— Select an existing tag —</option>
              <option value="new">+ Create a new tag</option>
              {existingTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {selectedValue === "new" && (
            <div className="form-group">
              <label htmlFor="new-tag">New tag name:</label>
              <input
                id="new-tag"
                type="text"
                value={newTagText}
                onChange={(e) => {
                  setNewTagText(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. accessibility"
                autoFocus
              />
            </div>
          )}

          <button type="submit">Add Tag</button>
        </form>
      </div>
    </Popup>
  );
}
