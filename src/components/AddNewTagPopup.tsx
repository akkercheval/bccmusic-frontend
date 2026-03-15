import React, { useState, useEffect } from "react";
import Popup from "reactjs-popup";
import api from "../services/api";
import { type TagEntry } from "./TagsList";
import "./AddNewTagPopup.css";

interface AddNewTagPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (tag: TagEntry) => void;
}

export default function AddNewTagPopup({
  open,
  onClose,
  onSuccess,
}: AddNewTagPopupProps) {
  const [databaseTags, setDatabaseTags] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState("");
  const [newTagText, setNewTagText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setError(null);
      api
        .get("/score-tags")
        .then((response) => {
          setDatabaseTags(response.data);
        })
        .catch((err) => {
          console.error("Failed to load tags:", err);
          setError(
            "Could not load existing tags. You can still create a new one.",
          );
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

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

        {loading ? (
          <div className="loading">Loading existing tags...</div>
        ) : (
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
                disabled={loading}
              >
                <option value="">— Select an existing tag —</option>
                <option value="new">+ Create a new tag</option>
                {databaseTags.map((tag) => (
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

            <button type="submit" disabled={loading}>
              Add Tag
            </button>
          </form>
        )}
      </div>
    </Popup>
  );
}
