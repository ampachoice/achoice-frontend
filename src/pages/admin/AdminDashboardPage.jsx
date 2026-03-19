import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOrders, getAdminLoans, getSellers } from '../../services/adminService';
import { getAllProducts } from '../../services/productService';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    sellers: 0, products: 0, orders: 0, loans: 0,
    pendingLoans: 0, totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    Promise.all([
      getAdminOrders(),
      getAdminLoans(),
      getSellers(),
      getAllProducts(),
    ])
      .then(([ordersRes, loansRes, sellersRes, productsRes]) => {
        const orders = ordersRes.data.data || ordersRes.data;
        const loans = loansRes.data.data || loansRes.data;
        const sellers = sellersRes.data.data || sellersRes.data;
        const products = productsRes.data.data || productsRes.data;

        const totalRevenue = orders.reduce((sum, o) =>
          sum + Number(o.total_amount || 0), 0);
        const pendingLoans = loans.filter((l) => l.status === 'pending').length;

        setStats({
          sellers: sellers.length,
          products: products.length,
          orders: orders.length,
          loans: loans.length,
          pendingLoans,
          totalRevenue,
        });
        setRecentOrders(orders.slice(0, 5));
        setRecentLoans(loans.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { background: '#fff8e7', color: '#b36b00' },
      approved: { background: '#eafaf0', color: '#1a7a3a' },
      active: { background: '#e7f0ff', color: '#1a4fa0' },
      rejected: { background: '#fff0f0', color: '#cc0000' },
      completed: { background: '#f0f0f0', color: '#555' },
      delivered: { background: '#eafaf0', color: '#1a7a3a' },
      shipped: { background: '#e7f7ff', color: '#0077aa' },
    };
    return styles[status] || { background: '#f0f0f0', color: '#555' };
  };

  return (
    <div style={s.page}>

      {/* Sidebar */}
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
          <div style={s.sidebarItem} onClick={() => navigate('/admin/products')}>
            <span style={s.sidebarIcon}>🌾</span> Products
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/orders')}>
            <span style={s.sidebarIcon}>📦</span> Orders
          </div>
          <div style={s.sidebarItem} onClick={() => navigate('/admin/loans')}>
            <span style={s.sidebarIcon}>💰</span> Loans
            {stats.pendingLoans > 0 && (
              <span style={s.badge}>{stats.pendingLoans}</span>
            )}
          </div>
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.sidebarUser}>
            <div style={s.sidebarAvatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div style={s.sidebarUserName}>{user.name || 'Admin'}</div>
              <div style={s.sidebarUserRole}>Administrator</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={s.main}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Dashboard</h1>
            <p style={s.headerSub}>Welcome back, {user.name || 'Admin'}</p>
          </div>
          <div style={s.headerDate}>
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </div>
        </div>

        {loading ? (
          <p style={s.loading}>Loading dashboard...</p>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={s.statsGrid}>
              {[
                { label: 'Total Sellers', value: stats.sellers, icon: '🏪', color: '#1f4d1f' },
                { label: 'Total Products', value: stats.products, icon: '🌾', color: '#c8860a' },
                { label: 'Total Orders', value: stats.orders, icon: '📦', color: '#1a4fa0' },
                { label: 'Total Loans', value: stats.loans, icon: '💰', color: '#7b2d8b' },
                { label: 'Pending Loans', value: stats.pendingLoans, icon: '⏳', color: '#cc0000' },
                { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: '💵', color: '#1f4d1f' },
              ].map((stat) => (
                <div key={stat.label} style={s.statCard}>
                  <div style={s.statTop}>
                    <div style={s.statLabel}>{stat.label}</div>
                    <div style={s.statIcon}>{stat.icon}</div>
                  </div>
                  <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div style={s.activityGrid}>

              {/* Recent Orders */}
              <div style={s.activityCard}>
                <div style={s.activityHeader}>
                  <h2 style={s.activityTitle}>Recent Orders</h2>
                  <span style={s.viewAll} onClick={() => navigate('/admin/orders')}>
                    View all
                  </span>
                </div>
                {recentOrders.length === 0 ? (
                  <p style={s.empty}>No orders yet</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} style={s.activityItem}>
                      <div style={s.activityLeft}>
                        <div style={s.activityId}>Order #{order.id}</div>
                        <div style={s.activityMeta}>
                          {order.buyer ? order.buyer.name : 'Buyer'} —
                          ₦{Number(order.total_amount).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ ...s.statusBadge, ...getStatusStyle(order.status) }}>
                        {order.status}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Recent Loans */}
              <div style={s.activityCard}>
                <div style={s.activityHeader}>
                  <h2 style={s.activityTitle}>Recent Loans</h2>
                  <span style={s.viewAll} onClick={() => navigate('/admin/loans')}>
                    View all
                  </span>
                </div>
                {recentLoans.length === 0 ? (
                  <p style={s.empty}>No loans yet</p>
                ) : (
                  recentLoans.map((loan) => (
                    <div key={loan.id} style={s.activityItem}>
                      <div style={s.activityLeft}>
                        <div style={s.activityId}>
                          ₦{Number(loan.amount).toLocaleString()}
                        </div>
                        <div style={s.activityMeta}>
                          {loan.user ? loan.user.name : 'Applicant'} — {loan.purpose}
                        </div>
                      </div>
                      <div style={{ ...s.statusBadge, ...getStatusStyle(loan.status) }}>
                        {loan.status}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarLogoIcon: { width: 36, height: 36, background: '#f0c050', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f4d1f', fontWeight: 900, fontSize: 18 },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8', marginTop: 1 },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer', position: 'relative' },
  sidebarIcon: { fontSize: 16 },
  badge: { marginLeft: 'auto', background: '#cc0000', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99 },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  sidebarUser: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  sidebarAvatar: { width: 32, height: 32, background: '#f0c050', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f4d1f', fontWeight: 700, fontSize: 14 },
  sidebarUserName: { fontSize: 13, fontWeight: 600, color: '#fff' },
sidebarUserRole: { fontSize: 11, color: '#a8d5a8' },
  logoutBtn: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, marginLeft: 240, padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#888' },
  headerDate: { fontSize: 13, color: '#888' },
  loading: { textAlign: 'center', color: '#666', padding: 40 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 20 },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 13, color: '#888' },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 28, fontWeight: 700 },
  activityGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  activityCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 20 },
  activityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  activityTitle: { fontSize: 16, fontWeight: 700, color: '#111' },
  viewAll: { fontSize: 13, color: '#1f4d1f', cursor: 'pointer', fontWeight: 500 },
  activityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  activityLeft: {},
  activityId: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 },
  activityMeta: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, textTransform: 'capitalize' },
  empty: { color: '#888', fontSize: 13, textAlign: 'center', padding: 20 },
};