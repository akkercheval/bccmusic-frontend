import AccountButtons from "../components/AccountButtons";
import "./Home.css";

export default function Home() {
  return (
    <div className="welcome-container">
      <div className="welcome-text">
        <h1>Welcome!</h1>
        <p>
          BCC Music exists to catalog music for easy searching. Anyone can
          create a new account, which will be set up as a Viewer by default.
        </p>
        <p>
          Viewers will be able to search both the public music catalog and any
          private collections to which they have been granted access. Viewers
          can also search the current list of Vendors.
        </p>
        <p>
          An Owner account will be able to add new music to their collection and
          designate other users as Collaborators.
        </p>
        <p>
          A Collaborator account will be able to update music for an Owner
          account. This may be either limited edit, full edit, or full edit with
          the ability to add new Collaborators.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "2rem 0",
        }}
      >
        <AccountButtons />
      </div>
    </div>
  );
}
