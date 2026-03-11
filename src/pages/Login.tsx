import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justLoggedOut =
    new URLSearchParams(location.search).get("logout") === "success";
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "username" && !value.trim()) error = "Username is required";
    if (name === "password" && !value) error = "Password is required";
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) newErrors[name] = error;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      await api.post(
        "/perform_login",
        new URLSearchParams({
          username: formData.username,
          password: formData.password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      await refreshUser();

      //localStorage.setItem("isAuthenticated", "true");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setServerError("Invalid username or password.");
      } else {
        setServerError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-card">
        {justLoggedOut && (
          <div className="success">You have been logged out successfully.</div>
        )}
        <h1>Login to BCC Music</h1>
        <p className="login-subtitle">
          Access your music collection and explore shared scores.
        </p>

        {serverError && <div className="server-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoFocus
            />
            {errors.username && (
              <span className="error">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {errors.password && (
              <span className="error">{errors.password}</span>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="register-prompt">
          <p>Don't have an account yet?</p>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="register-link-button"
          >
            Create a New Account
          </button>
        </div>
      </div>
    </div>
  );
}
