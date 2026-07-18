import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getAdminFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
} from "../../services/adminService";
import { getAllProducts } from "../../services/productService";

// Lagos (WAT) is a fixed UTC+1 offset year-round — no DST — so this
// conversion is always correct regardless of the admin's own browser timezone.
const LAGOS_OFFSET = "+01:00";

// <input type="datetime-local"> gives "2026-07-20T15:00" with no timezone info.
// We treat that value as Lagos wall-clock time and convert to a UTC ISO
// string for the API — this is the conversion the phase plan calls out as
// required, since the backend stores and compares everything in UTC.
const lagosLocalToUtcIso = (localValue) => {
  if (!localValue) return null;
  return new Date(`${localValue}:00${LAGOS_OFFSET}`).toISOString();
};

// The reverse — a UTC ISO string from the API back into a Lagos-local
// "YYYY-MM-DDTHH:mm" string, for pre-filling the datetime-local input when editing.
const utcIsoToLagosLocal = (utcIso) => {
  if (!utcIso) return "";
  const lagosMs = new Date(utcIso).getTime() + 60 * 60 * 1000;
  const d = new Date(lagosMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

// Same conversion, but for read-only display in the table.
const formatLagos = (utcIso) => {
  if (!utcIso) return "—";
  const lagosMs = new Date(utcIso).getTime() + 60 * 60 * 1000;
  const d = new Date(lagosMs);
  return d.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const STATUS_COLORS = {
  scheduled: { bg: "#eaf2fb", color: "#1a5fa8" },
  active: { bg: "#e6f4ea", color: "#1f4d1f" },
  ended: { bg: "#f0f0f0", color: "#666" },
  cancelled: { bg: "#fbe9e9", color: "#a81f1f" },
};

const EMPTY_FORM = { product_id: "", sale_price: "", quantity_limit: "", starts_at: "", ends_at: "" };

export default function AdminFlashSalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null); // null = creating, else the sale being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [editStatus, setEditStatus] = useState("scheduled");
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearching, setProductSearching] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadSales = useCallback(() => {
    setLoading(true);
    getAdminFlashSales(statusFilter ? { status: statusFilter } : {})
      .then((res) => setSales(res.data?.data || res.data || []))
      .catch(() => showToast("Failed to load flash sales."))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Debounced product search — only while creating (product is fixed once a sale exists)
  useEffect(() => {
    if (!showForm || editingSale) return;
    setProductSearching(true);
    const t = setTimeout(() => {
      getAllProducts({ search: productQuery, per_page: 20 })
        .then((res) => setProductResults(res.data?.data || res.data || []))
        .catch(() => setProductResults([]))
        .finally(() => setProductSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery, showForm, editingSale]);

  const openCreateForm = () => {
    setEditingSale(null);
    setForm(EMPTY_FORM);
    setSelectedProduct(null);
    setProductQuery("");
    setProductResults([]);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (sale) => {
    setEditingSale(sale);
    setSelectedProduct(sale.product);
    setForm({
      product_id: sale.product_id,
      sale_price: String(sale.sale_price),
      quantity_limit: String(sale.quantity_limit),
      starts_at: utcIsoToLagosLocal(sale.starts_at),
      ends_at: utcIsoToLagosLocal(sale.ends_at),
    });
    setEditStatus(sale.status);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError(null);
  };

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setForm((f) => ({ ...f, product_id: p.id }));
    setProductResults([]);
    setProductQuery(p.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.product_id) {
      setFormError("Select a product.");
      return;
    }
    if (!form.starts_at || !form.ends_at) {
      setFormError("Set both a start and end time.");
      return;
    }

    const payload = {
      sale_price: Number(form.sale_price),
      quantity_limit: Number(form.quantity_limit),
      starts_at: lagosLocalToUtcIso(form.starts_at),
      ends_at: lagosLocalToUtcIso(form.ends_at),
    };

    setSaving(true);
    try {
      if (editingSale) {
        await updateFlashSale(editingSale.id, { ...payload, status: editStatus });
        showToast("Flash sale updated.");
      } else {
        await createFlashSale({ product_id: form.product_id, ...payload });
        showToast("Flash sale created.");
      }
      closeForm();
      loadSales();
    } catch (err) {
      // Surfaces the backend's specific message verbatim — e.g. the 422 for
      // an overlapping sale on the same product, a sale price that isn't
      // below the regular price, or a quantity limit above available stock —
      // handled gracefully in the form instead of a generic failure.
      setFormError(err.response?.data?.message || "Failed to save flash sale. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSale = async (sale) => {
    if (!window.confirm(`Cancel the flash sale for "${sale.product?.name}"?`)) return;
    try {
      await updateFlashSale(sale.id, { status: "cancelled" });
      showToast("Flash sale cancelled.");
      loadSales();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel flash sale.");
    }
  };

  const handleDelete = async (sale) => {
    if (!window.confirm(`Permanently delete the flash sale for "${sale.product?.name}"? This cannot be undone.`)) return;
    try {
      await deleteFlashSale(sale.id);
      showToast("Flash sale deleted.");
      loadSales();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete flash sale.");
    }
  };

  return (
    <AdminLayout
      title="Flash Sales"
      subtitle="Create and manage time-limited discounts for the landing page's Flash Sale strip."
      headerActions={
        <button style={s.newBtn} onClick={openCreateForm}>
          + New Flash Sale
        </button>
      }
    >
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.tabRow}>
        {["", "scheduled", "active", "ended", "cancelled"].map((st) => (
          <button
            key={st || "all"}
            style={statusFilter === st ? s.tabActive : s.tab}
            onClick={() => setStatusFilter(st)}
          >
            {st ? st[0].toUpperCase() + st.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading flash sales...</div>
      ) : sales.length === 0 ? (
        <div style={s.emptyState}>
          No flash sales{statusFilter ? ` with status "${statusFilter}"` : ""} yet.
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Product</th>
                <th style={s.th}>Price</th>
                <th style={s.th}>Sold / Limit</th>
                <th style={s.th}>Starts (Lagos)</th>
                <th style={s.th}>Ends (Lagos)</th>
                <th style={s.th}>Status</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const colors = STATUS_COLORS[sale.status] || { bg: "#eee", color: "#555" };
                return (
                  <tr key={sale.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: "#111" }}>
                        {sale.product?.name || `#${sale.product_id}`}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#888" }}>
                        {sale.product?.seller?.business_name}
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 700, color: "#cc0000" }}>
                        ₦{Number(sale.sale_price).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#999", textDecoration: "line-through" }}>
                        ₦{Number(sale.product?.price || 0).toLocaleString()}
                      </div>
                    </td>
                    <td style={s.td}>
                      {sale.quantity_sold} / {sale.quantity_limit}
                    </td>
                    <td style={s.td}>{formatLagos(sale.starts_at)}</td>
                    <td style={s.td}>{formatLagos(sale.ends_at)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, background: colors.bg, color: colors.color }}>
                        {sale.status}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                      <button style={s.linkBtn} onClick={() => openEditForm(sale)}>
                        Edit
                      </button>
                      {["scheduled", "active"].includes(sale.status) && (
                        <button style={s.linkBtn} onClick={() => handleCancelSale(sale)}>
                          Cancel
                        </button>
                      )}
                      <button style={{ ...s.linkBtn, color: "#cc0000" }} onClick={() => handleDelete(sale)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={s.modalOverlay} onClick={closeForm}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>{editingSale ? "Edit Flash Sale" : "New Flash Sale"}</div>

            {formError && <div style={s.formError}>⚠️ {formError}</div>}

            <form onSubmit={handleSubmit}>
              {!editingSale && (
                <div style={s.field}>
                  <label style={s.label}>Product</label>
                  {selectedProduct ? (
                    <div style={s.selectedProduct}>
                      <span>
                        {selectedProduct.name} — ₦{Number(selectedProduct.price).toLocaleString()} (
                        {selectedProduct.quantity} in stock)
                      </span>
                      <button
                        type="button"
                        style={s.linkBtn}
                        onClick={() => {
                          setSelectedProduct(null);
                          setForm((f) => ({ ...f, product_id: "" }));
                          setProductQuery("");
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        style={s.input}
                        placeholder="Search products by name..."
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                      />
                      {productSearching && <div style={s.searchHint}>Searching...</div>}
                      {productResults.length > 0 && (
                        <div style={s.resultsList}>
                          {productResults.map((p) => (
                            <div key={p.id} style={s.resultItem} onClick={() => handleSelectProduct(p)}>
                              <span>{p.name}</span>
                              <span style={{ color: "#888", fontSize: 12 }}>
                                ₦{Number(p.price).toLocaleString()} · {p.quantity} in stock
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {editingSale && (
                <div style={s.field}>
                  <label style={s.label}>Product</label>
                  <div style={s.selectedProduct}>
                    <span>
                      {selectedProduct?.name} — regular price ₦{Number(selectedProduct?.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Sale Price (₦)</label>
                  <input
                    style={s.input}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.sale_price}
                    onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Quantity Limit</label>
                  <input
                    style={s.input}
                    type="number"
                    min="1"
                    required
                    value={form.quantity_limit}
                    onChange={(e) => setForm((f) => ({ ...f, quantity_limit: e.target.value }))}
                  />
                </div>
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Starts At (Lagos time)</label>
                  <input
                    style={s.input}
                    type="datetime-local"
                    required
                    value={form.starts_at}
                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Ends At (Lagos time)</label>
                  <input
                    style={s.input}
                    type="datetime-local"
                    required
                    value={form.ends_at}
                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                  />
                </div>
              </div>
              <div style={s.hint}>
                Times are entered in Lagos (WAT) time and converted to UTC automatically before saving —
                the backend stores and compares everything in UTC.
              </div>

              {editingSale && (
                <div style={s.field}>
                  <label style={s.label}>Status</label>
                  <select style={s.input} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" style={saving ? s.saveBtnDisabled : s.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : editingSale ? "Save Changes" : "Create Flash Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const s = {
  newBtn: {
    padding: "12px 24px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 8,
    fontSize: 13,
    zIndex: 999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  tabRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  tab: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 20,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#555",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabActive: {
    padding: "8px 16px",
    background: "#1f4d1f",
    border: "1px solid #1f4d1f",
    borderRadius: 20,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  emptyState: {
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    padding: 48,
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  tableWrap: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 10, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: 11.5,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #f2f0ec" },
  td: { padding: "14px 16px", verticalAlign: "top" },
  statusBadge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    textTransform: "capitalize",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#1f4d1f",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
    marginRight: 14,
    padding: 0,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 14,
    padding: 28,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: { fontSize: 19, fontWeight: 700, color: "#111", marginBottom: 18 },
  formError: {
    background: "#fff0f0",
    color: "#cc0000",
    border: "1px solid #ffb3b3",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 13.5,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  selectedProduct: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    background: "#f7f5f0",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 13,
  },
  searchHint: { fontSize: 12, color: "#888", marginTop: 6 },
  resultsList: {
    marginTop: 6,
    border: "1px solid #e8e4dc",
    borderRadius: 8,
    maxHeight: 200,
    overflowY: "auto",
  },
  resultItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    fontSize: 13,
    cursor: "pointer",
    borderBottom: "1px solid #f2f0ec",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  hint: { fontSize: 11.5, color: "#888", marginBottom: 16, lineHeight: 1.5 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  cancelBtn: {
    padding: "11px 20px",
    background: "#fff",
    color: "#555",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  saveBtn: {
    padding: "11px 22px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  saveBtnDisabled: {
    padding: "11px 22px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
};
