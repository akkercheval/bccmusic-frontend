import React, { useState } from "react";
import Popup from "reactjs-popup";
import api from "../services/api";
import "./AddEditComposerPopup.css";

interface AddEditComposerPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newComposer: {
    composerId: number;
    firstName?: string;
    middleName?: string;
    lastName: string;
  }) => void;
}

export default function AddEditComposerPopup({
  open,
  onClose,
  onSuccess,
}: AddEditComposerPopupProps) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setError(null);

    if (!lastName.trim()) {
      setError("Last Name is required.");
      return;
    }

    const payload = {
      firstName: firstName.trim() || null,
      middleName: middleName.trim() || null,
      lastName: lastName.trim(),
    };

    setIsLoading(true);
    try {
      const response = await api.post("/composers", payload);
      const newComposer = response.data;
      onSuccess(newComposer);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to add composer. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popup open={open} onClose={onClose} modal nested>
      <div className="popup">
        <div className="popup-content">
          <h2>Add New Composer</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="middleName">Middle Name</label>
              <input
                type="text"
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name*</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Required"
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Composer"}
            </button>
          </form>
        </div>
      </div>
    </Popup>
  );
}
