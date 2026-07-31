import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/adminService";

const EMPTY_FORM = {
  name: "",
  icon: "",
  parent_id: "",
  display_order: "",
  is_active: true,
};

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState([]); // full tree, including inactive
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null = creating
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const loadCategories = useCallback(() => {
    setLoading(true);
    getAdminCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => showToast("Failed to load categories."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Only top-level categories can be a parent — the backend supports one
  // level of nesting only, so subcategories never appear in this list.
  const topLevelCategories = categories;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openCreateForm = (parentId = "") => {
    setEditingCategory(null);
    resetForm();
    setForm((f) => ({ ...f, parent_id: parentId ? String(parentId) : "" }));
    setShowForm(true);
  };

  const openEditForm = (category, parent = null) => {
    setEditingCategory(category);
    setFormError(null);
    setForm({
      name: category.name || "",
      icon: category.icon || "",
      parent_id: parent ? String(parent.id) : "",
      display_order:
        category.display_order != null ? String(category.display_order) : "",
      is_active: category.is_active !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        display_order: form.display_order ? Number(form.display_order) : 0,
        is_active: form.is_active,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        showToast("Category updated.");
      } else {
        await createCategory(payload);
        showToast(
          payload.parent_id
            ? "Subcategory created."
            : "Category created.",
        );
      }
      closeForm();
      loadCategories();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Failed to save category. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const isParent = category.subcategories?.length > 0;
    if (
      !window.confirm(
        isParent
          ? `Delete "${category.name}" and all its subcategories? This cannot be undone.`
          : `Delete "${category.name}"? This cannot be undone.`,
      )
    )
      return;

    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
      showToast("Category deleted.");
      loadCategories();
    } catch (err) {
      // Backend blocks deletion when products are still linked to this
      // category — surface that message rather than a generic failure.
      showToast(
        err.response?.data?.message ||
          "Failed to delete category. It may still have products linked to it.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Categories"
      subtitle="Manage product categories and subcategories."
      headerActions={
        <button style={s.newBtn} onClick={() => openCreateForm()}>
          + Add Category
        </button>
      }
    >
      {toast && <div style={s.toast}>{toast}</div>}

      {loading ? (
        <div style={s.emptyState}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div style={s.emptyState}>
          No categories yet. Click "+ Add Category" to create the first one.
        </div>
      ) : (
        <div style={s.list}>
          {categories.map((cat) => (
            <div key={cat.id} style={s.parentCard}>
              <div style={s.parentRow}>
                <div style={s.parentInfo}>
                  <span style={s.catIcon}>{cat.icon || "📁"}</span>
                  <span style={s.catName}>{cat.name}</span>
                  <span style={s.catSlug}>/{cat.slug}</span>
                  {cat.is_active === false && (
                    <span style={s.inactiveBadge}>Inactive</span>
                  )}
                </div>
                <div style={s.rowActions}>
                  <button
                    style={s.linkBtn}
                    onClick={() => openCreateForm(cat.id)}
                  >
                    + Subcategory
                  </button>
                  <button style={s.linkBtn} onClick={() => openEditForm(cat)}>
                    Edit
                  </button>
                  <button
                    style={{ ...s.linkBtn, color: "#cc0000" }}
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat.id}
                  >
                    {deletingId === cat.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {cat.subcategories?.length > 0 && (
                <div style={s.subList}>
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} style={s.subRow}>
                      <div style={s.parentInfo}>
                        <span style={s.subArrow}>↳</span>
                        <span style={s.catName}>{sub.name}</span>
                        <span style={s.catSlug}>/{sub.slug}</span>
                        {sub.is_active === false && (
                          <span style={s.inactiveBadge}>Inactive</span>
                        )}
                      </div>
                      <div style={s.rowActions}>
                        <button
                          style={s.linkBtn}
                          onClick={() => openEditForm(sub, cat)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...s.linkBtn, color: "#cc0000" }}
                          onClick={() => handleDelete(sub)}
                          disabled={deletingId === sub.id}
                        >
                          {deletingId === sub.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={s.modalOverlay} onClick={closeForm}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>
              {editingCategory
                ? `Edit ${form.parent_id ? "Subcategory" : "Category"}`
                : form.parent_id
                  ? "Add Subcategory"
                  : "Add Category"}
            </div>

            {formError && <div style={s.formError}>⚠️ {formError}</div>}

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Name</label>
                <input
                  style={s.input}
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Rice"
                />
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Icon (emoji, optional)</label>
                  <input
                    style={s.input}
                    value={form.icon}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, icon: e.target.value }))
                    }
                    placeholder="🌾"
                    maxLength={4}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Display Order</label>
                  <input
                    style={s.input}
                    type="number"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        display_order: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Parent Category</label>
                <select
                  style={s.input}
                  value={form.parent_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parent_id: e.target.value }))
                  }
                  // A category that already has its own subcategories can't
                  // become a subcategory itself — only one level of nesting
                  // is supported. Also disabled once a parent has been fixed
                  // by clicking "+ Subcategory" from a specific row.
                  disabled={
                    editingCategory?.subcategories?.length > 0
                  }
                >
                  <option value="">— Top-level category —</option>
                  {topLevelCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {editingCategory?.subcategories?.length > 0 && (
                  <div style={s.hint}>
                    This category already has subcategories, so it can't be
                    nested under another one.
                  </div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked }))
                    }
                  />
                  Active (visible to buyers and sellers)
                </label>
              </div>

              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={closeForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={saving ? s.saveBtnDisabled : s.saveBtn}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Create"}
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
    padding: "12px 22px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13.5,
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
  emptyState: {
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    padding: 48,
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  parentCard: {
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    overflow: "hidden",
  },
  parentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    flexWrap: "wrap",
  },
  parentInfo: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  catIcon: { fontSize: 18 },
  catName: { fontSize: 14, fontWeight: 700, color: "#111" },
  catSlug: { fontSize: 12, color: "#999" },
  inactiveBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#a86a00",
    background: "#fff4de",
    padding: "2px 8px",
    borderRadius: 20,
    textTransform: "uppercase",
  },
  rowActions: { display: "flex", gap: 14, flexShrink: 0 },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#1f4d1f",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
    padding: 0,
  },
  subList: {
    borderTop: "1px solid #f0ece4",
    background: "#faf9f6",
  },
  subRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px 12px 32px",
    borderBottom: "1px solid #f0ece4",
    flexWrap: "wrap",
  },
  subArrow: { color: "#bbb", fontSize: 13 },
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
  modalTitle: { fontSize: 19, fontWeight: 700, color: "#111", marginBottom: 16 },
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
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#444",
    marginBottom: 6,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#444",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 13.5,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  hint: { fontSize: 11.5, color: "#888", marginTop: 6 },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
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
