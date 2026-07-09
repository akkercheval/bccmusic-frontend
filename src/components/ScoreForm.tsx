import React, { useState } from "react";
import ComposerList from "./ComposerList";
import PartList from "./PartList";
import TagsList from "./TagsList";
import MedleyList from "./MedleyList";
import AddEditVendorPopup from "./AddEditVendorPopup";
import type {
  Part,
  ComposerEntry,
  MedleyEntry,
  ScoreTag,
  Vendor,
} from "../types/score";
import "./ScoreForm.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoreFormFields {
  scoreTitle: string;
  scoreSubtitle: string;
  purchasedFrom: Vendor | null;
  purchasedDate: string | null;
  purchasedCost: string | null;
  grade: string | null;
  arrangementType: string;
}

interface ScoreFormProps {
  /** Current form field values */
  fields: ScoreFormFields;
  /** Callback when any field changes */
  onFieldChange: (name: string, value: string) => void;
  /** Callback when vendor is selected */
  onVendorChange: (vendor: Vendor | null) => void;

  /** Reference data */
  arrangementTypes: { code: string; name: string }[];
  existingComposers: { composerId: number; firstName?: string; middleName?: string; lastName: string }[];
  setExistingComposers: React.Dispatch<React.SetStateAction<{ composerId: number; firstName?: string; middleName?: string; lastName: string }[]>>;
  existingVendors: Vendor[];
  setExistingVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  existingTags: string[];
  setExistingTags: React.Dispatch<React.SetStateAction<string[]>>;

  /** List state */
  composers: ComposerEntry[];
  setComposers: React.Dispatch<React.SetStateAction<ComposerEntry[]>>;
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  scoreTags: ScoreTag[];
  setScoreTags: React.Dispatch<React.SetStateAction<ScoreTag[]>>;
  medleys: MedleyEntry[];
  setMedleys: React.Dispatch<React.SetStateAction<MedleyEntry[]>>;

  /** Field validation errors (keyed by field name) */
  errors?: Record<string, string>;
  /** Which fields have been touched/blurred */
  touched?: Record<string, boolean>;
  /** Blur handler for validation */
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;

  /** Whether data is still loading (disables arrangement type) */
  loadingData?: boolean;

  /** Optional extra content before the form fields (e.g., owner selector) */
  children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScoreForm({
  fields,
  onFieldChange,
  onVendorChange,
  arrangementTypes,
  existingComposers,
  setExistingComposers,
  existingVendors,
  setExistingVendors,
  existingTags,
  setExistingTags,
  composers,
  setComposers,
  parts,
  setParts,
  scoreTags,
  setScoreTags,
  medleys,
  setMedleys,
  errors = {},
  touched = {},
  onBlur,
  loadingData = false,
  children,
}: ScoreFormProps) {
  const [showVendorPopup, setShowVendorPopup] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onFieldChange(e.target.name, e.target.value);
  };

  const handleNewVendorSuccess = (newVendor: Vendor) => {
    setExistingVendors((prev) => [...prev, newVendor]);
    onVendorChange(newVendor);
    setShowVendorPopup(false);
  };

  return (
    <div className="score-form-fields">
      {/* Score Title */}
      <div className="form-group">
        <label htmlFor="scoreTitle">Score Title*</label>
        <input
          type="text"
          id="scoreTitle"
          name="scoreTitle"
          value={fields.scoreTitle}
          onChange={handleChange}
          onBlur={onBlur}
          required
        />
        {touched.scoreTitle && errors.scoreTitle && (
          <span className="error">{errors.scoreTitle}</span>
        )}
      </div>

      {/* Score Subtitle */}
      <div className="form-group">
        <label htmlFor="scoreSubtitle">Score Subtitle</label>
        <input
          type="text"
          id="scoreSubtitle"
          name="scoreSubtitle"
          value={fields.scoreSubtitle}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>

      {/* Slot for extra fields (e.g., owner selector) */}
      {children}

      {/* Purchased From */}
      <div className="form-group">
        <label htmlFor="purchasedFrom">Purchased From</label>
        <select
          id="purchasedFrom"
          name="purchasedFrom"
          value={fields.purchasedFrom?.vendorName || ""}
          onChange={(e) => {
            if (e.target.value === "new") {
              setShowVendorPopup(true);
            } else {
              const selected = existingVendors.find(
                (v) => v.vendorName === e.target.value,
              );
              onVendorChange(selected || null);
            }
          }}
        >
          <option value="">— Select or create vendor —</option>
          {existingVendors.map((v) => (
            <option key={v.vendorId} value={v.vendorName}>
              {v.vendorName}
            </option>
          ))}
          <option value="new">+ Create new vendor</option>
        </select>
      </div>

      {/* Purchased Date */}
      <div className="form-group">
        <label htmlFor="purchasedDate">Purchased Date</label>
        <input
          type="date"
          id="purchasedDate"
          name="purchasedDate"
          value={fields.purchasedDate || ""}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>

      {/* Purchased Cost */}
      <div className="form-group">
        <label htmlFor="purchasedCost">Purchased Cost</label>
        <input
          type="number"
          step="0.01"
          id="purchasedCost"
          name="purchasedCost"
          value={fields.purchasedCost || ""}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>

      {/* Grade */}
      <div className="form-group">
        <label htmlFor="grade">Grade</label>
        <input
          type="number"
          step="0.5"
          min="0"
          max="10"
          id="grade"
          name="grade"
          value={fields.grade || ""}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>

      {/* Arrangement Type */}
      <div className="form-group">
        <label htmlFor="arrangementType">Arrangement Type*</label>
        <select
          id="arrangementType"
          name="arrangementType"
          value={fields.arrangementType}
          onChange={handleChange}
          onBlur={onBlur}
          required
          disabled={loadingData}
        >
          <option value="">Select type...</option>
          {arrangementTypes.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>
        {touched.arrangementType && errors.arrangementType && (
          <span className="error">{errors.arrangementType}</span>
        )}
      </div>

      {/* Sub-lists */}
      <ComposerList
        composers={composers}
        setComposers={setComposers}
        existingComposers={existingComposers}
        setExistingComposers={setExistingComposers}
      />

      <PartList parts={parts} setParts={setParts} />

      <TagsList
        tags={scoreTags}
        setTags={setScoreTags}
        existingTags={existingTags}
        setExistingTags={setExistingTags}
      />

      <MedleyList
        medleys={medleys}
        setMedleys={setMedleys}
        existingComposers={existingComposers}
        setExistingComposers={setExistingComposers}
      />

      {/* Vendor popup */}
      <AddEditVendorPopup
        open={showVendorPopup}
        onClose={() => setShowVendorPopup(false)}
        onSuccess={handleNewVendorSuccess}
      />
    </div>
  );
}
