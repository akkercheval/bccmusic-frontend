import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./MyScores.css";

interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  grade: number;
  arrangementType: {
    code: string;
    name?: string;
    description?: string;
    sortOrder?: number;
  };
  tags: string[];
}

const columns = [
  {
    name: "ID",
    selector: (row: MusicScore) => row.scoreId,
    sortable: true,
    width: "80px",
  },
  {
    name: "Title",
    selector: (row: MusicScore) => row.scoreTitle,
    sortable: true,
  },
  {
    name: "Grade",
    selector: (row: MusicScore) => row.grade,
    sortable: true,
    width: "100px",
  },
  {
    name: "Arrangement Type",
    selector: (row: MusicScore) =>
      row.arrangementType?.name || row.arrangementType?.code || "—",
    sortable: true,
  },
  {
    name: "Tags",
    selector: (row: MusicScore) => row.tags?.join(", ") || "",
    wrap: true,
  },
];

export default function MyScores() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [scores, setScores] = useState<MusicScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchMyScores = async () => {
      try {
        const response = await api.get("/scores/my-scores");
        setScores(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load your scores");
        console.error("Error fetching scores:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyScores();
  }, [user, navigate]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;
  if (isLoading) return <div className="loading">Loading your scores...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-scores-container">
      <h1>My Scores</h1>
      <p>
        Logged in as: <strong>{user.accountName}</strong>
      </p>

      {scores.length === 0 ? (
        <p>
          You don't have any scores yet. <strong>Start adding some!</strong>
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={scores}
          pagination
          highlightOnHover
          pointerOnHover
          defaultSortFieldId={1}
          theme="dark"
          onRowClicked={(row) =>
            navigate(`/scores/${row.scoreId}`, { state: { from: "my-scores" } })
          }
          customStyles={tableCustomStyles}
        />
      )}
    </div>
  );
}

const tableCustomStyles = {
  headRow: { style: { backgroundColor: "#101585", color: "#FFDD44" } },
  rows: { style: { backgroundColor: "#1e1e4d", color: "white" } },
  pagination: { style: { backgroundColor: "#101585", color: "white" } },
};
