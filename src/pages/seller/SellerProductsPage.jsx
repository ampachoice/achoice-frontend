import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SellerLayout from "../../components/seller/SellerLayout";
import {
  getSellerProfile,
  getSellerProducts,
  getSellerProduct,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  addProductGalleryImages,
  deleteProductGalleryImage,
} from "../../services/sellerService";

// Same unsigned Cloudinary preset the admin product form already uploads
// through — keeps this on the one proven-working image path in the codebase
// instead of relying on the server-side Cloudinary SDK, which nothing else
// here actually exercises.
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/i3gdrwus/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "achoice_preset";

async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
  return res.data.secure_url;
}

const CATEGORIES = [
  "grains",
  "vegetables",
  "fruits",
  "tubers",
  "livestock",
  "poultry",
  "fishery",
  "dairy",
  "processed",
  "other",
];
const UNITS = ["bag", "kg", "ton", "crate", "litre", "piece", "bunch"];

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "pending_review", label: "Pending Review" },
  { value: "rejected", label: "Rejected" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "suspended", label: "Suspended" },
];

const STATUS_COLORS = {
  available: { bg: "#e6f4ea", color: "#1f4d1f" },
  pending_review: { bg: "#eaf2fb", color: "#1a5fa8" },
  rejected: { bg: "#fbe9e9", color: "#a81f1f" },
  out_of_stock: { bg: "#fff4de", color: "#a86a00" },
  suspended: { bg: "#f0f0f0", color: "#666" },
};

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  discount_price: "",
  quantity: "",
  min_order_qty: "1",
  unit: "bag",
  category: "",
  tags: "",
};

