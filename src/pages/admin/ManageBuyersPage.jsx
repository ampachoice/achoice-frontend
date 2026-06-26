import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = '/achoice logo.png';

export default function ManageBuyersPage() {
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [acting, setActing] = useState(null);

  const [restrictModal, setRestrictModal] = useState(null);
  const [restrictForm, setRestrictForm] = useState({
    restrict_orders: false,
    restrict_loans: false,
    reason: '',
  });
  const [restrictSubmitting, setRestrictSubmitting] = useState(false);

  const [expandedBuyer, setExpandedBuyer] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchBuyers = (pageNum = 1) => {
    setLoading(true);
    api.get('/admin/users', {
      params: {
        page: pageNum,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: search || undefined,
      },
    })
      .then((res) => {
        const pData = res.data;
        const data = pData?.data || pData || [];
        setBuyers(Array.isArray(data) ? data : []);
        if (pData?.meta || pData?.last_page) setMeta(pData.meta || pData);
        setPage(pData?.current_page || pageNum);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBuyers(1);
  }, [filterStatus, search]);

  const goToPage = (pageNum) => {
    fetchBuyers(pageNum);
  };

  const handleViewDetails = async (buyerId) => {
    if (expandedBuyer === buyerId) {
      setExpandedBuyer(null);
      return;
    }
    setExpandedBuyer(buyerId);
    if (detailMap[buyerId]) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${buyerId}`);
      setDetailMap((prev) => ({ ...prev, [buyerId]: res.data }));
    } catch {
      setDetailMap((prev) => ({ ...prev, [buyerId]: { error: true } }));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBan = async (buyer) => {
    if (!window.confirm(`Permanently ban ${buyer.name}? This will revoke all their active sessions immediately.`)) return;
    setActing(buyer.id);
    try {
      const res = await api.patch(`/admin/users/${buyer.id}/ban`);
      const updated = res.data?.user || res.data;
      setBuyers((prev) => prev.map((b) => (b.id === buyer.id ? { ...b, ...updated } : b)));
      showToast(res.data?.message || 'Buyer banned.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to ban buyer.');
    } finally {
      setActing(null);
    }
  };

  const handleActivate = async (buyer) => {
    if (!window.confirm(`Lift all restrictions on ${buyer.name} and restore active status?`)) return;
    setActing(buyer.id);
    try {
      const res = await api.patch(`/admin/users/${buyer.id}/activate`);
      const updated = res.data?.user || res.data;
      setBuyers((prev) => prev.map((b) => (b.id === buyer.id ? { ...b, ...updated } : b)));
      showToast(res.data?.message || 'Buyer activated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to activate buyer.');
    } finally {
      setActing(null);
    }
  };

  const openRestrictModal = (buyer) => {
    setRestrictModal(buyer);
    setRestrictForm({
      restrict_orders: !!buyer.restrict_orders,
      restrict_loans: !!buyer.restrict_loans,
      reason: buyer.restrict_reason || '',
    });
  };

  const handleRestrictSubmit = async (e) => {
    e.preventDefault();
    setRestrictSubmitting(true);
    try {
      const res = await api.patch(`/admin/users/${restrictModal.id}/restrict`, restrictForm);
      const updated = res.data?.user || res.data;
      setBuyers((prev) => prev.map((b) => (b.id === restrictModal.id ? { ...b, ...updated } : b)));
      showToast(res.data?.message || 'Restrictions updated.');
      setRestrictModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update restrictions.');
    } finally {
      setRestrictSubmitting(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '--EMDASH--';
  const toMoney = (val) =>
    val != null && !isNaN(Number(val)) ? `--NAIRA--${Number(val).toLocaleString()}` : '--EMDASH--';

  const getStatusStyle = (status) => ({
    active:    { background: '#eafaf0', color: '#1a7a3a' },
    suspended: { background: '#fff8e7', color: '#b36b00' },
    banned:    { background: '#fff0f0', color: '#cc0000' },
  }[status] || { background: '#f0f0f0', color: '#555' });

  return (
test1
test2
test3
