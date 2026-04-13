import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSellers } from '../../services/adminService';
import { getAllProducts } from '../../services/productService';
import api from '../../services/api';
import axios from 'axios';

const LOGO_PATH = "/achoice logo.png";

const BACKEND_CATEGORIES = [
  { id: 1, name: 'Grains', slug: 'grains' },
  { id: 2, name: 'Vegetables', slug: 'vegetables' },
  { id: 3, name: 'Fruits', slug: 'fruits' },
  { id: 4, name: 'Tubers', slug: 'tubers' },
  { id: 5, name: 'Livestock', slug: 'livestock' },
  { id: 6, name: 'Poultry', slug: 'poultry' },
  { id: 7, name: 'Fishery', slug: 'fishery' },
  { id: 8, name: 'Dairy', slug: 'dairy' },
  { id: 9, name: 'Processed', slug: 'processed' },
  { id: 10, name: 'Other', slug: 'other' },
];

export default function ManageProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState(BACKEND_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Image states for ADD form
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // ✅ Edit modal states
  const [editProduct, setEditProduct] = useState(null); // product being edited
  const [editForm, setEditForm] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ADD form state
  const [formData, setFormData] = useState({
    seller_id: '', name: '', description: '',
    price: '', quantity: '', unit: 'bag',
    category: '', status: 'available',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, cRes] = await Promise.allSettled([
        getAllProducts(),
        getSellers(),
        api.get('/settings/categories'),
      ]);
      if (pRes.status === 'fulfilled') setProducts(pRes.value.data.data || pRes.value.data || []);
      if (sRes.status === 'fulfilled') setSellers(sRes.value.data.data || sRes.value.data || []);
      if (cRes.status === 'fulfilled' && cRes.value.data) {
        const catData = cRes.value.data.categories || cRes.value.data || [];
        setCategories(catData.length > 0 ? catData : BACKEND_CATEGORIES);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setEditFile(file); setEditPreview(URL.createObjectURL(file)); }
  };

  // ✅ Open edit modal — pre-fill form with product data
  const handleEditOpen = (product) => {
    setEditProduct(product);
    setEditForm({
      seller_id: product.seller_id || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discount_price: product.discount_price || '',
      quantity: product.quantity || '',
      unit: product.unit || 'bag',
      category: product.category || '',
      status: product.status || 'available',
      whatsapp_number: product.whatsapp_number || '',
      min_order_qty: product.min_order_qty || '',
    });
    setEditFile(null);
    setEditPreview(product.images?.[0]?.url || product.image || null);
  };

  const handleEditClose = () => {
    setEditProduct(null);
    setEditForm({});
    setEditFile(null);
    setEditPreview(null);
  };

  // ✅ Save edited product via PUT /api/products/{id}
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    let finalImageUrl = editPreview;

    if (editFile) {
      const cloudData = new FormData();
      cloudData.append('file', editFile);
      cloudData.append('upload_preset', 'achoice_preset');
      try {
        const cloudRes = await axios.post(
          'https://api.cloudinary.com/v1_1/ds4wspou1/image/upload',
          cloudData
        );
        finalImageUrl = cloudRes.data.secure_url;
      } catch {
        showToast('Image upload failed — keeping existing image.');
      }
    }

    try {
      const payload = {
        ...editForm,
        seller_id: Number(editForm.seller_id),
        price: Number(editForm.price),
        discount_price: editForm.discount_price ? Number(editForm.discount_price) : null,
        quantity: Number(editForm.quantity),
        min_order_qty: editForm.min_order_qty ? Number(editForm.min_order_qty) : 1,
        image: finalImageUrl,
      };

      await api.put(`/products/${editProduct.id}`, payload);
      showToast('✅ Product updated successfully!');
      handleEditClose();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      showToast('Product removed from inventory');
    } catch {
      showToast('Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let finalImageUrl = '';

    if (selectedFile) {
      const cloudData = new FormData();
      cloudData.append('file', selectedFile);
      cloudData.append('upload_preset', 'achoice_preset');
      try {
        const cloudRes = await axios.post(
          'https://api.cloudinary.com/v1_1/ds4wspou1/image/upload',
          cloudData
        );
        finalImageUrl = cloudRes.data.secure_url;
      } catch {
        finalImageUrl = 'https://via.placeholder.com/150?text=No+Image';
      }
    }

    try {
      const payload = {
        ...formData,
        seller_id: Number(formData.seller_id),
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        image: finalImageUrl,
      };
      await api.post('/products', payload);
      showToast('Product Successfully Listed!');
      setShowForm(false);
      setFormData({ seller_id: '', name: '', description: '', price: '', quantity: '', unit: 'bag', category: '', status: 'available' });
      setSelectedFile(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Backend sync failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={s.loader}>Syncing Achoice Inventory...</div>;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* ✅ Edit Modal */}
      {editProduct && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Edit Product</h2>
              <button style={s.modalClose} onClick={handleEditClose}>✕</button>
            </div>
            <div style={s.modalBody}>
              <form onSubmit={handleEditSubmit}>
                <div style={s.formGrid}>

                  <div style={s.field}>
                    <label style={s.label}>Seller</label>
                    <select style={s.input} name="seller_id" value={editForm.seller_id} onChange={handleEditChange} required>
                      <option value="">Select seller</option>
                      {sellers.map(sel => (
                        <option key={sel.id} value={sel.id}>{sel.business_name || sel.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Product Name</label>
                    <input style={s.input} name="name" value={editForm.name} onChange={handleEditChange} required />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Category</label>
                    <select style={s.input} name="category" value={editForm.category} onChange={handleEditChange} required>
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.slug || cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Status</label>
                    <select style={s.input} name="status" value={editForm.status} onChange={handleEditChange}>
                      <option value="available">Available</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Price (₦)</label>
                    <input style={s.input} type="number" name="price" value={editForm.price} onChange={handleEditChange} required />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Discount Price (₦) — optional</label>
                    <input style={s.input} type="number" name="discount_price" value={editForm.discount_price} onChange={handleEditChange} placeholder="Leave blank if no discount" />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Quantity</label>
                    <input style={s.input} type="number" name="quantity" value={editForm.quantity} onChange={handleEditChange} required />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Min Order Qty</label>
                    <input style={s.input} type="number" name="min_order_qty" value={editForm.min_order_qty} onChange={handleEditChange} />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Unit</label>
                    <select style={s.input} name="unit" value={editForm.unit} onChange={handleEditChange}>
                      {['bag', 'kg', 'ton', 'crate', 'litre', 'piece', 'bunch'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>WhatsApp Number</label>
                    <input style={s.input} name="whatsapp_number" value={editForm.whatsapp_number} onChange={handleEditChange} placeholder="e.g. 08012345678" />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Product Image</label>
                    <input style={s.input} type="file" onChange={handleEditImageUpload} />
                    {editPreview && (
                      <img src={editPreview} alt="preview" style={s.previewImg} />
                    )}
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={s.label}>Description</label>
                    <textarea style={{ ...s.input, height: 80 }} name="description" value={editForm.description} onChange={handleEditChange} required />
                  </div>

                </div>

                <div style={s.modalFooter}>
                  <button type="button" style={s.cancelBtn} onClick={handleEditClose}>Cancel</button>
                  <button
                    type="submit"
                    style={editSubmitting ? s.submitBtnDisabled : s.submitBtn}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
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
          <div style={s.sidebarItem} onClick={() => navigate('/admin/dashboard')}>📊 Dashboard</div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/sellers')}>🏪 Sellers</div>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>🌾 Products</div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/loans')}>💰 Loans</div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/loan-settings')}>⚙️ Loan Settings</div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Manage Products</h1>
            <p style={s.headerSub}>{products.length} Items in database</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div style={s.formCard}>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Seller</label>
                  <select style={s.input} name="seller_id" value={formData.seller_id} onChange={handleChange} required>
                    <option value="">Select seller</option>
                    {sellers.map(sel => (
                      <option key={sel.id} value={sel.id}>{sel.business_name || sel.name}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Product Name</label>
                  <input style={s.input} name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Category</label>
                  <select style={s.input} name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.slug || cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Status</label>
                  <select style={s.input} name="status" value={formData.status} onChange={handleChange} required>
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Price (₦)</label>
                  <input style={s.input} type="number" name="price" value={formData.price} onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Quantity</label>
                  <input style={s.input} type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Product Image</label>
                  <input style={s.input} type="file" onChange={handleImageUpload} />
                  {imagePreview && <img src={imagePreview} alt="prev" style={s.previewImg} />}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={s.label}>Description</label>
                  <textarea style={{ ...s.input, height: 70 }} name="description" value={formData.description} onChange={handleChange} required />
                </div>
              </div>
              <button type="submit" style={submitting ? s.submitBtnDisabled : s.submitBtn} disabled={submitting}>
                {submitting ? 'Syncing to Cloud...' : 'Create Product Entry'}
              </button>
            </form>
          </div>
        )}

        <div style={s.searchRow}>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr style={s.tableHead}>
                <th style={s.th}>Image</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Price</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={s.tableRow}>
                  <td style={s.td}>
                    <img
                      src={p.images?.[0]?.url || p.image || 'https://via.placeholder.com/40'}
                      style={s.productThumb}
                      alt={p.name}
                    />
                  </td>
                  <td style={s.td}><strong>{p.name}</strong></td>
                  <td style={s.td}><span style={s.categoryBadge}>{p.category}</span></td>
                  <td style={s.td}>
                    <span style={{
                      ...s.statusBadge,
                      backgroundColor: p.status === 'available' ? '#f0f7ec' : '#fff1f0',
                      color: p.status === 'available' ? '#1f4d1f' : '#cf1322',
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {p.discount_price
                      ? <><span style={s.discountPrice}>₦{Number(p.discount_price).toLocaleString()}</span>{' '}<span style={s.originalPrice}>₦{Number(p.price).toLocaleString()}</span></>
                      : `₦${Number(p.price).toLocaleString()}`
                    }
                  </td>
                  <td style={s.td}>
                    {/* ✅ Edit button */}
                    <button style={s.editBtn} onClick={() => handleEditOpen(p)}>Edit</button>
                    <button style={s.deleteBtn} onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>No products found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '14px 28px', borderRadius: 8, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },

  // ✅ Modal styles
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #eee' },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 },
  modalBody: { overflowY: 'auto', padding: '24px 28px', flex: 1 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 28px', borderTop: '1px solid #eee' },
  cancelBtn: { padding: '10px 24px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },

  sidebar: { width: 240, background: '#1f4d1f', position: 'fixed', height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoImg: { width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff' },
  sidebarLogoName: { fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 1 },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8', textTransform: 'uppercase' },
  sidebarNav: { padding: '16px 0' },
  sidebarItem: { padding: '14px 20px', color: '#a8d5a8', cursor: 'pointer', fontSize: 14 },
  sidebarItemActive: { background: 'rgba(255,255,255,0.1)', color: '#fff', borderLeft: '4px solid #f0c050' },
  main: { flex: 1, marginLeft: 240, padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 700, color: '#1a1a1a' },
  headerSub: { color: '#666', fontSize: 14, marginTop: 4 },
  addBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  formCard: { background: '#fff', padding: 30, borderRadius: 12, marginBottom: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: '#444' },
  input: { padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' },
  previewImg: { width: 60, height: 60, marginTop: 10, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' },
  submitBtn: { marginTop: 25, background: '#1f4d1f', color: '#fff', padding: 14, border: 'none', borderRadius: 8, cursor: 'pointer', width: '100%', fontWeight: 600 },
  submitBtnDisabled: { marginTop: 25, background: '#ccc', color: '#666', padding: 14, border: 'none', borderRadius: 8, width: '100%' },
  searchRow: { marginBottom: 25 },
  searchInput: { width: '100%', maxWidth: 450, padding: '14px 20px', border: 'none', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: 14 },
  tableCard: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f8f9fa', borderBottom: '2px solid #eee' },
  th: { padding: 16, textAlign: 'left', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: 16, borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  tableRow: {},
  productThumb: { width: 48, height: 48, borderRadius: 8, objectFit: 'cover' },
  categoryBadge: { background: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' },
  statusBadge: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' },
  discountPrice: { fontWeight: 700, color: '#1f4d1f' },
  originalPrice: { fontSize: 11, color: '#aaa', textDecoration: 'line-through' },

  // ✅ Action buttons
  editBtn: { color: '#1f4d1f', background: '#f0f7ec', border: '1px solid #a8d5a8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8 },
  deleteBtn: { color: '#cf1322', background: '#fff1f0', border: '1px solid #ffa39e', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  loader: { textAlign: 'center', padding: 100, fontSize: 18, color: '#1f4d1f', fontWeight: 600 },
};
