import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-card">
        {/* Decorative staff lines top */}
        <div className="home-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        {/* Hero section */}
        <div className="home-hero">
          <h1 className="home-title">
            <span className="home-title-note" aria-hidden="true">𝄞</span>
            BCC Music
          </h1>
          <p className="home-tagline">
            Your music library, organized and searchable.
          </p>
        </div>

        {/* Floating notes */}
        <div className="home-notes" aria-hidden="true">
          <span className="home-note">♩</span>
          <span className="home-note">♪</span>
          <span className="home-note">♫</span>
          <span className="home-note">♬</span>
          <span className="home-note">♩</span>
        </div>

        {/* Description */}
        <p className="home-description">
          BCCMusic catalogs sheet music for easy searching. Browse the public
          catalog, manage your own collection, or collaborate with others to
          keep scores organized.
        </p>

        {/* Feature cards */}
        <div className="home-features">
          <div className="home-feature-card">
            <span className="home-feature-icon" aria-hidden="true">🎵</span>
            <h3 className="home-feature-label">Viewer</h3>
            <p className="home-feature-desc">
              Search the public catalog and any private collections shared with you.
            </p>
          </div>
          <div className="home-feature-card">
            <span className="home-feature-icon" aria-hidden="true">🎼</span>
            <h3 className="home-feature-label">Owner</h3>
            <p className="home-feature-desc">
              Add music to your collection and grant collaborator access to others.
            </p>
          </div>
          <div className="home-feature-card">
            <span className="home-feature-icon" aria-hidden="true">🤝</span>
            <h3 className="home-feature-label">Collaborator</h3>
            <p className="home-feature-desc">
              Help manage another owner's music with limited or full edit permissions.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="home-cta">
          <Link to="/login" className="home-cta-button home-cta-primary">
            Log In
          </Link>
          <Link to="/register" className="home-cta-button home-cta-secondary">
            Create an Account
          </Link>
        </div>

        <p className="home-admin-note">
          Need Owner permissions? Contact the site administrator after creating your account.
        </p>

        {/* Decorative staff lines bottom */}
        <div className="home-staff" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
}
