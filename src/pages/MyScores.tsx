import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ScoresTable from "../components/ScoresTable";

export default function MyScores() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null; // ScoresTable handles its own loading state
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <ScoresTable
      title="My Scores"
      subtitle={`Owner: ${user.accountName}`}
      accountId={user.accountId}
      fromLabel="my-scores"
      emptyMessage="You don't have any scores yet. Use 'Add a New Score' to create your first!"
    />
  );
}
