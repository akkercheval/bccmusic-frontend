import { useEffect, useState } from "react";
import api from "../services/api";
import type { Vendor } from "../types/score";

interface ComposerOption {
  composerId: number;
  firstName?: string;
  middleName?: string;
  lastName: string;
}

interface ArrangementTypeOption {
  code: string;
  name: string;
}

interface UseScoreFormDataResult {
  existingComposers: ComposerOption[];
  setExistingComposers: React.Dispatch<React.SetStateAction<ComposerOption[]>>;
  arrangementTypes: ArrangementTypeOption[];
  existingVendors: Vendor[];
  setExistingVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  existingTags: string[];
  setExistingTags: React.Dispatch<React.SetStateAction<string[]>>;
  loading: boolean;
  error: string | null;
}

/**
 * Shared hook that fetches reference/lookup data needed by both
 * the Add New Score and Edit Score forms.
 */
export function useScoreFormData(): UseScoreFormDataResult {
  const [existingComposers, setExistingComposers] = useState<ComposerOption[]>([]);
  const [arrangementTypes, setArrangementTypes] = useState<ArrangementTypeOption[]>([]);
  const [existingVendors, setExistingVendors] = useState<Vendor[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [composersRes, arrangementRes, vendorsRes, tagsRes] =
          await Promise.all([
            api.get("/composers"),
            api.get("/arrangement-types"),
            api.get("/vendors"),
            api.get("/score-tags"),
          ]);

        setExistingComposers(Array.isArray(composersRes.data) ? composersRes.data : []);
        setArrangementTypes(Array.isArray(arrangementRes.data) ? arrangementRes.data : []);
        setExistingVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : []);
        setExistingTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);
      } catch (err) {
        console.error("Failed to load score form data:", err);
        setError("Failed to load some required data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    existingComposers,
    setExistingComposers,
    arrangementTypes,
    existingVendors,
    setExistingVendors,
    existingTags,
    setExistingTags,
    loading,
    error,
  };
}
