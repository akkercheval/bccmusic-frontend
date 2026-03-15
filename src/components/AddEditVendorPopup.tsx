import React, { useState } from "react";
import Popup from "reactjs-popup";
import api from "../services/api";
import type { Account } from "../types/Account";
import "./Popup.css";

interface AddEditVendorPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newVendor: {
    vendorId: number;
    vendorName: string;
    streetAddress?: string;
    city?: string;
    stateAbbr?: string;
    zipCode?: string;
    phoneNumber?: string;
    phoneType?: string;
    website?: string;
    email?: string;
    createdAt?: string;
    createdBy?: Account;
    updatedAt?: string;
    updatedBy?: Account;
  }) => void;
}

export default function AddNewComposerPopup({
  open,
  onClose,
  onSuccess,
}: AddEditVendorPopupProps) {
  const [vendorName, setVendorName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneType, setPhoneType] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setError(null);

    if (!vendorName.trim()) {
      setError("Vendor Name is required.");
      return;
    }

    const payload = {
      vendorName: vendorName.trim(),
      streetAddress: streetAddress.trim() || null,
      city: city.trim() || null,
      stateAbbr: stateAbbr.trim() || null,
      zipCode: zipCode.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      phoneType: phoneType.trim() || null,
      website: website.trim() || null,
      email: email.trim() || null,
    };

    setIsLoading(true);
    try {
      const response = await api.post("/vendors", payload);
      const newVendor = response.data;
      onSuccess(newVendor);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to add vendor. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popup open={open} onClose={onClose} modal nested>
      <div className="popup">
        <div className="popup-content">
          <h2>Add or Edit Vendor</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="vendorName">Vendor Name*</label>
              <input
                type="text"
                id="vendorName"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                placeholder="Required"
              />
            </div>
            <div className="form-group">
              <label htmlFor="streetAddress">Street Address</label>
              <input
                type="text"
                id="streetAddress"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="stateAbbr">State</label>
              <input
                type="text"
                id="stateAbbr"
                value={stateAbbr}
                onChange={(e) => setStateAbbr(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneType">Phone Type</label>
              <input
                type="text"
                id="phoneType"
                value={phoneType}
                onChange={(e) => setPhoneType(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Add or Edit Vendor"}
            </button>
          </form>
        </div>
      </div>
    </Popup>
  );
}
