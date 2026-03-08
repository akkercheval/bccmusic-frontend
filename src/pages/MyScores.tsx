import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component"; // ← must import this
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./MyScores.css"; // optional styling
import { useNavigate } from "react-router-dom";

// Define your data shape (adjust based on your actual MusicScore type)
interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  grade: number;
  arrangementType: string;
  tags: string[];
}

const columns = [
  {
    name: "ID",
    selector: (row: MusicScore) => row.scoreId,
    sortable: true,
  },
  {
    name: "Title",
    selector: (row: MusicScore) => row.scoreTitle,
    sortable: true,
  },
  {
    name: "Grade Level",
    selector: (row: MusicScore) => row.grade,
    sortable: true,
  },
  {
    name: "Arrangement Type",
    selector: (row: MusicScore) => row.arrangementType,
    sortable: true,
  },
  {
    name: "Tags",
    selector: (row: MusicScore) => row.tags?.join(", ") || "",
  },
];

export default function MyScores() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [scores, setScores] = useState<MusicScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchMyScores = async () => {
      try {
        setLoading(true);
        const response = await api.get("/scores/my-scores");
        setScores(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load your scores");
        console.error("Error fetching scores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyScores();
  }, [user, navigate]);

  if (authLoading || loading)
    return <div className="loading">Loading your scores...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-scores-container">
      <h1>My Scores</h1>
      <p>
        Logged in as: {user.accountName} ({user.accountType})
      </p>

      {scores.length === 0 ? (
        <p>You don't have any scores yet. Start adding some!</p>
      ) : (
        <DataTable
          columns={columns}
          data={scores}
          pagination
          highlightOnHover
          pointerOnHover
          defaultSortFieldId={1}
          theme="dark" // optional — looks nice with your dark theme
        />
      )}
    </div>
  );
}
