import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../../services/adminService";

const ROLE_COLORS = {
  buyer: { bg: "#eaf2fb", color: "#1a5fa8" },
  seller: { bg: "#e6f4ea", color: "#1f4d1f" },
  staff: { bg: "#fff4de", color: "#a86a00" },
  admin: { bg: "#eee6fb", color: "#5a1aa8" },
};

export default function AdminUserSearchBar() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      searchUsers({ q: query.trim(), per_page: 8 })
        .then((res) => {
          setResults(res.data?.data || []);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const goToUser = (id) => {
    setOpen(false);
    setQuery("");
    navigate(`/admin/user-details/${id}`);
  };

  return (
    <div style={s.wrap} ref={wrapRef}>
      <div style={s.inputWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.input}
          placeholder="Search users by name, email, phone, ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>

      {open && (
        <div style={s.dropdown}>
          {loading ? (
            <div style={s.dropdownMsg}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={s.dropdownMsg}>No users match "{query}".</div>
          ) : (
            results.map((u) => {
              const colors = ROLE_COLORS[u.role] || { bg: "#eee", color: "#555" };
              return (
                <div key={u.id} style={s.resultRow} onClick={() => goToUser(u.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={s.resultName}>{u.name}</div>
                    <div style={s.resultSub}>
                      {u.email}{u.phone ? ` · ${u.phone}` : ""}
                      {u.seller?.business_name ? ` · ${u.seller.business_name}` : ""}
                    </div>
                  </div>
                  <span style={{ ...s.roleBadge, background: colors.bg, color: colors.color }}>{u.role}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { position: "relative", flex: 1, minWidth: 200, maxWidth: 360 },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 12, fontSize: 13, opacity: 0.5 },
  input: {
    width: "100%",
    padding: "10px 12px 10px 34px",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
    maxHeight: 360,
    overflowY: "auto",
    zIndex: 700,
  },
  dropdownMsg: { padding: "16px 14px", fontSize: 12.5, color: "#888", textAlign: "center" },
  resultRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f5f3ee",
  },
  resultName: { fontSize: 13, fontWeight: 700, color: "#111" },
  resultSub: { fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  roleBadge: { fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", flexShrink: 0 },
};
