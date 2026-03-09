import React, { useState, useEffect } from "react";
import Popup from "reactjs-popup";
import "./AddEditPartPopup.css";

interface AddEditPartPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newPart: {
    instrument: string;
    hasSolo: boolean;
    regularPartCount: number;
    flexMinPart: number | null;
    flexPartCount: number | null;
    partComments: string | null;
  }) => void;
  initialPart?: {
    instrument: string;
    hasSolo: boolean;
    regularPartCount: number;
    flexMinPart?: number;
    flexPartCount?: number;
    partComments?: string;
  };
}

export default function AddEditPartPopup({
  open,
  onClose,
  onSuccess,
  initialPart,
}: AddEditPartPopupProps) {
  const [form, setForm] = useState<{
    instrument: string;
    hasSolo: boolean;
    regularPartCount: number;
    flexMinPart: number | null;
    flexPartCount: number | null;
    partComments: string;
  }>(() => ({
    instrument: "",
    hasSolo: false,
    regularPartCount: 1,
    flexMinPart: null,
    flexPartCount: null,
    partComments: "",
  }));

  const [error, setError] = useState<string | null>(null);
  const instruments = [
    "Flute",
    "Piccolo",
    "Oboe",
    "English Horn",
    "Clarinet (Eb Soprano)",
    "Clarinet (Bb Soprano)",
    "Clarinet (Bb Bass)",
    "Bassoon",
    "Contrabassoon",
    "Saxophone (Soprano)",
    "Saxophone (Alto)",
    "Saxophone (Tenor)",
    "Saxophone (Baritone)",
    "Trumpet",
    "Cornet",
    "Horn",
    "Trombone",
    "Bass Trombone",
    "Tuba",
    "Euphonium",
    "Violin",
    "Viola",
    "Cello",
    "Double Bass",
    "Harp",
    "Piano",
    "Organ",
    "Guitar",
    "Bass Guitar",
    "Drums",
    "Percussion",
    "Timpani",
    "Xylophone",
    "Marimba",
    "Vibraphone",
    "Voice (Soprano)",
    "Voice (Alto)",
    "Voice (Tenor)",
    "Voice (Bass)",
    "Voice (Baritone)",
    "Voice (Mezzo-Soprano)",
    "Voice (Countertenor)",
  ];

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(
      initialPart
        ? {
            instrument: initialPart.instrument,
            hasSolo: initialPart.hasSolo,
            regularPartCount: initialPart.regularPartCount,
            flexMinPart: initialPart.flexMinPart ?? null,
            flexPartCount: initialPart.flexPartCount ?? null,
            partComments: initialPart.partComments ?? "",
          }
        : {
            instrument: "",
            hasSolo: false,
            regularPartCount: 1,
            flexMinPart: null,
            flexPartCount: null,
            partComments: "",
          },
    );
    setError(null);
  }, [open, initialPart]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!form.instrument) {
      setError("Instrument is required.");
      return;
    }
    // Basic validation: check if numbers
    if (!form.regularPartCount || isNaN(form.regularPartCount))
      setError("Part Count must be a valid number.");
    if (
      form.flexMinPart !== null &&
      (isNaN(form.flexMinPart) || form.flexMinPart <= 0)
    ) {
      setError("Flex Min Part must be a positive number.");
      return;
    }
    if (
      form.flexPartCount !== null &&
      (isNaN(form.flexPartCount) || form.flexPartCount <= 0)
    ) {
      setError("Flex Part Count must be a positive number.");
      return;
    }
    if (error) return;
    const newPart = {
      instrument: form.instrument,
      hasSolo: form.hasSolo,
      regularPartCount: form.regularPartCount,
      flexMinPart: form.flexMinPart,
      flexPartCount: form.flexPartCount,
      partComments: form.partComments.trim() || null,
    };
    onSuccess(newPart);
    onClose();
  };

  return (
    <Popup open={open} onClose={onClose} modal nested>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <h2>
          {initialPart ? "Edit Instrument Part" : "Add New Instrument Part"}
        </h2>
        <div className="popup-form-group">
          <label htmlFor="instrument">Instrument*</label>
          <select
            id="instrument"
            value={form.instrument}
            onChange={(e) => setForm({ ...form, instrument: e.target.value })}
            required
          >
            <option value="">Select instrument...</option>
            {instruments.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
        <div className="popup-form-group">
          <label htmlFor="hasSolo">Has Solo Part</label>
          <input
            type="checkbox"
            id="hasSolo"
            checked={form.hasSolo}
            onChange={(e) => setForm({ ...form, hasSolo: e.target.checked })}
          />
        </div>
        <div className="popup-form-group">
          <label htmlFor="regularPartCount">
            Total Number of Regular Parts*
          </label>
          <input
            type="number"
            id="regularPartCount"
            value={form.regularPartCount}
            onChange={(e) =>
              setForm({
                ...form,
                regularPartCount: parseInt(e.target.value) || 1,
              })
            }
          />
        </div>
        <div className="popup-form-group">
          <label htmlFor="flexMinPart">
            Flex Arrangement Highest Part (Optional)
          </label>
          <input
            type="number"
            id="flexMinPart"
            value={form.flexMinPart ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                flexMinPart:
                  e.target.value === "" ? null : parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="popup-form-group">
          <label htmlFor="flexPartCount">
            Total Number of Flex Parts (Optional)
          </label>
          <input
            type="number"
            id="flexPartCount"
            value={form.flexPartCount ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                flexPartCount:
                  e.target.value === "" ? null : parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="popup-form-group">
          <label htmlFor="partComments">Comments</label>
          <input
            type="text"
            id="partComments"
            value={form.partComments}
            onChange={(e) => setForm({ ...form, partComments: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <button type="submit">
          {initialPart ? "Save Changes" : "Add Part"}
        </button>
      </form>
    </Popup>
  );
}
