import React, { useEffect, useState, useCallback } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import api from "../services/api";
import { extractErrorMessage } from "../utils/errorUtils";
import PageTitle from "./PageTitle";
import "./ScoresTable.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MusicScore {
  scoreId: number;
  scoreTitle: string;
  grade: number;
  arrangementType: {
    code: string;
    name?: string;
  } | null;
  scoreTags: { tag: string }[];
}

interface SearchResponse {
  content: MusicScore[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ScoresTableProps {
  /** Page heading */
  title: string;
  /** Optional subtitle shown below the heading */
  subtitle?: string;
  /** If provided, filters scores to this account (used for "My Scores") */
  accountId?: number;
  /** Which page the row-click should report as source (for back-navigation) */
  fromLabel: string;
  /** Message shown when there are zero results and no search is active */
  emptyMessage?: string;
}

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useIsSmallScreen(breakpoint = 768) {
  const [isSmall, setIsSmall] = useState(
    () => window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isSmall;
}

// ─── Column definitions ───────────────────────────────────────────────────────

function getColumns(isSmall: boolean): TableColumn<MusicScore>[] {
  const cols: TableColumn<MusicScore>[] = [];

  if (!isSmall) {
    cols.push({
      id: "scoreId",
      name: "ID",
      selector: (row) => row.scoreId,
      sortable: true,
      width: "90px",
      center: true,
    });
  }

  cols.push({
    id: "scoreTitle",
    name: "Title",
    selector: (row) => row.scoreTitle,
    sortable: true,
    grow: 3,
    wrap: true,
  });

  cols.push({
    id: "grade",
    name: "Grade",
    selector: (row) => row.grade,
    sortable: true,
    width: isSmall ? "70px" : "100px",
    center: true,
  });

  cols.push({
    id: "arrangementType",
    name: isSmall ? "Type" : "Arrangement Type",
    selector: (row) =>
      isSmall
        ? row.arrangementType?.code || "—"
        : row.arrangementType?.name || row.arrangementType?.code || "—",
    sortable: true,
    width: isSmall ? "80px" : "160px",
    wrap: true,
  });

  cols.push({
    id: "scoreTags",
    name: "Tags",
    selector: (row) => row.scoreTags?.map((st) => st.tag).join(", ") || "",
    sortable: false,
    grow: 1,
    wrap: true,
  });

  return cols;
}

// ─── Table custom styles ──────────────────────────────────────────────────────

const tableCustomStyles = {
  table: {
    style: {
      backgroundColor: "var(--primary-blue)",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#0d126e",
      color: "#FFDD44",
      minHeight: "52px",
      fontSize: "1rem",
      fontWeight: 600,
    },
  },
  headCells: {
    style: {
      color: "#FFDD44",
      fontSize: "1rem",
      fontWeight: 600,
      paddingLeft: "12px",
      paddingRight: "12px",
      whiteSpace: "normal" as const,
      overflow: "visible",
      textOverflow: "unset",
    },
  },
  rows: {
    style: {
      backgroundColor: "#1e1e4d",
      color: "white",
      minHeight: "48px",
      fontSize: "1.05rem",
      transition: "background-color 0.15s ease, color 0.15s ease",
    },
    highlightOnHoverStyle: {
      backgroundColor: "rgba(255, 221, 68, 0.2)",
      color: "#FFDD44",
      outline: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      textAlign: "left" as const,
      alignItems: "flex-start",
      paddingTop: "10px",
      paddingBottom: "10px",
    },
  },
  pagination: {
    style: {
      backgroundColor: "#0d126e",
      color: "white",
      borderTop: "1px solid #444",
      fontSize: "0.95rem",
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const animatedComponents = makeAnimated();

export default function ScoresTable({
  title,
  subtitle,
  accountId,
  fromLabel,
  emptyMessage = "No scores found.",
}: ScoresTableProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSmall = useIsSmallScreen();
  const columns = getColumns(isSmall);

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

  // Fetch scores
  const fetchScores = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, unknown> = {
        page,
        size: perPage,
        sort: `${sortField},${sortDirection}`,
      };

      if (accountId) params.accountId = accountId;
      if (debouncedTitle.trim()) params.title = debouncedTitle.trim();
      if (selectedTags.length > 0) params.tags = selectedTags;

      const response = await api.get<SearchResponse>("/scores/search", {
        params,
      });

      setScores(response.data.content || []);
      setTotalRows(response.data.totalElements || 0);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to load scores"));
      console.error("Error fetching scores:", err);
    } finally {
      setLoading(false);
    }
  }, [user, page, perPage, sortField, sortDirection, debouncedTitle, selectedTags, accountId]);

  // Load available tags once
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await api.get<string[]>("/score-tags");
        setAvailableTags(res.data.sort());
      } catch (err) {
        console.error("Failed to load tags", err);
      }
    };
    loadTags();
  }, []);

  // Fetch scores when dependencies change
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchScores();
  }, [user, navigate, fetchScores]);

  // Handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleFilter(e.target.value);
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

  if (!user) return null;

  return (
    <div className="scores-container">
      {/* Decorative staff with title */}
      <PageTitle title={title} />
      {subtitle && <p className="scores-subtitle">{subtitle}</p>}

      {/* Search controls */}
      <div className="scores-search-controls">
        <div className="scores-search-group">
          <label htmlFor="scores-title-search">Title contains:</label>
          <input
            id="scores-title-search"
            type="text"
            value={titleFilter}
            onChange={handleTitleChange}
            placeholder="Start typing to search..."
            aria-describedby="scores-search-hint"
          />
          <span id="scores-search-hint" className="visually-hidden">
            Results update automatically as you type
          </span>
        </div>
        <div className="scores-search-group scores-search-group--tags">
          <label id="scores-tags-label">Tags:</label>
          <Select
            isMulti
            name="tags"
            aria-labelledby="scores-tags-label"
            options={availableTags.map((tag) => ({ value: tag, label: tag }))}
            className="basic-multi-select"
            classNamePrefix="select"
            value={selectedTags.map((tag) => ({ value: tag, label: tag }))}
            onChange={(newValue) => {
              const tags = newValue ? newValue.map((opt) => opt.value) : [];
              setSelectedTags(tags);
              setPage(0);
            }}
            placeholder="Filter by tags..."
            components={animatedComponents}
          />
        </div>
      </div>

      {/* Loading state with musical animation */}
      {loading && (
        <div className="scores-loading" role="status" aria-live="polite">
          <div className="scores-loading-notes" aria-hidden="true">
            <span className="loading-note">♩</span>
            <span className="loading-note">♪</span>
            <span className="loading-note">♫</span>
            <span className="loading-note">♬</span>
            <span className="loading-note">♩</span>
          </div>
          <p>Loading scores...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="scores-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {scores.length === 0 && !debouncedTitle && selectedTags.length === 0 ? (
            <div className="scores-empty">
              <span className="scores-empty-icon" aria-hidden="true">𝄞</span>
              <p>{emptyMessage}</p>
            </div>
          ) : scores.length === 0 ? (
            <p className="scores-no-results">
              No scores match your search criteria.
            </p>
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
                  state: { from: fromLabel },
                })
              }
              customStyles={tableCustomStyles}
            />
          )}
        </>
      )}

      {/* Decorative staff line at bottom */}
      <div className="scores-staff-accent" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  );
}
