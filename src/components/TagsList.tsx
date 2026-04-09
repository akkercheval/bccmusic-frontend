import React, { useState } from "react";
import AddNewTagPopup from "./AddNewTagPopup";
import type { ScoreTag } from "../types/score";
import "./TagsList.css";

export interface TagsListProps {
  tags: ScoreTag[];
  setTags: React.Dispatch<React.SetStateAction<ScoreTag[]>>;
  existingTags: string[];
  setExistingTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function TagsList({
  tags,
  setTags,
  existingTags,
  setExistingTags,
}: TagsListProps) {
  const [showPopup, setShowPopup] = useState(false);

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="tags-section">
      <div className="section-label">Tags</div>
      <div className="tags-list">
        {tags.map((tag, index) => (
          <div key={index} className="tag-entry">
            {tag.tag}{" "}
            <button
              className="remove-btn"
              type="button"
              onClick={() => removeTag(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        className="add-btn"
        type="button"
        onClick={() => setShowPopup(true)}
        disabled={showPopup}
      >
        Add Tag
      </button>
      <AddNewTagPopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        existingTags={existingTags}
        onSuccess={(newTag) => {
          // Prevent duplicate tags on this score
          if (tags.some((t) => t.tag === newTag.tag)) return;

          setTags((prev) => [...prev, newTag]);

          // Add to global dropdown list if it's truly new
          if (!existingTags.includes(newTag.tag)) {
            setExistingTags((prev) => [...prev, newTag.tag]);
          }
        }}
      />
    </div>
  );
}
