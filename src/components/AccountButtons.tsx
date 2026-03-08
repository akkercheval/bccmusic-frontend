import React from "react";
import "./AccountButtons.css";
import { Link } from "react-router-dom";

const AccountButtons: React.FC = () => {
  return (
    <div className="account-buttons">
      <Link to="/login">
        <button
          className="account-button"
          aria-label="Login to existing account"
        >
          Login With Existing Account
        </button>
      </Link>
      <Link to="/register">
        <button className="account-button" aria-label="Create a new account">
          Create a New Account
        </button>
      </Link>
    </div>
  );
};

export default AccountButtons;
