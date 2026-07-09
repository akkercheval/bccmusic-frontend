import ScoresTable from "../components/ScoresTable";

export default function AllScores() {
  return (
    <ScoresTable
      title="All Scores"
      fromLabel="all-scores"
      emptyMessage="No scores have been added yet. Be the first to add one!"
    />
  );
}
