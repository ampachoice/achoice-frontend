import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSellers } from '../../services/adminService';
import { getAllProducts } from '../../services/productService';
import api from '../../services/api';

export default function ManageProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    seller_id: '', name: '', description: '',
    price: '', quantity: '', unit: 'kg', category: '', image: '',
  });

  useEffect(() => {
    Promise.all([getAllProducts(), getSellers()])
      .then(([productsRes, sellersRes]) => {
        setProducts(productsRes.data.data || productsRes.data);
        setSellers(sellersRes.data.data || sellersRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/products', formData);
      setProducts([res.data.product || res.data, ...products]);
      setShowForm(false);
      setFormData({
        seller_id: '', name: '', description: '',
        price: '', quantity: '', unit: 'kg', category: '', image: '',
      });
      showToast('Product created successfully!');
    } catch (err) {
      showToast('Failed to create product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p.id !== productId));
      showToast('Product deleted successfully!');
    } catch (err) {
      showToast('Failed to delete product.');
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoIcon}>A</div>
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/dashboard')}>
            <span style={s.sidebarIcon}>📊</span> Dashboard
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/sellers')}>
            <span style={s.sidebarIcon}>🏪</span> Sellers
          </div>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <span style={s.sidebarIcon}>🌾</span> Products
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/orders')}>
            <span style={s.sidebarIcon}>📦</span> Orders
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/loans')}>
            <span style={s.sidebarIcon}>💰</span> Loans
          </div>
        </nav>
        <div style={s.sidebarFooter}>
          <button style={s.logoutBtn} onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/admin');
          }}>Logout</button>
        </div>
      </div>

      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Manage Products</h1>
            <p style={s.headerSub}>{products.length} products on the platform</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add New Product'}
          </button>
        </div>

        {showForm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Add New Product</h2>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Seller</label>
                  <select style={s.input} name="seller_id"
                    value={formData.seller_id} onChange={handleChange} required>
                    <option value="">Select seller</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.business_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Product Name</label>
                  <input style={s.input} type="text" name="name"
                    placeholder="e.g. Fresh Tomatoes" value={formData.name}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Category</label>
                  <select style={s.input} name="category"
                    value={formData.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    <option value="grains">Grains</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="tubers">Tubers</option>
                    <option value="livestock">Livestock</option>
                    <option value="oils">Oils</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Price (NGN)</label>
                  <input style={s.input} type="number" name="price"
                    placeholder="e.g. 5000" value={formData.price}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Quantity</label>
                  <input style={s.input} type="number" name="quantity"
                    placeholder="e.g. 100" value={formData.quantity}
                    onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Unit</label>
                  <select style={s.input} name="unit"
                    value={formData.unit} onChange={handleChange}>
                    <option value="kg">kg</option>
                    <option value="bag">bag</option>
                    <option value="basket">basket</option>
                    <option value="litre">litre</option>
                    <option value="tuber">tuber</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Description</label>
                  <textarea style={{ ...s.input, height: 80, resize: 'vertical' }}
                    name="description" placeholder="Product description"
                    value={formData.description} onChange={handleChange} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Product Image</label>
                  <input
                    style={s.input}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <div style={s.hint}>Upload a product image (JPG, PNG)</div>
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 6, marginTop: 8 }}
                    />
                  )}
                </div>
              </div>
              <button style={submitting ? s.submitBtnDisabled : s.submitBtn}
                type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        <div style={s.searchRow}>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p style={s.message}>Loading products...</p>}

        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🌾</div>
            <p style={s.emptyText}>No products found</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr style={s.tableHead}>
                  <th style={s.th}>Image</th>
                  <th style={s.th}>Product</th>
                  <th style={s.th}>Seller</th>
                  <th style={s.th}>Category</th>
                  <th style={s.th}>Price</th>
                  <th style={s.th}>Qty</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} style={s.tableRow}>
                    <td style={s.td}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={s.productThumb}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={s.productThumbPlaceholder}>🌿</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={s.productName}>{product.name}</div>
                      <div style={s.productDesc}>{product.description}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.metaText}>
                        {product.seller ? product.seller.business_name : '—'}
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.categoryBadge}>{product.category}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.priceText}>
                        ₦{Number(product.price).toLocaleString()}
                      </div>
                      <div style={s.metaText}>per {product.unit}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.metaText}>{product.quantity}</div>
                    </td>
                    <td style={s.td}>
                      <div style={{
                        ...s.statusBadge,
                        background: product.status === 'available' ? '#eafaf0' : '#fff0f0',
                        color: product.status === 'available' ? '#1a7a3a' : '#cc0000',
                      }}>
                        {product.status}
                      </div>
                    </td>
                    <td style={s.td}>
                      <button style={s.deleteBtn}
                        onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999 },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarLogoIcon: { width: 36, height: 36, background: '#f0c050', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f4d1f', fontWeight: 900, fontSize: 18 },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8', marginTop: 1 },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #f0c050' },
  sidebarIcon: { fontSize: 16 },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutBtn: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  addBtn: { padding: '10px 20px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 28, marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  field: {},
  label: { display: 'block', fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  hint: { fontSize: 11, color: '#888', marginTop: 4 },
  submitBtn: { padding: '11px 28px', background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { padding: '11px 28px', background: '#ccc', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', maxWidth: 400, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  message: { textAlign: 'center', color: '#666', padding: 40 },
  emptyBox: { textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
  tableCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f7f5f0' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { borderTop: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  productThumb: { width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e4dc' },
  productThumbPlaceholder: { width: 50, height: 50, background: '#f7f5f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  productName: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 },
  productDesc: { fontSize: 12, color: '#888', maxWidth: 200 },
  metaText: { fontSize: 12, color: '#888' },
  categoryBadge: { display: 'inline-block', background: '#f0f7ec', color: '#1f4d1f', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, textTransform: 'capitalize' },
  priceText: { fontSize: 14, fontWeight: 600, color: '#1f4d1f' },
  statusBadge: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, textTransform: 'capitalize' },
  deleteBtn: { padding: '6px 14px', background: '#fff', color: '#cc0000', border: '1px solid #cc0000', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
};