export default function SellerProductsPage() {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = creating
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [galleryImages, setGalleryImages] = useState([]); // existing, once editing
  const [galleryUploading, setGalleryUploading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    getSellerProfile()
      .then((res) => setSeller(res.data))
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    setLoading(true);
    getSellerProducts({
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search }),
    })
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => showToast("Failed to load your products."))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300); // debounce search
    return () => clearTimeout(t);
  }, [loadProducts]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setGalleryImages([]);
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = async (product) => {
    setEditingProduct(product);
    setFormError(null);
    setShowForm(true);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      discount_price: product.discount_price
        ? String(product.discount_price)
        : "",
      quantity: String(product.quantity ?? ""),
      min_order_qty: String(product.min_order_qty ?? "1"),
      unit: product.unit || "bag",
      category: product.category || "",
      tags: product.tags || "",
    });
    setImageFile(null);
    setImagePreview(product.image || null);
    // The list endpoint doesn't include gallery images — fetch the full record.
    try {
      const res = await getSellerProduct(product.id);
      setGalleryImages(res.data?.images || []);
    } catch {
      setGalleryImages([]);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.category) {
      setFormError("Select a category.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingProduct ? editingProduct.image : undefined;
      if (imageFile) {
        setImageUploading(true);
        try {
          imageUrl = await uploadImageToCloudinary(imageFile);
        } catch {
          setFormError(
            "Image upload failed — the rest of the product was not saved. Please try again.",
          );
          setImageUploading(false);
          setSaving(false);
          return;
        }
        setImageUploading(false);
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        discount_price: form.discount_price
          ? Number(form.discount_price)
          : null,
        quantity: Number(form.quantity),
        min_order_qty: Number(form.min_order_qty) || 1,
        unit: form.unit,
        category: form.category,
        tags: form.tags || null,
        ...(imageUrl !== undefined && { image: imageUrl }),
      };

      if (editingProduct) {
        const res = await updateSellerProduct(editingProduct.id, payload);
        showToast(res.data?.message || "Product updated.");
      } else {
        const res = await createSellerProduct(payload);
        showToast(res.data?.message || "Product submitted for review.");
        // Drop straight into editing the new product so gallery images can be
        // added immediately without a second trip through the product list.
        if (res.data?.product) {
          await openEditForm(res.data.product);
          loadProducts();
          setSaving(false);
          return;
        }
      }
      closeForm();
      loadProducts();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Failed to save product. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddGalleryImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (files.length === 0 || !editingProduct) return;

    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadImageToCloudinary));
      const res = await addProductGalleryImages(editingProduct.id, urls);
      setGalleryImages((prev) => [...prev, ...(res.data?.images || [])]);
      showToast(`${files.length} image(s) added.`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add gallery images.");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteGalleryImage = async (imageId) => {
    try {
      await deleteProductGalleryImage(imageId);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      showToast("Failed to remove image.");
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`))
      return;
    try {
      await deleteSellerProduct(product.id);
      showToast("Product deleted.");
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const canAddProduct = seller?.status === "active";

  return (
    <SellerLayout
      title="Products"
      subtitle="Manage what you're selling on ACHOICE."
      headerActions={
        canAddProduct ? (
          <button style={s.newBtn} onClick={openCreateForm}>
            + Add Product
          </button>
        ) : seller ? (
          <span
            style={s.disabledHint}
            title="Your seller account must be active to list products"
          >
            Add Product (available once your account is approved)
          </span>
        ) : null
      }
    >
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.controlsRow}>
        <div style={s.tabRow}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              style={statusFilter === tab.value ? s.tabActive : s.tab}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          style={s.searchInput}
          placeholder="Search your products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading your products...</div>
      ) : products.length === 0 ? (
        <div style={s.emptyState}>
          {statusFilter
            ? `No products with status "${statusFilter.replace(/_/g, " ")}".`
            : "You haven't listed any products yet."}
        </div>
      ) : (
        <div style={s.grid}>
          {products.map((p) => {
            const colors = STATUS_COLORS[p.status] || {
              bg: "#eee",
              color: "#555",
            };
            return (
              <div key={p.id} style={s.card}>
                <div style={s.cardImage}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={s.cardImageImg} />
                  ) : (
                    <span style={{ fontSize: 34 }}>🌿</span>
                  )}
                  <span
                    style={{
                      ...s.statusBadge,
                      background: colors.bg,
                      color: colors.color,
                    }}
                  >
                    {p.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={s.cardName}>{p.name}</div>
                  <div style={s.cardMeta}>
                    {p.category} · {p.quantity} {p.unit} in stock
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      margin: "6px 0 10px",
                    }}
                  >
                    {p.discount_price ? (
                      <>
                        <span style={{ fontWeight: 700, color: "#cc0000" }}>
                          ₦{Number(p.discount_price).toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#999",
                            textDecoration: "line-through",
                          }}
                        >
                          ₦{Number(p.price).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 700, color: "#111" }}>
                        ₦{Number(p.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {p.status === "rejected" && p.rejection_reason && (
                    <div style={s.rejectionNote}>⚠️ {p.rejection_reason}</div>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button style={s.linkBtn} onClick={() => openEditForm(p)}>
                      Edit
                    </button>
                    <button
                      style={{ ...s.linkBtn, color: "#cc0000" }}
                      onClick={() => handleDelete(p)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={s.modalOverlay} onClick={closeForm}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>
              {editingProduct ? "Edit Product" : "Add Product"}
            </div>

            {formError && <div style={s.formError}>⚠️ {formError}</div>}
            {editingProduct?.status === "rejected" &&
              editingProduct?.rejection_reason && (
                <div style={s.rejectionBanner}>
                  <strong>This product was rejected:</strong>{" "}
                  {editingProduct.rejection_reason}
                </div>
              )}

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Primary Image</label>
                <div style={s.imageRow}>
                  <div style={s.imagePreviewBox}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={s.imagePreviewImg}
                      />
                    ) : (
                      <span style={{ fontSize: 24 }}>🌿</span>
                    )}
                  </div>
                  <label style={s.uploadBtn}>
                    {imageUploading
                      ? "Uploading..."
                      : imagePreview
                        ? "Change Image"
                        : "Choose Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Product Name</label>
                <input
                  style={s.input}
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea
                  style={{
                    ...s.input,
                    minHeight: 80,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  required
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Category</label>
                  <select
                    style={s.input}
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c[0].toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Unit</label>
                  <select
                    style={s.input}
                    value={form.unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit: e.target.value }))
                    }
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Price (₦)</label>
                  <input
                    style={s.input}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Discount Price (optional)</label>
                  <input
                    style={s.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount_price: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Quantity in Stock</label>
                  <input
                    style={s.input}
                    type="number"
                    min="0"
                    required
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Minimum Order Qty</label>
                  <input
                    style={s.input}
                    type="number"
                    min="1"
                    value={form.min_order_qty}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, min_order_qty: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Tags (optional, comma-separated)</label>
                <input
                  style={s.input}
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder="fresh, organic, local"
                />
              </div>

              {editingProduct && (
                <div style={s.field}>
                  <label style={s.label}>Gallery Images (up to 5)</label>
                  <div style={s.galleryGrid}>
                    {galleryImages.map((img) => (
                      <div key={img.id} style={s.galleryThumb}>
                        <img
                          src={img.image_url}
                          alt=""
                          style={s.galleryThumbImg}
                        />
                        <button
                          type="button"
                          style={s.galleryRemoveBtn}
                          onClick={() => handleDeleteGalleryImage(img.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {galleryImages.length < 5 && (
                      <label style={s.galleryAddBtn}>
                        {galleryUploading ? "..." : "+ Add"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddGalleryImages}
                          style={{ display: "none" }}
                          disabled={galleryUploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
              {!editingProduct && (
                <div style={s.hint}>
                  You'll be able to add gallery images right after creating this
                  product.
                </div>
              )}

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
                    : editingProduct
                      ? "Save Changes"
                      : "Submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SellerLayout>
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
  disabledHint: {
    fontSize: 12.5,
    color: "#a86a00",
    background: "#fff8e7",
    border: "1px solid #f0c050",
    borderRadius: 8,
    padding: "10px 14px",
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
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  tabRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: {
    padding: "8px 14px",
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabActive: {
    padding: "8px 14px",
    background: "#1f4d1f",
    border: "1px solid #1f4d1f",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  searchInput: {
    padding: "9px 14px",
    border: "1.5px solid #ddd",
    borderRadius: 20,
    fontSize: 13,
    minWidth: 220,
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    position: "relative",
    height: 140,
    background: "#f7f5f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImageImg: { width: "100%", height: "100%", objectFit: "cover" },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: 20,
    textTransform: "capitalize",
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: { fontSize: 11.5, color: "#888", textTransform: "capitalize" },
  rejectionNote: {
    fontSize: 11,
    color: "#a81f1f",
    background: "#fbe9e9",
    borderRadius: 6,
    padding: "6px 8px",
    marginTop: 6,
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
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: "#111",
    marginBottom: 16,
  },
  formError: {
    background: "#fff0f0",
    color: "#cc0000",
    border: "1px solid #ffb3b3",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  rejectionBanner: {
    background: "#fbe9e9",
    color: "#a81f1f",
    border: "1px solid #f3b3b3",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12.5,
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
  imageRow: { display: "flex", alignItems: "center", gap: 14 },
  imagePreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    background: "#f7f5f0",
    border: "1px solid #e8e4dc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  imagePreviewImg: { width: "100%", height: "100%", objectFit: "cover" },
  uploadBtn: {
    padding: "9px 16px",
    background: "#f7f5f0",
    border: "1.5px solid #ddd",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#1f4d1f",
    cursor: "pointer",
  },
  galleryGrid: { display: "flex", gap: 10, flexWrap: "wrap" },
  galleryThumb: {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid #e8e4dc",
  },
  galleryThumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  galleryRemoveBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    fontSize: 10,
    cursor: "pointer",
    lineHeight: 1,
  },
  galleryAddBtn: {
    width: 64,
    height: 64,
    borderRadius: 8,
    border: "1.5px dashed #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: "#888",
    cursor: "pointer",
    textAlign: "center",
  },
  hint: { fontSize: 11.5, color: "#888", marginBottom: 14 },
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
