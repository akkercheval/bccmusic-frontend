import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { FaBars, FaTimes } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import "./NavBar.css";

export default function NavBar() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Close menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, closeMenu]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      refreshUser();
      navigate("/login?logout=success");
    } catch (err) {
      console.error("Logout failed", err);
      navigate("/login");
    }
    closeMenu();
  };

  if (!user) return null;

  const isOwner = user.accountType === "OWNER";
  const isCollaborator = user.accountType === "COLLABORATOR";
  const isAdmin = user.accountType === "ADMINISTRATOR";

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-logo">
        <Link to="/dashboard" onClick={closeMenu}>
          <span className="nav-logo-note" aria-hidden="true">♪</span>
          BCC Music
        </Link>
      </div>

      {/* Hamburger toggle button – visible on mobile */}
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
        aria-controls="nav-menu"
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <ul id="nav-menu" className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <li className="nav-item">
          <Link
            to="/account"
            className={location.pathname === "/account" ? "active" : ""}
            onClick={closeMenu}
          >
            My Account
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/all-scores"
            className={location.pathname === "/all-scores" ? "active" : ""}
            onClick={closeMenu}
          >
            All Scores
          </Link>
        </li>
        {isOwner && (
          <>
            <li className="nav-item">
              <Link
                to="/my-scores"
                className={location.pathname === "/my-scores" ? "active" : ""}
                onClick={closeMenu}
              >
                My Scores
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/my-collaborators"
                className={location.pathname === "/my-collaborators" ? "active" : ""}
                onClick={closeMenu}
              >
                My Collaborators
              </Link>
            </li>
          </>
        )}
        {(isOwner || isAdmin || isCollaborator) && (
          <li className="nav-item">
            <Link
              to="/add-new-score"
              className={location.pathname === "/add-new-score" ? "active" : ""}
              onClick={closeMenu}
            >
              Add a New Score
            </Link>
          </li>
        )}
        {isAdmin && (
          <li className="nav-item">
            <Link
              to="/admin/manage-accounts"
              className={location.pathname === "/admin/manage-accounts" ? "active" : ""}
              onClick={closeMenu}
            >
              Manage All Accounts
            </Link>
          </li>
        )}
        <li className="nav-item nav-item--logout">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
