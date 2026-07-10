import { useState } from "react";
import type { ScoreComment } from "../types/score";
import "./CommentList.css";

interface CommentListProps {
  comments: ScoreComment[];
  setComments: React.Dispatch<React.SetStateAction<ScoreComment[]>>;
  /** The current user's account ID (for permission checks) */
  currentUserId: number;
  /** 
   * Permission level: 
   * - "full" = can add, edit all, delete all
   * - "limited" = can add, edit/delete only own comments
   * - "readonly" = view only (no add/edit/delete)
   */
  permissionLevel: "full" | "limited" | "readonly";
}

export default function CommentList({
  comments,
  setComments,
  currentUserId,
  permissionLevel,
}: CommentListProps) {
  const [newComment, setNewComment] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const canAdd = permissionLevel !== "readonly";

  const canEditComment = (comment: ScoreComment): boolean => {
    if (permissionLevel === "full") return true;
    if (permissionLevel === "limited") {
      return comment.createdByAccountId === currentUserId;
    }
    return false;
  };

  const canDeleteComment = (comment: ScoreComment): boolean => {
    if (permissionLevel === "full") return true;
    if (permissionLevel === "limited") {
      return comment.createdByAccountId === currentUserId;
    }
    return false;
  };

  const handleAdd = () => {
    if (!newComment.trim()) return;
    const comment: ScoreComment = {
      comment: newComment.trim(),
      createdByAccountId: currentUserId,
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(comments[index].comment);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editValue.trim()) return;
    setComments((prev) =>
      prev.map((c, i) =>
        i === editingIndex ? { ...c, comment: editValue.trim() } : c
      )
    );
    setEditingIndex(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleRemove = (index: number) => {
    setComments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="comments-section">
      <div className="section-label">Comments</div>

      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map((comment, index) => (
            <div key={comment.commentId || index} className="comment-row">
              {editingIndex === index ? (
                <div className="comment-edit-row">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="comment-edit-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                  />
                  <button type="button" className="secondary-button" onClick={handleSaveEdit}>
                    Save
                  </button>
                  <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="comment-content">
                    <span className="comment-text">{comment.comment}</span>
                    <span className="comment-meta">
                      {comment.updatedAt ? (
                        <>Updated {formatDate(comment.updatedAt)} by {comment.updatedByAccountName || "Unknown"}</>
                      ) : comment.createdAt ? (
                        <>Added {formatDate(comment.createdAt)} by {comment.createdByAccountName || "Unknown"}</>
                      ) : null}
                    </span>
                  </div>
                  <div className="comment-actions">
                    {canEditComment(comment) && (
                      <button type="button" className="edit-btn" onClick={() => handleStartEdit(index)}>
                        Edit
                      </button>
                    )}
                    {canDeleteComment(comment) && (
                      <button type="button" className="remove-btn" onClick={() => handleRemove(index)}>
                        ×
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="comment-add-row">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="comment-add-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
            }}
          />
          <button
            type="button"
            className="add-btn"
            onClick={handleAdd}
            disabled={!newComment.trim()}
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}
