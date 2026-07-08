import { useState, useEffect } from "react";
import api from "../../services/api";
import NotificationBell from "../../components/buyer/NotificationBell";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [settingKey, setSettingKey] = useState("");

  const fetchAuditLog = (pageNum = 1) => {
    setLoading(true);
    setError(null);
    const params = { page: pageNum };
    if (settingKey) params.setting_key = settingKey;

    api
      .get("/admin/settings/audit-log", { params })
      .then((res) => {
        setEntries(res.data?.data || []);
        setMeta(res.data || null);
        setPage(res.data?.current_page || pageNum);
      })
      .catch(() => setError("Failed to load audit log. Please check the connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuditLog(1);
  }, [settingKey]);

  // Debounce the search box so we're not firing a request on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setSettingKey(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const goToPage = (pageNum) => fetchAuditLog(pageNum);

  const lastPage = meta?.last_page || 1;

  const fmtValue = (v) => {
    if (v === null || v === undefined || v === "") return <span style={s.nullValue}>—</span>;
    return v;
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  return (
    <>
      <AdminLayout
        title="Settings Audit Log"
        subtitle="Every change to platform settings, who made it, and when"
        headerActions={
          <>
            <NotificationBell />
            <input
              style={s.input}
              type="text"
              placeholder="Search by setting key..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </>
        }
      >
        {loading && <p style={s.message}>Loading audit log...</p>}
        {error && <p style={s.errorMsg}>{error}</p>}

        {!loading && !error && entries.length === 0 && (
          <div style={s.emptyBox}>
            <p style={s.emptyText}>
              {settingKey
                ? `No changes found matching "${settingKey}".`
                : "No settings changes have been recorded yet."}
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Setting Key</th>
                  <th style={s.th}>Old Value</th>
                  <th style={s.th}>New Value</th>
                  <th style={s.th}>Changed By</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ ...s.td, fontWeight: 600, color: "#1f4d1f" }}>
                      {entry.setting_key}
                    </td>
                    <td style={s.td}>{fmtValue(entry.old_value)}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>
                      {fmtValue(entry.new_value)}
                    </td>
                    <td style={s.td}>
                      {entry.changed_by_name || entry.changed_by?.name || "-"}
                    </td>
                    <td style={s.td}>{fmtDate(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && lastPage > 1 && (
          <div style={s.paginationRow}>
            <button
              style={page <= 1 ? s.pageBtnDisabled : s.pageBtn}
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Prev
            </button>
            <span style={s.pageLabel}>
              Page {page} of {lastPage} ({meta.total} total)
            </span>
            <button
              style={page >= lastPage ? s.pageBtnDisabled : s.pageBtn}
              disabled={page >= lastPage}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </AdminLayout>
    </>
  );
}

const s = {
  input: {
    padding: "9px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    minWidth: 220,
  },
  message: { textAlign: "center", color: "#666", padding: 40 },
  errorMsg: { textAlign: "center", color: "#cc0000", padding: 20 },
  emptyBox: {
    textAlign: "center",
    padding: "60px 0",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
  },
  emptyText: { fontSize: 15, color: "#888" },
  tableWrap: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 700 },
  th: {
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f0ece4",
    fontSize: 13,
    color: "#333",
    verticalAlign: "middle",
  },
  nullValue: { color: "#bbb", fontStyle: "italic" },
  paginationRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: "24px 0",
  },
  pageBtn: {
    padding: "10px 20px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pageBtnDisabled: {
    padding: "10px 20px",
    background: "#f0f0f0",
    color: "#aaa",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  pageLabel: { fontSize: 13, color: "#555", fontWeight: 500 },
};
