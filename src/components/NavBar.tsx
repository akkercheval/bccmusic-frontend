import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { FaBars, FaTimes } from "react-icons/fa";
import { useState } from "react";
import "./NavBar.css";

const NavBar = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // ← state for toggle

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      refreshUser(); // Clears user from context
      navigate("/login?logout=success");
    } catch (err) {
      console.error("Logout failed", err);
      navigate("/login");
    }
    closeMenu(); // Close menu on logout
  };

  if (!user) return null;

  const isOwner = user.accountType === "OWNER";
  const isCollaborator = user.accountType === "COLLABORATOR";
  const isAdmin = user.accountType === "ADMINISTRATOR";

  return (
    <nav className="nav-bar">
      <div className="nav-logo">
        <Link to="/dashboard" onClick={closeMenu}>
          BCC Music
        </Link>
      </div>

      {/* Hamburger toggle button – visible on mobile */}
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        {/*  
      <li className="nav-item">
          <Link
            to="/account/update"
            className={location.pathname === "/account/update" ? "active" : ""}
            onClick={closeMenu}
          >
            Update My Account
          </Link>
        </li> 
      */}
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
                className={
                  location.pathname === "/my-collaborators" ? "active" : ""
                }
                onClick={closeMenu}
              >
                My Collaborators
              </Link>
            </li>
          </>
        )}
        {(isOwner || isAdmin || isCollaborator) && (
          <>
            <li className="nav-item">
              <Link
                to="/add-new-score"
                className={
                  location.pathname === "/add-new-score" ? "active" : ""
                }
                onClick={closeMenu}
              >
                Add a New Score
              </Link>
            </li>
          </>
        )}
        {isAdmin && (
          <>
            <li className="nav-item">
              <Link
                to="/admin/manage-accounts"
                className={
                  location.pathname === "/manage-accounts" ? "active" : ""
                }
                onClick={closeMenu}
              >
                Manage All Accounts
              </Link>
            </li>
          </>
        )}
        <li className="nav-item">
          <button onClick={handleLogout} className="logout-btn">
            LOGOUT
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
