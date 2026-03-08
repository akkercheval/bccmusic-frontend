import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // ← import your axios instance
import "./Register.css";

const states = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District Of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "PR", label: "Puerto Rico" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VI", label: "Virgin Islands" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    accountName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phoneNumber: "",
    phoneType: "",
    website: "",
    streetAddress: "",
    city: "",
    stateAbbr: "",
    zipCode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "accountName":
        if (!value.trim()) error = "Account name is required";
        else if (value.length > 50)
          error = "Account name must be 50 characters or less";
        break;

      case "username":
        if (!value.trim()) error = "Username is required";
        else if (value.length < 3 || value.length > 20)
          error = "Username must be 3–20 characters";
        else if (!/^[a-zA-Z0-9_]+$/.test(value))
          error = "Username can only contain letters, numbers, and underscores";
        break;

      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8)
          error = "Password must be at least 8 characters";
        break;

      case "confirmPassword":
        if (!value) error = "Please confirm your password";
        else if (value !== formData.password) error = "Passwords do not match";
        break;

      case "email":
        if (!value) error = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value))
          error = "Please enter a valid email address";
        break;

      case "zipCode":
        if (value && !/^\d{5}(?:[-\s]\d{4})?$/.test(value)) {
          error = "Invalid ZIP code format (e.g., 46052 or 46052-1234)";
        }
        break;

      case "phoneNumber":
        if (value) {
          // Very basic client-side check (full validation can happen on backend too)
          if (!/^\+?\d[\d\s()-]{7,15}$/.test(value)) {
            error = "Invalid phone number format";
          }
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // If changing password, also re-validate confirmPassword
    if (name === "password" && touched.confirmPassword) {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword,
      );
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // If blurring confirmPassword, re-check match
    if (name === "confirmPassword" && formData.password) {
      const confirmError = validateField("confirmPassword", value);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    // Client-side validation
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value as string);
      if (error) newErrors[name] = error;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      // Map form data to backend-expected shape
      const payload = {
        accountName: formData.accountName,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        phoneType: formData.phoneType,
        website: formData.website,
        streetAddress: formData.streetAddress,
        city: formData.city,
        stateAbbr: formData.stateAbbr,
        zipCode: formData.zipCode,
      };

      await api.post("/accounts", payload);

      setSuccessMessage(
        "Account created successfully! Redirecting to login...",
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "response" in error &&
        (error as any).response
      ) {
        const axiosError = error as any;
        const status = axiosError.response?.status;
        const data = axiosError.response?.data;

        if (status === 400 && data?.details && Array.isArray(data.details)) {
          // Map server validation errors back to form fields
          const serverErrors: Record<string, string> = {};
          data.details.forEach((errMsg: string) => {
            const lowerMsg = errMsg.toLowerCase();
            if (lowerMsg.includes("username")) serverErrors.username = errMsg;
            else if (lowerMsg.includes("email")) serverErrors.email = errMsg;
            else if (lowerMsg.includes("password"))
              serverErrors.password = errMsg;
            else if (lowerMsg.includes("zip")) serverErrors.zipCode = errMsg;
            else serverErrors.general = errMsg;
          });
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        } else if (data?.message) {
          setServerError(data.message);
        } else {
          setServerError("Failed to create account. Please try again.");
        }
      } else {
        setServerError(
          "Network error. Please check your connection and try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-form">
      <h1>Create a New Account</h1>

      {serverError && <div className="error server-error">{serverError}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <h2>Basic Account Information</h2>

        <div className="form-group">
          <label htmlFor="accountName">Account Name:</label>
          <input
            type="text"
            id="accountName"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.accountName && errors.accountName && (
            <span className="error">{errors.accountName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.username && errors.username && (
            <span className="error">{errors.username}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.password &&
            formData.password &&
            formData.password.length < 8 && (
              <span className="hint">
                Password should be at least 8 characters
              </span>
            )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <span className="error">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.email && errors.email && (
            <span className="error">{errors.email}</span>
          )}
        </div>

        <h2>Phone</h2>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="XXX-XXX-XXXX"
            value={formData.phoneNumber}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.phoneNumber && errors.phoneNumber && (
            <span className="error">{errors.phoneNumber}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phoneType">Phone Type:</label>
          <select
            id="phoneType"
            name="phoneType"
            value={formData.phoneType}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">Select a Phone Type</option>
            <option value="mobile">Mobile / Cell</option>
            <option value="home">Home</option>
            <option value="work">Work / Office</option>
            <option value="other">Other</option>
          </select>
        </div>

        <h2>Website</h2>

        <div className="form-group">
          <label htmlFor="website">Website URL:</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <h2>Address</h2>

        <div className="form-group">
          <label htmlFor="streetAddress">Street Address:</label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div className="form-group">
          <label htmlFor="stateAbbr">State:</label>
          <select
            id="stateAbbr"
            name="stateAbbr"
            value={formData.stateAbbr}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">Select a State</option>
            {states.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">Zip Code:</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Register"}
        </button>
      </form>
    </div>
  );
}
