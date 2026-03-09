import React, { useState } from "react";
import "./TagsList.css";
import AddNewTagPopup from "./AddNewTagPopup";

export interface TagEntry {
  scoreTagId?: number;
  scoreId?: number;
  tag: string;
}

export interface TagsListProps {
  tags: TagEntry[];
  setTags: React.Dispatch<React.SetStateAction<TagEntry[]>>;
  existingTags: {
    scoreTagId: number;
    scoreId: number;
    tag: string;
  }[];
  setExistingTags: React.Dispatch<
    React.SetStateAction<
      {
        scoreTagId: number;
        scoreId: number;
        tag: string;
      }[]
    >
  >;
}

export default function TagsList({ tags, setTags }: TagsListProps) {
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
        onSuccess={(newTag) => setTags([...tags, newTag])}
      />
    </div>
  );
}
