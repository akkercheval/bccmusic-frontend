import { Link } from "react-router-dom";
import "./AccountButtons.css";

export default function AccountButtons() {
  return (
    <div className="account-buttons">
      {/* CSS staff lines behind buttons */}
      <div className="account-buttons-staff" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div className="account-buttons-content">
        <Link to="/login" className="account-button" aria-label="Login to existing account">
          Login With Existing Account
        </Link>
        <Link to="/register" className="account-button" aria-label="Create a new account">
          Create a New Account
        </Link>
      </div>
    </div>
  );
}
