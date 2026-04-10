import { useEffect, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import Select from "react-select";
import makeAnimated from "react-select/animated";
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
  scoreTags: {
    tag: string;
  }[];
}

const columns: TableColumn<MusicScore>[] = [
  {
    id: "scoreId",
    name: "ID",
    selector: (row) => row.scoreId,
    sortable: true,
    center: true,
  },
  {
    id: "scoreTitle",
    name: "Title",
    selector: (row) => row.scoreTitle,
    sortable: true,
    grow: 1,
  },
  {
    id: "grade",
    name: "Grade",
    selector: (row) => row.grade,
    sortable: true,
    center: true,
  },
  {
    id: "arrangementType.code",
    name: "Arrangement Type",
    selector: (row) =>
      row.arrangementType?.name || row.arrangementType?.code || "—",
    sortable: true,
    grow: 1,
  },
  {
    id: "scoreTags",
    name: "Tags",
    selector: (row) => row.scoreTags?.map((st) => st.tag).join(", ") || "",
    sortable: false,
    grow: 1,
    wrap: true,
  },
];

export default function MyScores() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [scores, setScores] = useState<MusicScore[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [titleFilter, setTitleFilter] = useState(""); // live typing
  const [searchTitle, setSearchTitle] = useState(""); // actual search value

  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState("scoreTitle");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
        setIsLoading(true);
        const params: any = {
          accountId: user.accountId,
          size: perPage,
          page: page,
          sort: sortDirection === "desc" ? `${sortField},desc` : sortField,
        };

        if (searchTitle?.trim()) {
          params.title = searchTitle.trim();
        }
        if (selectedTags.length > 0) {
          params.tags = selectedTags;
        }

        const response = await api.get("/scores/search", { params });

        setScores(response.data.content || []);
        setTotalRows(response.data.totalElements || 0);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load your scores");
        console.error("Error fetching scores:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadTags = async () => {
      try {
        const res = await api.get<string[]>("/score-tags");
        setAvailableTags(res.data.sort());
      } catch (err) {
        console.error("Failed to load tags", err);
      }
    };

    loadTags();
    fetchMyScores();
  }, [
    user,
    navigate,
    page,
    perPage,
    sortField,
    sortDirection,
    selectedTags,
    titleFilter,
    searchTitle,
  ]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleFilter(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const performSearch = () => {
    const trimmedTitle = titleFilter.trim();
    const hasTitleChanged = trimmedTitle !== searchTitle;
    const hasTagsChanged =
      JSON.stringify(selectedTags) !== JSON.stringify(searchTags);

    if (hasTitleChanged || hasTagsChanged) {
      setSearchTitle(trimmedTitle);
      setSearchTags([...selectedTags]);
      setPage(0);
    }
  };

  const clearFilters = () => {
    setTitleFilter("");
    setSelectedTags([]);
    setSearchTitle("");
    setSearchTags([]);
    setPage(0);
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

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-scores-container">
      <h1>My Scores</h1>
      <p>
        Logged in as: <strong>{user.accountName}</strong>
      </p>

      {totalRows === 0 && !isLoading ? (
        <p>
          You don't have any scores yet. Click the "Add Score" link to create
          your first score!
        </p>
      ) : (
        <div>
          <div className="search-controls">
            <div className="search-group">
              <label htmlFor="titleSearch">Title contains:</label>
              <input
                id="titleSearch"
                type="text"
                value={titleFilter}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                placeholder="e.g. America"
              />
            </div>

            <div className="search-group">
              <label>Tags:</label>
              <Select
                isMulti
                name="tags"
                options={availableTags.map((tag) => ({
                  value: tag,
                  label: tag,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={selectedTags.map((tag) => ({ value: tag, label: tag }))}
                onChange={(newValue) => {
                  const tags = newValue ? newValue.map((opt) => opt.value) : [];
                  setSelectedTags(tags);
                }}
                placeholder="Select tags..."
                components={makeAnimated()}
              />
            </div>
            <div className="search-buttons">
              <button onClick={performSearch} className="primary-button">
                🔍 Search
              </button>
              <button onClick={clearFilters} className="primary-button">
                Clear Filters
              </button>
            </div>
          </div>
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
                state: { from: "my-scores" },
              })
            }
            progressPending={loading}
            customStyles={tableCustomStyles}
            responsive={true}
          />
        </div>
      )}
    </div>
  );
}

const tableCustomStyles = {
  table: {
    style: {
      width: "100%",
    },
  },
  headCells: {
    style: {
      fontSize: "1.5rem",
    },
  },
  cells: {
    style: {
      fontSize: "1.1rem",
      padding: "12px 8px",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#101585",
      color: "#FFDD44",
      minHeight: "52px",
    },
  },
  rows: {
    style: {
      backgroundColor: "#1e1e4d",
      color: "white",
    },
  },
  pagination: {
    style: {
      backgroundColor: "#101585",
      color: "white",
      fontSize: ".9rem",
    },
  },
};
