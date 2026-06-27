import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSellers } from "../../services/adminService";
import api from "../../services/api";
import axios from "axios";

const LOGO_PATH = "/achoice logo.png";

const BACKEND_CATEGORIES = [
  { id: 1, name: "Grains", slug: "grains" },
  { id: 2, name: "Vegetables", slug: "vegetables" },
  { id: 3, name: "Fruits", slug: "fruits" },
  { id: 4, name: "Tubers", slug: "tubers" },
  { id: 5, name: "Livestock", slug: "livestock" },
  { id: 6, name: "Poultry", slug: "poultry" },
  { id: 7, name: "Fishery", slug: "fishery" },
  { id: 8, name: "Dairy", slug: "dairy" },
  { id: 9, name: "Processed", slug: "processed" },
  { id: 10, name: "Other", slug: "other" },
];

export default function ManageProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState(BACKEND_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    seller_id: "",
    name: "",
    description: "",
    price: "",
    discount_price: "",
    quantity: "",
    unit: "bag",
    category: "",
    status: "available",
    min_order_qty: 1,
  });

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const [pRes, sRes, cRes] = await Promise.allSettled([
        api.get(`/products?page=${pageNum}&per_page=20`),
        getSellers(),
        api.get("/settings/categories"),
      ]);
      if (pRes.status === "fulfilled") {
        const pData = pRes.value.data;
        setProducts(pData.data || pData || []);
        if (pData.meta || pData.last_page) setMeta(pData.meta || pData);
        setPage(pData.current_page || pageNum);
      }
      if (sRes.status === "fulfilled")
        setSellers(sRes.value.data.data || sRes.value.data || []);
      if (cRes.status === "fulfilled" && cRes.value.data) {
        const catData = cRes.value.data.categories || cRes.value.data || [];
        setCategories(catData.length > 0 ? catData : BACKEND_CATEGORIES);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNum) => {
    fetchData(pageNum);
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleEditOpen = (product) => {
    setEditProduct(product);
    setEditForm({
      seller_id: product.seller_id || "",
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      discount_price: product.discount_price || "",
      quantity: product.quantity || "",
      unit: product.unit || "bag",
      category: product.category || "",
      status: product.status || "available",
      min_order_qty: product.min_order_qty || 1,
    });
    setEditFile(null);
    setEditPreview(
      product.images?.[0]?.image_url ||
        product.images?.[0]?.url ||
        product.image ||
        null,
    );
  };

  const handleEditClose = () => {
    setEditProduct(null);
    setEditForm({});
    setEditFile(null);
    setEditPreview(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    let finalImageUrl = editPreview;
    if (editFile) {
      const cloudData = new FormData();
      cloudData.append("file", editFile);
      cloudData.append("upload_preset", "achoice_preset");
      try {
        const cloudRes = await axios.post(
          "https://api.cloudinary.com/v1_1/ds4wspou1/image/upload",
          cloudData,
        );
        finalImageUrl = cloudRes.data.secure_url;
      } catch {
        showToast("Image upload failed — keeping existing image.");
      }
    }
    try {
      const payload = {
        ...editForm,
        seller_id: Number(editForm.seller_id),
        price: Number(editForm.price),
        discount_price: editForm.discount_price
          ? Number(editForm.discount_price)
          : null,
        quantity: Number(editForm.quantity),
        min_order_qty: editForm.min_order_qty
          ? Number(editForm.min_order_qty)
          : 1,
        image: finalImageUrl,
      };
      await api.put(`/products/${editProduct.id}`, payload);
      showToast("Product updated successfully!");
      handleEditClose();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update product.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await api.delete(`/products/${id}`);
      await fetchData(page);
      showToast("Product deleted successfully.");
    } catch {
      showToast("Failed to delete product.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let finalImageUrl = "";
    if (selectedFile) {
      const cloudData = new FormData();
      cloudData.append("file", selectedFile);
      cloudData.append("upload_preset", "achoice_preset");
      try {
        const cloudRes = await axios.post(
          "https://api.cloudinary.com/v1_1/ds4wspou1/image/upload",
          cloudData,
        );
        finalImageUrl = cloudRes.data.secure_url;
      } catch {
        finalImageUrl = "";
      }
    }
    try {
      const payload = {
        ...formData,
        seller_id: Number(formData.seller_id),
        price: Number(formData.price),
        discount_price: formData.discount_price
          ? Number(formData.discount_price)
          : null,
        quantity: Number(formData.quantity),
        min_order_qty: Number(formData.min_order_qty) || 1,
        image: finalImageUrl,
      };
      const res = await api.post("/products", payload);
      showToast("Product created successfully!");
      await fetchData(1);
      setShowForm(false);
      setFormData({
        seller_id: "",
        name: "",
        description: "",
        price: "",
        discount_price: "",
        quantity: "",
        unit: "bag",
        category: "",
        status: "available",
        min_order_qty: 1,
      });
      setSelectedFile(null);
      setImagePreview(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = (p.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalProducts = meta?.total ?? products.length;
  const totalAvailable = products.filter(
    (p) => p.status === "available",
  ).length;
  const totalOutOfStock = products.filter(
    (p) => p.status === "out_of_stock",
  ).length;
  const totalSold = products.reduce(
    (acc, p) => acc + Number(p.items_sold || 0),
    0,
  );

  if (loading) return <div style={s.loader}>Loading Products...</div>;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Edit Modal */}
      {editProduct && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Edit — {editProduct.name}</h2>
              <button style={s.modalClose} onClick={handleEditClose}>
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <form onSubmit={handleEditSubmit}>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Seller</label>
                    <select
                      style={s.input}
                      name="seller_id"
                      value={editForm.seller_id}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Select seller</option>
                      {sellers.map((sel) => (
                        <option key={sel.id} value={sel.id}>
                          {sel.business_name || sel.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Product Name</label>
                    <input
                      style={s.input}
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Category</label>
                    <select
                      style={s.input}
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.slug || cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Status</label>
                    <select
                      style={s.input}
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                    >
                      <option value="available">Available</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Price (₦)</label>
                    <input
                      style={s.input}
                      type="number"
                      name="price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Discount Price (₦)</label>
                    <input
                      style={s.input}
                      type="number"
                      name="discount_price"
                      value={editForm.discount_price}
                      onChange={handleEditChange}
                      placeholder="Optional"
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Total Quantity in Stock</label>
                    <input
                      style={s.input}
                      type="number"
                      name="quantity"
                      value={editForm.quantity}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Min Order Qty</label>
                    <input
                      style={s.input}
                      type="number"
                      name="min_order_qty"
                      value={editForm.min_order_qty}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Unit</label>
                    <select
                      style={s.input}
                      name="unit"
                      value={editForm.unit}
                      onChange={handleEditChange}
                    >
                      {[
                        "bag",
                        "kg",
                        "ton",
                        "crate",
                        "litre",
                        "piece",
                        "bunch",
                      ].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Product Image</label>
                    <input
                      style={s.input}
                      type="file"
                      onChange={handleEditImageUpload}
                    />
                    {editPreview && (
                      <img
                        src={editPreview}
                        alt="preview"
                        style={s.previewImg}
                      />
                    )}
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={s.label}>Description</label>
                    <textarea
                      style={{ ...s.input, height: 80 }}
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button
                    type="button"
                    style={s.cancelBtn}
                    onClick={handleEditClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={editSubmitting ? s.submitBtnDisabled : s.submitBtn}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
            { icon: "👤", label: "Buyers", path: "/admin/buyers" },
            { icon: "📋", label: "Complaints", path: "/admin/complaints" },
            { icon: "🏪", label: "Sellers", path: "/admin/sellers" },
            {
              icon: "🌾",
              label: "Products",
              path: "/admin/products",
              active: true,
            },
            { icon: "📦", label: "Orders", path: "/admin/orders" },
            { icon: "💰", label: "Loans", path: "/admin/loans" },
            {
              icon: "⚙️",
              label: "Loan Settings",
              path: "/admin/loan-settings",
            },
            {
              icon: "🚚",
              label: "Delivery Zones",
              path: "/admin/delivery-zones",
            },
            { icon: "👥", label: "Staff", path: "/admin/staff" },
            { icon: "📈", label: "Reports", path: "/admin/reports" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...s.sidebarItem,
                ...(item.active ? s.sidebarItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Manage Products</h1>
            <p style={s.headerSub}>{totalProducts} products in inventory</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>

        {/* Summary Stats */}
        <div style={s.statsGrid}>
          {[
            { label: "Total Products", value: totalProducts, color: "#111" },
            { label: "Available", value: totalAvailable, color: "#1a7a3a" },
            { label: "Out of Stock", value: totalOutOfStock, color: "#cc0000" },
            {
              label: "Total Units Sold",
              value: totalSold.toLocaleString(),
              color: "#c8860a",
            },
          ].map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={s.statLabel}>{stat.label}</div>
              <div style={{ ...s.statValue, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Add New Product</h3>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Seller</label>
                  <select
                    style={s.input}
                    name="seller_id"
                    value={formData.seller_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select seller</option>
                    {sellers.map((sel) => (
                      <option key={sel.id} value={sel.id}>
                        {sel.business_name || sel.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Product Name</label>
                  <input
                    style={s.input}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Category</label>
                  <select
                    style={s.input}
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.slug || cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Status</label>
                  <select
                    style={s.input}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Price (₦)</label>
                  <input
                    style={s.input}
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Discount Price (₦)</label>
                  <input
                    style={s.input}
                    type="number"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Total Quantity in Stock</label>
                  <input
                    style={s.input}
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Min Order Qty</label>
                  <input
                    style={s.input}
                    type="number"
                    name="min_order_qty"
                    value={formData.min_order_qty}
                    onChange={handleChange}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Unit</label>
                  <select
                    style={s.input}
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    {[
                      "bag",
                      "kg",
                      "ton",
                      "crate",
                      "litre",
                      "piece",
                      "bunch",
                    ].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Product Image</label>
                  <input
                    style={s.input}
                    type="file"
                    onChange={handleImageUpload}
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="prev" style={s.previewImg} />
                  )}
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={s.label}>Description</label>
                  <textarea
                    style={{ ...s.input, height: 70 }}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                style={submitting ? s.submitBtnDisabled : s.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Create Product"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={s.filtersRow}>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={s.filterSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            style={s.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="suspended">Suspended</option>
          </select>
          <div style={s.filterCount}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Products Table */}
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr style={s.tableHead}>
                <th style={s.th}>Product</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Price</th>
                <th style={s.th}>Total Stock</th>
                <th style={s.th}>Sold</th>
                <th style={s.th}>Remaining</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const totalStock = Number(p.quantity || 0);
                const sold = Number(p.items_sold || 0);
                const remaining = Math.max(totalStock - sold, 0);
                const stockPct =
                  totalStock > 0
                    ? Math.min((remaining / totalStock) * 100, 100)
                    : 0;
                return (
                  <tr key={p.id} style={s.tableRow}>
                    <td style={s.td}>
                      <div style={s.productCell}>
                        <img
                          src={
                            p.images?.[0]?.image_url ||
                            p.images?.[0]?.url ||
                            p.image ||
                            "https://via.placeholder.com/40"
                          }
                          style={s.productThumb}
                          alt={p.name}
                        />
                        <div>
                          <div style={s.productName}>{p.name}</div>
                          <div
                            style={{
                              ...s.productSeller,
                              cursor: p.seller?.id ? "pointer" : "default",
                              color: p.seller?.id ? "#1f4d1f" : "#888",
                            }}
                            onClick={() =>
                              p.seller?.id &&
                              navigate(`/admin/sellers/${p.seller.id}`)
                            }
                          >
                            {p.seller?.business_name || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.categoryBadge}>{p.category}</span>
                    </td>
                    <td style={s.td}>
                      {p.discount_price ? (
                        <div>
                          <div style={s.discountPrice}>
                            ₦{Number(p.discount_price).toLocaleString()}
                          </div>
                          <div style={s.originalPrice}>
                            ₦{Number(p.price).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div style={s.priceVal}>
                          ₦{Number(p.price).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={s.stockVal}>
                        {totalStock} {p.unit}
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.soldVal}>{sold} sold</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.remainingVal}>
                        {remaining} {p.unit}
                      </div>
                      <div style={s.stockBar}>
                        <div
                          style={{
                            ...s.stockBarFill,
                            width: `${stockPct}%`,
                            background:
                              stockPct > 50
                                ? "#1f4d1f"
                                : stockPct > 20
                                  ? "#f0c050"
                                  : "#cc0000",
                          }}
                        />
                      </div>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.statusBadge,
                          background:
                            p.status === "available"
                              ? "#eafaf0"
                              : p.status === "out_of_stock"
                                ? "#fff0f0"
                                : "#f0f0f0",
                          color:
                            p.status === "available"
                              ? "#1a7a3a"
                              : p.status === "out_of_stock"
                                ? "#cc0000"
                                : "#888",
                        }}
                      >
                        {p.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.editBtn}
                        onClick={() => handleEditOpen(p)}
                      >
                        Edit
                      </button>
                      <button
                        style={s.deleteBtn}
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={s.empty}>No products found.</div>
          )}
          {meta && (meta.last_page || meta.total_pages || 1) > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
                padding: "24px 0",
              }}
            >
              <button
                style={{
                  padding: "10px 20px",
                  background: page <= 1 ? "#f0f0f0" : "#1f4d1f",
                  color: page <= 1 ? "#aaa" : "#fff",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                ? Prev
              </button>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>
                Page {page} of {meta.last_page || meta.total_pages || 1}
              </span>
              <button
                style={{
                  padding: "10px 20px",
                  background:
                    page >= (meta.last_page || meta.total_pages || 1)
                      ? "#f0f0f0"
                      : "#1f4d1f",
                  color:
                    page >= (meta.last_page || meta.total_pages || 1)
                      ? "#aaa"
                      : "#fff",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    page >= (meta.last_page || meta.total_pages || 1)
                      ? "not-allowed"
                      : "pointer",
                  fontFamily: "inherit",
                }}
                disabled={page >= (meta.last_page || meta.total_pages || 1)}
                onClick={() => goToPage(page + 1)}
              >
                Next ?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  loader: {
    textAlign: "center",
    padding: 100,
    fontSize: 18,
    color: "#1f4d1f",
    fontWeight: 600,
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "14px 28px",
    borderRadius: 8,
    zIndex: 9999,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 780,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 28px",
    borderBottom: "1px solid #eee",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#111", margin: 0 },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#888",
  },
  modalBody: { overflowY: "auto", padding: "24px 28px", flex: 1 },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: "16px 28px",
    borderTop: "1px solid #eee",
  },
  cancelBtn: {
    padding: "10px 24px",
    background: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  sidebar: {
    width: 240,
    background: "#1f4d1f",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoImg: { width: 40, height: 40, objectFit: "contain" },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  sidebarLogoSub: { fontSize: 10, color: "#a8d5a8" },
  sidebarNav: { flex: 1, padding: "16px 0" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    color: "#a8d5a8",
    fontSize: 14,
    cursor: "pointer",
  },
  sidebarItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderLeft: "3px solid #f0c050",
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: 700, color: "#111" },
  headerSub: { fontSize: 14, color: "#888", marginTop: 4 },
  addBtn: {
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "inherit",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  statLabel: { fontSize: 12, color: "#888", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: 700, color: "#111" },
  formCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 28,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1f4d1f",
    margin: "0 0 20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: "#444" },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  previewImg: {
    width: 60,
    height: 60,
    marginTop: 8,
    borderRadius: 6,
    objectFit: "cover",
    border: "1px solid #eee",
  },
  submitBtn: {
    width: "100%",
    padding: 13,
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    width: "100%",
    padding: 13,
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  filtersRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
    padding: "10px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },
  filterSelect: {
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
  },
  filterCount: { fontSize: 13, color: "#888", whiteSpace: "nowrap" },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e8e4dc",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { background: "#f7f5f0", borderBottom: "2px solid #eee" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: { borderTop: "1px solid #f5f5f5" },
  td: { padding: "14px 16px", verticalAlign: "middle", fontSize: 13 },
  productCell: { display: "flex", alignItems: "center", gap: 10 },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    objectFit: "cover",
    flexShrink: 0,
  },
  productName: { fontSize: 13, fontWeight: 600, color: "#111" },
  productSeller: { fontSize: 11, color: "#888", marginTop: 2 },
  categoryBadge: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "capitalize",
  },
  priceVal: { fontSize: 14, fontWeight: 700, color: "#1f4d1f" },
  discountPrice: { fontSize: 14, fontWeight: 700, color: "#1f4d1f" },
  originalPrice: {
    fontSize: 11,
    color: "#aaa",
    textDecoration: "line-through",
  },
  stockVal: { fontSize: 13, fontWeight: 600, color: "#111" },
  soldVal: { fontSize: 13, color: "#888" },
  remainingVal: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
    marginBottom: 4,
  },
  stockBar: {
    width: "80px",
    height: 4,
    background: "#eee",
    borderRadius: 99,
    overflow: "hidden",
  },
  stockBarFill: { height: "100%", borderRadius: 99, transition: "width 0.3s" },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
    textTransform: "capitalize",
  },
  editBtn: {
    background: "#f0f7ec",
    color: "#1f4d1f",
    border: "1px solid #a8d5a8",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    marginRight: 8,
    fontFamily: "inherit",
  },
  deleteBtn: {
    background: "#fff0f0",
    color: "#cc0000",
    border: "1px solid #ffa39e",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
  },
  empty: { padding: 40, textAlign: "center", color: "#999" },
};
