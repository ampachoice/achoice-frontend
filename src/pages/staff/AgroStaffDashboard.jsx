import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

const LOGO_PATH = "/achoice logo.png";

export default function AgroStaffDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "dashboard",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [updating, setUpdating] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [salesReport, setSalesReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Sellers (full list, same access as admin)
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerDetail, setSellerDetail] = useState(null);
  const [sellerDetailLoading, setSellerDetailLoading] = useState(false);

  // Remittance requests — two-tier flow. Agro staff can only pre-approve
  // ("staff_approved") or reject; admin must finalize the actual payout.
  const [remittances, setRemittances] = useState([]);
  const [remittancesLoading, setRemittancesLoading] = useState(false);
  const [remittanceBusyId, setRemittanceBusyId] = useState(null);

  // Sidebar red-alert badges — same pattern as AdminLayout
  const [badges, setBadges] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  useEffect(() => {
    api
      .get("/staff/agro/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      setOrdersLoading(true);
      api
        .get("/staff/agro/orders")
        .then((res) => setOrders(res.data.data || res.data || []))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
    if (activeTab === "inventory") {
      setInventoryLoading(true);
      Promise.all([
        api.get("/staff/agro/inventory"),
        api.get("/staff/agro/inventory/low-stock"),
      ])
        .then(([invRes, lowRes]) => {
          setInventory(invRes.data.data || invRes.data || []);
          setLowStock(lowRes.data.data || lowRes.data || []);
        })
        .catch(() => {})
        .finally(() => setInventoryLoading(false));
    }
    if (activeTab === "reports") {
      setReportsLoading(true);
      Promise.all([
        api.get("/staff/agro/reports/sales"),
        api.get("/staff/agro/reports/revenue"),
      ])
        .then(([salesRes, revRes]) => {
          // Real shape: { summary, monthly_revenue, top_products, top_sellers }
          setSalesReport(salesRes.data?.data || salesRes.data || null);
          const revData = revRes.data.data || revRes.data;
          setRevenueReport(Array.isArray(revData) ? revData : []);
        })
        .catch(() => {})
        .finally(() => setReportsLoading(false));
    }
    if (activeTab === "sellers") {
      setSellersLoading(true);
      api
        .get("/staff/agro/sellers", {
          params: sellerSearch ? { search: sellerSearch } : {},
        })
        .then((res) => setSellers(res.data?.data || res.data || []))
        .catch(() => showToast("Failed to load sellers."))
        .finally(() => setSellersLoading(false));
    }
    if (activeTab === "remittances") {
      setRemittancesLoading(true);
      api
        .get("/staff/agro/remittance-requests")
        .then((res) => setRemittances(res.data?.data || res.data || []))
        .catch(() => showToast("Failed to load remittance requests."))
        .finally(() => setRemittancesLoading(false));
    }
  }, [activeTab, sellerSearch]);

  // Sidebar red-alert badges — pending products awaiting review + pending
  // remittance requests, mirroring the admin dashboard's badge pattern.
  useEffect(() => {
    api
      .get("/staff/agro/products/pending-review")
      .then((res) => {
        const total =
          res.data?.total ??
          (Array.isArray(res.data) ? res.data.length : res.data?.data?.length) ??
          0;
        setBadges((prev) => ({ ...prev, productApprovals: total }));
      })
      .catch(() => {});

    api
      .get("/staff/agro/remittance-requests")
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const pending = Array.isArray(list)
          ? list.filter((r) => r.status === "pending").length
          : 0;
        setBadges((prev) => ({ ...prev, remittances: pending }));
      })
      .catch(() => {});
  }, []);

  // Orders badge reuses the same /staff/agro/dashboard response already
  // fetched into `stats` above — no extra request needed.
  useEffect(() => {
    if (!stats) return;
    setBadges((prev) => ({ ...prev, orders: stats.orders?.pending ?? 0 }));
  }, [stats]);

  // Complaints/Notifications badges — same source StaffLayout uses on the
  // Complaints/Notifications pages, so the count matches wherever staff land.
  useEffect(() => {
    api
      .get("/staff/complaints", { params: { status: "pending" } })
      .then((res) => {
        const total = res.data?.total ?? res.data?.meta?.total
          ?? (Array.isArray(res.data?.data) ? res.data.data.length
          : Array.isArray(res.data) ? res.data.length : 0);
        setBadges((prev) => ({ ...prev, complaints: total }));
      })
      .catch(() => {});

    api
      .get("/inbox/unread-count")
      .then((res) => {
        const n = res.data?.unread_count ?? res.data?.count ?? 0;
        setBadges((prev) => ({ ...prev, notifications: n }));
      })
      .catch(() => {});
  }, []);

  const handleUpdateOrderStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/staff/agro/orders/${orderId}/status`, { status });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
      showToast(`Order status updated to ${status}!`);
    } catch {
      showToast("Failed to update order status.");
    } finally {
      setUpdating(null);
    }
  };

  const handleVerifyPayment = async (orderId, reference) => {
    const ref = reference || window.prompt("Enter Paystack payment reference:");
    if (!ref) return;
    setVerifying(orderId);
    try {
      const res = await api.post(`/admin/orders/${orderId}/verify-payment`, {
        reference: ref,
      });
      showToast(res.data?.message || "Payment verified! Order confirmed.");
      const r = await api.get("/staff/agro/orders");
      setOrders(r.data.data || r.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Verification failed.");
    } finally {
      setVerifying(null);
    }
  };

  const handleCollectPayment = async (orderId) => {
    if (
      !window.confirm(
        "Confirm that cash payment has been collected for this order?",
      )
    )
      return;
    setUpdating(orderId);
    try {
      const res = await api.patch(
        `/staff/agro/orders/${orderId}/collect-payment`,
      );
      const updated = res.data?.order || res.data;
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
      );
      showToast(res.data?.message || "Payment marked as collected.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to mark payment as collected.",
      );
    } finally {
      setUpdating(null);
    }
  };
  const getStatusStyle = (status) =>
    ({
      pending: { background: "#fff8e7", color: "#b36b00" },
      processing: { background: "#e7f0ff", color: "#1a4fa0" },
      shipped: { background: "#e7f7ff", color: "#0077aa" },
      delivered: { background: "#eafaf0", color: "#1a7a3a" },
      cancelled: { background: "#fff0f0", color: "#cc0000" },
    })[status] || { background: "#f0f0f0", color: "#555" };

  const toMoney = (val) => `₦${Number(val || 0).toLocaleString()}`;

  const openSellerDetail = async (seller) => {
    setSellerDetail({ ...seller, _loading: true });
    setSellerDetailLoading(true);
    try {
      const res = await api.get(`/staff/agro/sellers/${seller.id}`);
      // Backend shape: { seller: {...}, total_revenue, total_items_sold,
      // total_products, active_products } — the stats are siblings of
      // `seller`, not nested inside it.
      const data = res.data || {};
      setSellerDetail({
        ...(data.seller || {}),
        total_revenue: data.total_revenue,
        total_items_sold: data.total_items_sold,
        total_products: data.total_products,
        active_products: data.active_products,
      });
    } catch {
      showToast("Failed to load seller details.");
      setSellerDetail(null);
    } finally {
      setSellerDetailLoading(false);
    }
  };

  const handleApproveRemittance = async (req) => {
    setRemittanceBusyId(req.id);
    try {
      await api.patch(`/staff/agro/remittance-requests/${req.id}/approve`);
      setRemittances((prev) =>
        prev.map((r) =>
          r.id === req.id ? { ...r, status: "staff_approved" } : r,
        ),
      );
      setBadges((prev) => ({
        ...prev,
        remittances: Math.max((prev.remittances || 1) - 1, 0),
      }));
      showToast(
        "Sent for final approval — admin must confirm payout. Seller balance is unchanged.",
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to send for final approval.",
      );
    } finally {
      setRemittanceBusyId(null);
    }
  };

  const handleRejectRemittance = async (req) => {
    const reason = window.prompt("Reason for declining this remittance request:");
    if (!reason) return;
    setRemittanceBusyId(req.id);
    try {
      await api.patch(`/staff/agro/remittance-requests/${req.id}/reject`, {
        reason,
      });
      setRemittances((prev) =>
        prev.map((r) =>
          r.id === req.id ? { ...r, status: "rejected", rejection_reason: reason } : r,
        ),
      );
      setBadges((prev) => ({
        ...prev,
        remittances: Math.max((prev.remittances || 1) - 1, 0),
      }));
      showToast("Remittance request declined.");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to decline request.");
    } finally {
      setRemittanceBusyId(null);
    }
  };

  const filteredSellers = sellers.filter((sl) =>
    !sellerSearch
      ? true
      : (sl.business_name || "")
          .toLowerCase()
          .includes(sellerSearch.toLowerCase()),
  );

  const filteredOrders = orders.filter((o) => {
    const matchFilter = orderFilter === "all" || o.status === orderFilter;
    const matchSearch =
      !orderSearch ||
      (o.order_number || "")
        .toLowerCase()
        .includes(orderSearch.toLowerCase()) ||
      (o.buyer?.name || "").toLowerCase().includes(orderSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredInventory = inventory.filter(
    (p) =>
      !inventorySearch ||
      p.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.seller?.business_name
        ?.toLowerCase()
        .includes(inventorySearch.toLowerCase()),
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .agro-staff-sidebar {
            width: min(280px, 82vw) !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 2px 0 16px rgba(0,0,0,0.25);
            z-index: 600;
          }
          .agro-staff-sidebar.agro-sidebar-open { transform: translateX(0); }
          .agro-staff-main { margin-left: 0 !important; padding: 16px !important; }
          .agro-staff-hamburger {
            display: flex !important; align-items: center; justify-content: center;
            width: 40px; height: 40px; border-radius: 10px; border: 1px solid #e8e4dc;
            background: #fff; font-size: 18px; cursor: pointer; flex-shrink: 0;
          }
          .agro-sidebar-close { display: block !important; }
          .agro-backdrop-open {
            display: block !important; position: fixed; inset: 0;
            background: rgba(0,0,0,0.45); z-index: 550;
          }
        }
      `}</style>
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {mobileNavOpen && (
        <div className="agro-backdrop-open" style={{ display: "none" }} onClick={() => setMobileNavOpen(false)} />
      )}

      <div className={"agro-staff-sidebar" + (mobileNavOpen ? " agro-sidebar-open" : "")} style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Agro/Sales Staff</div>
          </div>
          <button
            className="agro-sidebar-close"
            style={{ display: "none", marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: "📊", label: "Dashboard", tab: "dashboard" },
            { icon: "📦", label: "Orders", tab: "orders", badgeKey: "orders" },
            { icon: "🌾", label: "Inventory", tab: "inventory" },
            { icon: "🏪", label: "Sellers", tab: "sellers" },
            {
              icon: "✅",
              label: "Product Approvals",
              path: "/staff/agro/product-approvals",
              badgeKey: "productApprovals",
            },
            {
              icon: "💸",
              label: "Remittances",
              tab: "remittances",
              badgeKey: "remittances",
            },
            { icon: "📈", label: "Reports", tab: "reports" },
            { icon: "📋", label: "Complaints", path: "/staff/complaints", badgeKey: "complaints" },
            { icon: "🔔", label: "Notifications", path: "/staff/notifications", badgeKey: "notifications" },
          ].map((item) => (
            <div
              key={item.tab || item.path}
              style={{
                ...s.sidebarItem,
                ...(activeTab === item.tab ? s.sidebarItemActive : {}),
              }}
              onClick={() => {
                item.path ? navigate(item.path) : setActiveTab(item.tab);
                setMobileNavOpen(false);
              }}
            >
              <span>{item.icon}</span> {item.label}
              {item.badgeKey && badges[item.badgeKey] > 0 && (
                <span style={s.navBadge}>{badges[item.badgeKey]}</span>
              )}
            </div>
          ))}

          {/* Combined dashboard: staff with both can_manage_agro and
              can_manage_loans see the Loan Staff nav here too. Each item
              navigates to the Loan Staff dashboard's own route rather than
              rendering its content inline — the two dashboards remain
              separate pages/components, this just surfaces both nav
              sections together per the combined-dashboard spec. */}
          {(user?.staff_profile?.can_manage_loans || user?.can_manage_loans) && (
            <>
              <div style={s.navSectionLabel}>Loan Staff</div>
              {[
                { icon: "📊", label: "Loan Dashboard", path: "/staff/loans" },
                {
                  icon: "📄",
                  label: "Applications",
                  path: "/staff/loans?tab=applications",
                },
                {
                  icon: "💳",
                  label: "Repayments",
                  path: "/staff/loans?tab=repayments",
                },
              ].map((item) => (
                <div
                  key={item.path}
                  style={s.sidebarItem}
                  onClick={() => {
                    navigate(item.path);
                    setMobileNavOpen(false);
                  }}
                >
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </>
          )}
        </nav>
        {user?.role === "admin" && (
          <button
            style={s.backAdminBtn}
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Admin Panel
          </button>
        )}
        <div style={s.sidebarFooter}>
          <div style={s.staffName}>{user?.name}</div>
          <div style={s.staffRole}>Agro/Sales Staff</div>
          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="agro-staff-main" style={s.main}>
        <button
          className="agro-staff-hamburger"
          style={{ display: "none", marginBottom: 16 }}
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <h1 style={s.pageTitle}>Agro/Sales Dashboard</h1>
            <p style={s.pageSub}>
              Welcome back, {user?.name?.split(" ")[0]}. Here's today's
              overview.
            </p>
            {stats ? (
              <>
                <div style={s.statsGrid}>
                  {[
                    {
                      label: "Total Orders",
                      value: stats.orders?.total || 0,
                      icon: "📦",
                      color: "#1f4d1f",
                    },
                    {
                      label: "Pending Orders",
                      value: stats.orders?.pending || 0,
                      icon: "⏳",
                      color: "#b36b00",
                    },
                    {
                      label: "Processing",
                      value: stats.orders?.processing || 0,
                      icon: "⚙️",
                      color: "#1a4fa0",
                    },
                    {
                      label: "Delivered",
                      value: stats.orders?.delivered || 0,
                      icon: "✅",
                      color: "#1a7a3a",
                    },
                    {
                      label: "Total Products",
                      value: stats.inventory?.total_products || 0,
                      icon: "🌾",
                      color: "#c8860a",
                    },
                    {
                      label: "Low Stock",
                      value: stats.inventory?.low_stock || 0,
                      icon: "⚠️",
                      color: "#cc0000",
                    },
                    {
                      label: "Out of Stock",
                      value: stats.inventory?.out_of_stock || 0,
                      icon: "❌",
                      color: "#cc0000",
                    },
                    {
                      label: "Today's Revenue",
                      value: `₦${Number(stats.revenue?.today || 0).toLocaleString()}`,
                      icon: "💵",
                      color: "#1f4d1f",
                    },
                    {
                      label: "Total Revenue",
                      value: `₦${Number(stats.revenue?.total || 0).toLocaleString()}`,
                      icon: "💰",
                      color: "#1a7a3a",
                    },
                  ].map((stat) => (
                    <div key={stat.label} style={s.statCard}>
                      <div style={s.statTop}>
                        <div style={s.statLabel}>{stat.label}</div>
                        <div style={s.statIcon}>{stat.icon}</div>
                      </div>
                      <div style={{ ...s.statValue, color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
                {stats.low_stock_count > 0 && (
                  <div style={s.alertBox}>
                    <div style={s.alertTitle}>⚠️ Low Stock Alert</div>
                    <div style={s.alertText}>
                      {stats.low_stock_count} product
                      {stats.low_stock_count !== 1 ? "s are" : " is"} running
                      low.
                      <span
                        style={s.alertLink}
                        onClick={() => setActiveTab("inventory")}
                      >
                        {" "}
                        View Inventory
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={s.loading}>Loading dashboard...</p>
            )}
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div>
            <h1 style={s.pageTitle}>Order Management</h1>
            <div style={s.controlsRow}>
              <div style={s.filterTabs}>
                {[
                  "all",
                  "pending",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((tab) => (
                  <button
                    key={tab}
                    style={
                      orderFilter === tab ? s.filterTabActive : s.filterTab
                    }
                    onClick={() => setOrderFilter(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab !== "all" &&
                      orders.filter((o) => o.status === tab).length > 0 && (
                        <span style={s.tabCount}>
                          {orders.filter((o) => o.status === tab).length}
                        </span>
                      )}
                  </button>
                ))}
              </div>
              <input
                style={s.searchInput}
                type="text"
                placeholder="Search order or buyer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            {ordersLoading && <p style={s.loading}>Loading orders...</p>}

            {filteredOrders.map((order) => {
              const isUnpaid =
                order.status === "pending" && order.payment_status === "unpaid";
              return (
                <div
                  key={order.id}
                  style={{
                    ...s.orderCard,
                    ...(isUnpaid ? s.orderCardUnpaid : {}),
                  }}
                >
                  <div style={s.orderHeader}>
                    <div>
                      <div style={s.orderId}>
                        {order.order_number || `Order #${order.id}`}
                      </div>
                      <div style={s.orderMeta}>
                        {order.buyer?.name} — {order.delivery_address},{" "}
                        {order.delivery_state}
                        {" · "}
                        {new Date(order.created_at).toLocaleDateString(
                          "en-NG",
                          { year: "numeric", month: "short", day: "numeric" },
                        )}
                      </div>
                    </div>
                    <div style={s.orderRight}>
                      <div
                        style={{
                          ...s.statusBadge,
                          ...getStatusStyle(order.status),
                        }}
                      >
                        {order.status}
                      </div>
                      <div
                        style={{
                          ...s.paymentBadge,
                          background:
                            order.payment_status === "paid"
                              ? "#eafaf0"
                              : "#fff0f0",
                          color:
                            order.payment_status === "paid"
                              ? "#1a7a3a"
                              : "#cc0000",
                        }}
                      >
                        {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </div>
                      <div style={s.orderTotal}>
                        {toMoney(order.total_amount || order.total)}
                      </div>
                    </div>
                  </div>

                  {isUnpaid && (
                    <div style={s.unpaidBanner}>
                      <div style={s.unpaidBannerText}>
                        Payment not verified — buyer may have paid via Paystack
                      </div>
                      <button
                        style={
                          verifying === order.id
                            ? s.verifyBtnDisabled
                            : s.verifyBtn
                        }
                        onClick={() =>
                          handleVerifyPayment(order.id, order.payment_reference)
                        }
                        disabled={verifying === order.id}
                      >
                        {verifying === order.id
                          ? "Verifying..."
                          : "Verify Payment"}
                      </button>
                    </div>
                  )}

                  {order.items?.length > 0 && (
                    <div style={s.orderItems}>
                      {order.items.map((item, i) => (
                        <div key={i} style={s.orderItem}>
                          <span style={s.itemName}>
                            {item.product_name || item.product?.name}
                          </span>
                          <span style={s.itemQty}>×{item.quantity}</span>
                          <span style={s.itemPrice}>
                            {toMoney(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={s.actionRow}>
                    {order.status === "pending" &&
                      order.payment_status === "paid" && (
                        <button
                          style={
                            updating === order.id
                              ? s.actionBtnDisabled
                              : s.actionBtn
                          }
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, "processing")
                          }
                          disabled={updating === order.id}
                        >
                          {updating === order.id
                            ? "Updating..."
                            : "Mark as Processing"}
                        </button>
                      )}
                    {order.status === "processing" && (
                      <button
                        style={
                          updating === order.id
                            ? s.actionBtnDisabled
                            : s.actionBtn
                        }
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "shipped")
                        }
                        disabled={updating === order.id}
                      >
                        {updating === order.id
                          ? "Updating..."
                          : "Mark as Shipped"}
                      </button>
                    )}
                    {order.payment_method === "pay_on_delivery" &&
                      order.payment_status === "pod_pending" && (
                        <button
                          style={
                            updating === order.id
                              ? s.actionBtnDisabled
                              : s.actionBtn
                          }
                          onClick={() => handleCollectPayment(order.id)}
                          disabled={updating === order.id}
                        >
                          {updating === order.id
                            ? "Updating..."
                            : "Mark Payment Collected"}
                        </button>
                      )}
                    {order.status === "shipped" && (
                      <div style={s.shippedNote}>
                        Waiting for buyer to confirm delivery
                      </div>
                    )}
                    {order.status === "delivered" && (
                      <div style={s.deliveredNote}>
                        Order delivered and completed
                      </div>
                    )}
                    {(order.status === "pending" ||
                      order.status === "processing") && (
                      <button
                        style={
                          updating === order.id
                            ? s.cancelBtnDisabled
                            : s.cancelBtn
                        }
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "cancelled")
                        }
                        disabled={updating === order.id}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!ordersLoading && filteredOrders.length === 0 && (
              <div style={s.empty}>
                No {orderFilter === "all" ? "" : orderFilter} orders found.
              </div>
            )}
          </div>
        )}

        {/* Inventory */}
        {activeTab === "inventory" && (
          <div>
            <h1 style={s.pageTitle}>Inventory Management</h1>

            <input
              style={{
                ...s.searchInput,
                width: "100%",
                maxWidth: 400,
                marginBottom: 16,
              }}
              type="text"
              placeholder="Search product, category or seller..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
            />

            {lowStock.length > 0 && (
              <div style={s.alertBox}>
                <div style={s.alertTitle}>
                  ⚠️ Low Stock Products ({lowStock.length})
                </div>
                <div style={s.lowStockGrid}>
                  {lowStock.map((p) => (
                    <div key={p.id} style={s.lowStockItem}>
                      <div style={s.lowStockName}>{p.name}</div>
                      <div style={s.lowStockQty}>
                        {p.quantity} {p.unit} left
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventoryLoading && <p style={s.loading}>Loading inventory...</p>}

            <div style={s.tableCard}>
              <table style={s.table}>
                <thead>
                  <tr style={s.tableHead}>
                    <th style={s.th}>Product</th>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Price</th>
                    <th style={s.th}>Stock</th>
                    <th style={s.th}>Sold</th>
                    <th style={s.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((p) => (
                    <tr key={p.id} style={s.tableRow}>
                      <td style={s.td}>
                        <div style={s.productName}>{p.name}</div>
                        <div style={s.productSeller}>
                          {p.seller?.business_name}
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.categoryBadge}>{p.category}</span>
                      </td>
                      <td style={s.td}>{toMoney(p.price)}</td>
                      <td style={s.td}>
                        <div
                          style={{
                            fontWeight: 600,
                            color:
                              p.quantity === 0
                                ? "#cc0000"
                                : p.quantity < 10
                                  ? "#b36b00"
                                  : "#1a7a3a",
                          }}
                        >
                          {p.quantity} {p.unit}
                        </div>
                      </td>
                      <td style={s.td}>
                        {p.items_sold || p.reviews_count || 0}
                      </td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.statusBadge,
                            background:
                              p.status === "available" ? "#eafaf0" : "#fff0f0",
                            color:
                              p.status === "available" ? "#1a7a3a" : "#cc0000",
                          }}
                        >
                          {p.status?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && !inventoryLoading && (
                <div style={s.empty}>No products found.</div>
              )}
            </div>
          </div>
        )}

        {/* Sellers — full list, same access as admin */}
        {activeTab === "sellers" && (
          <div>
            <h1 style={s.pageTitle}>Sellers</h1>
            <p style={s.pageSub}>
              Full seller list with revenue and product stats.
            </p>
            <input
              style={s.searchInput}
              placeholder="Search sellers by business name..."
              value={sellerSearch}
              onChange={(e) => setSellerSearch(e.target.value)}
            />
            {sellersLoading ? (
              <p style={s.loading}>Loading sellers...</p>
            ) : filteredSellers.length === 0 ? (
              <div style={s.empty}>No sellers found.</div>
            ) : (
              <div style={s.tableCard}>
                <table style={s.table}>
                  <thead style={s.tableHead}>
                    <tr>
                      <th style={s.th}>Business Name</th>
                      <th style={s.th}>State</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map((sl) => (
                      <tr
                        key={sl.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => openSellerDetail(sl)}
                      >
                        <td style={s.td}>{sl.business_name}</td>
                        <td style={s.td}>{sl.state || "—"}</td>
                        <td style={s.td}>
                          <span
                            style={{
                              ...s.statusBadge,
                              ...getStatusStyle(sl.status),
                            }}
                          >
                            {sl.status}
                          </span>
                        </td>
                        <td style={s.td}>
                          {sl.rating ? Number(sl.rating).toFixed(1) : "—"} ★
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Remittances — two-tier flow: agro staff can only pre-approve or
            reject, never move money. Admin finalizes the actual payout. */}
        {activeTab === "remittances" && (
          <div>
            <h1 style={s.pageTitle}>Remittance Requests</h1>
            <p style={s.pageSub}>
              You can pre-approve or decline requests here — admin still has
              to finalize the payout before money actually moves.
            </p>
            {remittancesLoading ? (
              <p style={s.loading}>Loading remittance requests...</p>
            ) : remittances.length === 0 ? (
              <div style={s.empty}>No remittance requests.</div>
            ) : (
              <div style={s.reportsGrid}>
                {remittances.map((r) => (
                  <div key={r.id} style={s.reportCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={s.reportName}>
                          {r.seller?.business_name || "Seller"}
                        </div>
                        <div style={s.reportMeta}>
                          Requested {toMoney(r.amount)}
                        </div>
                      </div>
                      <span
                        style={{
                          ...s.statusBadge,
                          ...(r.status === "pending"
                            ? { background: "#fff8e7", color: "#b36b00" }
                            : r.status === "staff_approved"
                              ? { background: "#e7f0ff", color: "#1a4fa0" }
                              : r.status === "rejected"
                                ? { background: "#fff0f0", color: "#cc0000" }
                                : { background: "#eafaf0", color: "#1a7a3a" }),
                        }}
                      >
                        {r.status === "staff_approved"
                          ? "Awaiting admin"
                          : r.status?.replace("_", " ")}
                      </span>
                    </div>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          style={s.approveBtn}
                          disabled={remittanceBusyId === r.id}
                          onClick={() => handleApproveRemittance(r)}
                        >
                          {remittanceBusyId === r.id
                            ? "Working..."
                            : "Send for Final Approval"}
                        </button>
                        <button
                          style={s.rejectBtn}
                          disabled={remittanceBusyId === r.id}
                          onClick={() => handleRejectRemittance(r)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div>
            <h1 style={s.pageTitle}>Sales Reports</h1>
            {reportsLoading && <p style={s.loading}>Loading reports...</p>}

            {salesReport?.summary && (
              <div style={s.statsGrid}>
                <div style={s.statCard}>
                  <div style={s.statValue}>
                    {toMoney(salesReport.summary.total_revenue)}
                  </div>
                  <div style={s.statLabel}>Total Revenue</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statValue}>
                    {salesReport.summary.total_orders ?? "—"}
                  </div>
                  <div style={s.statLabel}>Total Orders</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statValue}>
                    {salesReport.summary.total_products ?? "—"}
                  </div>
                  <div style={s.statLabel}>Total Products</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statValue}>
                    {salesReport.summary.total_sellers ?? "—"}
                  </div>
                  <div style={s.statLabel}>Active Sellers</div>
                </div>
              </div>
            )}

            <div style={s.reportsGrid}>
              <div style={s.reportCard}>
                <h2 style={s.reportTitle}>Top Selling Products</h2>
                {!salesReport?.top_products?.length ? (
                  <p style={s.empty}>No sales data yet.</p>
                ) : (
                  salesReport.top_products.map((p, i) => (
                    <div key={p.product_id || i} style={s.reportRow}>
                      <div style={s.reportRank}>#{i + 1}</div>
                      <div style={s.reportInfo}>
                        <div style={s.reportName}>{p.product_name}</div>
                        <div style={s.reportMeta}>
                          {p.category} · {p.total_quantity || 0} sold
                        </div>
                      </div>
                      <div style={s.reportValue}>
                        {toMoney(p.total_revenue)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={s.reportCard}>
                <h2 style={s.reportTitle}>Top Sellers</h2>
                {!salesReport?.top_sellers?.length ? (
                  <p style={s.empty}>No seller sales data yet.</p>
                ) : (
                  salesReport.top_sellers.map((sl, i) => (
                    <div key={sl.seller_id || i} style={s.reportRow}>
                      <div style={s.reportRank}>#{i + 1}</div>
                      <div style={s.reportInfo}>
                        <div style={s.reportName}>{sl.business_name}</div>
                        <div style={s.reportMeta}>
                          {sl.state} · {sl.order_count || 0} orders
                        </div>
                      </div>
                      <div style={s.reportValue}>
                        {toMoney(sl.total_revenue)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={s.reportCard}>
                <h2 style={s.reportTitle}>Monthly Revenue</h2>
                {(() => {
                  // Prefer monthly_revenue from the new sales-report shape;
                  // fall back to the separate /reports/revenue endpoint.
                  const monthly =
                    salesReport?.monthly_revenue?.length
                      ? salesReport.monthly_revenue
                      : revenueReport;
                  if (!monthly?.length)
                    return <p style={s.empty}>No revenue data yet.</p>;
                  const maxRev = Math.max(
                    ...monthly.map((x) => Number(x.revenue || x.total || 0)),
                  );
                  return monthly.map((r, i) => {
                    const pct =
                      maxRev > 0
                        ? (Number(r.revenue || r.total || 0) / maxRev) * 100
                        : 0;
                    return (
                      <div key={i} style={s.revenueRow}>
                        <div style={s.revenueMonth}>
                          {r.month_name || r.month || r.label}
                        </div>
                        <div style={s.revenueBarBg}>
                          <div
                            style={{ ...s.revenueBarFill, width: `${pct}%` }}
                          />
                        </div>
                        <div style={s.revenueVal}>
                          {toMoney(r.revenue || r.total)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {sellerDetail && (
      <div style={s.sellerModalOverlay} onClick={() => setSellerDetail(null)}>
        <div style={s.sellerModalBox} onClick={(e) => e.stopPropagation()}>
          <button
            style={s.sellerModalClose}
            onClick={() => setSellerDetail(null)}
          >
            ✕
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>
            {sellerDetail.business_name}
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
            {sellerDetail.state || "—"} ·{" "}
            <span style={{ textTransform: "capitalize" }}>
              {sellerDetail.status}
            </span>
          </p>

          {sellerDetailLoading ? (
            <p style={s.loading}>Loading seller details...</p>
          ) : (
            <>
              <div style={s.sellerModalStatsRow}>
                <div style={s.sellerModalStat}>
                  <div style={s.sellerModalStatVal}>
                    {toMoney(sellerDetail.total_revenue)}
                  </div>
                  <div style={s.sellerModalStatLabel}>Total Revenue</div>
                </div>
                <div style={s.sellerModalStat}>
                  <div style={s.sellerModalStatVal}>
                    {sellerDetail.total_items_sold ?? "—"}
                  </div>
                  <div style={s.sellerModalStatLabel}>Items Sold</div>
                </div>
                <div style={s.sellerModalStat}>
                  <div style={s.sellerModalStatVal}>
                    {sellerDetail.active_products ?? "—"}/
                    {sellerDetail.total_products ?? "—"}
                  </div>
                  <div style={s.sellerModalStatLabel}>Active Products</div>
                </div>
              </div>

              {sellerDetail.description && (
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  {sellerDetail.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#1f4d1f",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 14,
    zIndex: 999,
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
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  staffName: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 },
  staffRole: { fontSize: 11, color: "#a8d5a8", marginBottom: 10 },
  logoutBtn: {
    width: "100%",
    padding: 8,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 6 },
  pageSub: { fontSize: 14, color: "#888", marginBottom: 24 },
  loading: { textAlign: "center", color: "#888", padding: 40 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 18,
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: { fontSize: 12, color: "#888" },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: 700 },
  alertBox: {
    background: "#fff8e7",
    border: "1px solid #f0c050",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#b36b00",
    marginBottom: 6,
  },
  alertText: { fontSize: 13, color: "#7a5c00" },
  alertLink: {
    color: "#1f4d1f",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
    flexWrap: "wrap",
  },
  filterTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterTab: {
    padding: "8px 14px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    color: "#555",
    cursor: "pointer",
    background: "#fff",
    fontFamily: "inherit",
  },
  filterTabActive: {
    padding: "8px 14px",
    border: "1px solid #1f4d1f",
    borderRadius: 6,
    fontSize: 13,
    color: "#fff",
    cursor: "pointer",
    background: "#1f4d1f",
    fontFamily: "inherit",
  },
  tabCount: {
    marginLeft: 5,
    background: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: 700,
    padding: "1px 5px",
    borderRadius: 99,
  },
  searchInput: {
    padding: "9px 16px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    minWidth: 220,
  },
  orderCard: {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8e4dc",
    padding: 20,
    marginBottom: 14,
  },
  orderCardUnpaid: { border: "1px solid #ffa39e" },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  orderId: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 },
  orderMeta: { fontSize: 13, color: "#888" },
  orderRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  orderTotal: { fontSize: 15, fontWeight: 700, color: "#1f4d1f" },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
    textTransform: "capitalize",
  },
  paymentBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 99,
  },
  unpaidBanner: {
    background: "#fff8e7",
    border: "1px solid #f0c050",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  unpaidBannerText: { fontSize: 13, color: "#b36b00", flex: 1 },
  verifyBtn: {
    padding: "7px 16px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  verifyBtnDisabled: {
    padding: "7px 16px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  orderItems: {
    borderTop: "1px solid #eee",
    padding: "10px 0",
    marginBottom: 10,
  },
  orderItem: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 6,
  },
  itemName: { flex: 1, fontSize: 13, color: "#333" },
  itemQty: { fontSize: 12, color: "#888" },
  itemPrice: { fontSize: 13, fontWeight: 600, color: "#1f4d1f" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    padding: "8px 18px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  actionBtnDisabled: {
    padding: "8px 18px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  cancelBtn: {
    padding: "8px 18px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #cc0000",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cancelBtnDisabled: {
    padding: "8px 18px",
    background: "#fff",
    color: "#ccc",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 13,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },
  shippedNote: {
    background: "#e7f0ff",
    color: "#1a4fa0",
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 13,
  },
  deliveredNote: {
    background: "#eafaf0",
    color: "#1a7a3a",
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 13,
  },
  empty: { textAlign: "center", color: "#888", padding: 40 },
  lowStockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
    marginTop: 10,
  },
  lowStockItem: {
    background: "#fff",
    borderRadius: 6,
    padding: "10px 12px",
    border: "1px solid #f0c050",
  },
  lowStockName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#111",
    marginBottom: 4,
  },
  lowStockQty: { fontSize: 11, color: "#cc0000", fontWeight: 600 },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    overflowX: "auto",
    border: "1px solid #e8e4dc",
  },
  table: { width: "100%", minWidth: 640, borderCollapse: "collapse" },
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
  productName: { fontSize: 13, fontWeight: 600, color: "#111" },
  productSeller: { fontSize: 11, color: "#888", marginTop: 2 },
  categoryBadge: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  reportsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  reportCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    padding: 24,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
    marginBottom: 16,
  },
  reportRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  reportRank: { fontSize: 11, fontWeight: 700, color: "#c8860a", width: 24 },
  reportInfo: { flex: 1 },
  reportName: { fontSize: 13, fontWeight: 600, color: "#111" },
  reportMeta: { fontSize: 11, color: "#888", marginTop: 2 },
  reportValue: { fontSize: 13, fontWeight: 700, color: "#1f4d1f" },
  revenueRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  revenueMonth: { fontSize: 12, color: "#555", width: 40 },
  revenueBarBg: {
    flex: 1,
    height: 8,
    background: "#eee",
    borderRadius: 99,
    overflow: "hidden",
  },
  revenueBarFill: { height: "100%", background: "#1f4d1f", borderRadius: 99 },
  revenueVal: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1f4d1f",
    width: 80,
    textAlign: "right",
  },
  backAdminBtn: {
    width: "100%",
    padding: 8,
    background: "#f0c050",
    color: "#1a3d1a",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 10,
  },
  navBadge: {
    marginLeft: "auto",
    background: "#cc0000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 99,
  },
  navSectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#7ca87c",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "16px 20px 6px",
  },
  approveBtn: {
    padding: "9px 16px",
    background: "#1f4d1f",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  rejectBtn: {
    padding: "9px 16px",
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #ffcccc",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  sellerModalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  sellerModalBox: {
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    width: "100%",
    maxWidth: 520,
    maxHeight: "85vh",
    overflowY: "auto",
  },
  sellerModalClose: {
    float: "right",
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#888",
  },
  sellerModalStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    margin: "16px 0",
  },
  sellerModalStat: {
    background: "#f7f5f0",
    borderRadius: 10,
    padding: "12px 10px",
    textAlign: "center",
  },
  sellerModalStatVal: { fontSize: 17, fontWeight: 800, color: "#111" },
  sellerModalStatLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
};
