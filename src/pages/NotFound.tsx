import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NotFound.css";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        {/* Musical staff lines as decorative element */}
        <div className="staff-lines" aria-hidden="true">
          <span className="staff-line"></span>
          <span className="staff-line"></span>
          <span className="staff-line"></span>
          <span className="staff-line"></span>
          <span className="staff-line"></span>
        </div>

        <div className="not-found-content">
          <p className="rest-symbol" aria-hidden="true">𝄾</p>
          <h1>404</h1>
          <h2>This page is a rest — there's nothing here.</h2>
          <p className="not-found-subtitle">
            Looks like you've wandered off the score. The page you're looking
            for doesn't exist or may have been moved.
          </p>

          <div className="not-found-notes" aria-hidden="true">
            <span className="note">♩</span>
            <span className="note">♪</span>
            <span className="note">♫</span>
            <span className="note">♬</span>
          </div>

          <Link
            to={user ? "/dashboard" : "/login"}
            className="not-found-link"
          >
            {user ? "Back to Dashboard" : "Back to Login"}
          </Link>
        </div>

        <div className="staff-lines" aria-hidden="true">
          <span className="staff-line"></span>
          <span className="staff-line"></span>
          <span className="staff-line"></span>
          <span className="staff-line"></span>
          <span className="staff-line"></span>
        </div>
      </div>
    </div>
  );
}
