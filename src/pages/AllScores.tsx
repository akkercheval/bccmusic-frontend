import React, { useEffect, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./AllScores.css";

interface ArrangementType {
  code: string;
  name?: string;
  description?: string;
  sortOrder?: number;
}

interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  grade: number;
  arrangementType: ArrangementType | null;
  scoreTags: { tag: string }[];
}

interface SearchResponse {
  content: MusicScore[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const columns: TableColumn<MusicScore>[] = [
  {
    id: "scoreId",
    name: "ID",
    selector: (row) => row.scoreId,
    sortable: true,
  },
  {
    id: "scoreTitle",
    name: "Title",
    selector: (row) => row.scoreTitle,
    sortable: true,
  },
  {
    id: "grade",
    name: "Grade",
    selector: (row) => row.grade,
    sortable: true,
  },
  {
    id: "arrangementType",
    name: "Arrangement Type",
    selector: (row) =>
      row.arrangementType?.name || row.arrangementType?.code || "—",
    sortable: true,
  },
  {
    id: "scoreTags",
    name: "Tags",
    selector: (row) => row.scoreTags?.map((st) => st.tag).join(", ") || "",
    sortable: false,
    wrap: true,
  },
];

export default function AllScores() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scores, setScores] = useState<MusicScore[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [titleFilter, setTitleFilter] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState("scoreTitle");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const debouncedTitle = useDebounce(titleFilter, 500);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadTags = async () => {
      try {
        const res = await api.get<string[]>("/score-tags");
        setAvailableTags(res.data.sort());
      } catch (err) {
        console.error("Failed to load tags", err);
      }
    };
    loadTags();
    fetchScores();
  }, [
    user,
    navigate,
    page,
    perPage,
    sortField,
    sortDirection,
    debouncedTitle,
    selectedTags,
  ]);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page,
        size: perPage,
        sort: `${sortField},${sortDirection}`,
      };

      if (debouncedTitle.trim()) params.title = debouncedTitle.trim();
      if (selectedTags.length > 0) params.tags = selectedTags;

      const response = await api.get<SearchResponse>("/scores/search", {
        params,
      });

      setScores(response.data.content);
      setTotalRows(response.data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load scores");
      console.error("Error fetching scores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => setPage(newPage - 1);

  const handlePerRowsChange = (newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage - 1);
  };

  const handleSort = (
    column: TableColumn<MusicScore>,
    sortDir: "asc" | "desc",
  ) => {
    setSortField(column.id as string);
    setSortDirection(sortDir);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleFilter(e.target.value);
    setPage(0);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const newTags = value
      ? value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    setTagsFilter(newTags);
    setPage(0);
  };

  if (!user) return null;

  return (
    <div className="all-scores-container">
      <h1>All Scores</h1>
      <div className="search-controls">
        <div className="search-group">
          <label htmlFor="titleSearch">Title contains:</label>
          <input
            id="titleSearch"
            type="text"
            value={titleFilter}
            onChange={handleTitleChange}
            placeholder="e.g. Canon"
          />
        </div>
        <div className="search-group">
          <label>Tags:</label>
          <Select
            isMulti
            name="tags"
            options={availableTags.map((tag) => ({ value: tag, label: tag }))}
            className="basic-multi-select"
            classNamePrefix="select"
            value={selectedTags.map((tag) => ({ value: tag, label: tag }))}
            onChange={(newValue) => {
              const tags = newValue.map((opt) => opt.value);
              setSelectedTags(tags);
              setPage(0);
            }}
            placeholder="Select tags..."
            components={makeAnimated()}
          />
        </div>
      </div>

      {loading && <div className="loading">Loading scores...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          {scores.length === 0 ? (
            <p className="no-results">No scores match your search criteria.</p>
          ) : (
            <DataTable
              columns={columns}
              data={scores}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationDefaultPage={page + 1}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              onSort={handleSort}
              sortServer
              defaultSortFieldId="scoreTitle"
              highlightOnHover
              pointerOnHover
              theme="dark"
              onRowClicked={(row) =>
                navigate(`/scores/${row.scoreId}`, {
                  state: { from: "all-scores" },
                })
              }
              progressPending={loading}
              customStyles={tableCustomStyles}
            />
          )}
        </>
      )}
    </div>
  );
}

const tableCustomStyles = {
  headRow: {
    style: {
      backgroundColor: "#101585",
      color: "#FFDD44",
    },
  },
  rows: {
    style: {
      backgroundColor: "#1e1e4d",
      color: "white",
      minHeight: "48px",
    },
  },
  pagination: {
    style: {
      backgroundColor: "#101585",
      color: "white",
      borderTop: "1px solid #444",
    },
  },
};
