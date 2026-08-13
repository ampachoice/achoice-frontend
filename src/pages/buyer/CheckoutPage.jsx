import { NIGERIA_LGAS } from "../../data/nigeriaLgas";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrder } from "../../services/orderService";
import api from "../../services/api";
import axios from "axios";
import NotificationBell from "../../components/buyer/NotificationBell";
import MobileNavDrawer from "../../components/buyer/MobileNavDrawer";
import { getAddresses, createAddress } from "../../services/addressService";
import AddressFormFields, { emptyAddressForm } from "../../components/buyer/AddressFormFields";

const NIGERIAN_STATES_FALLBACK = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    delivery_address: "",
    delivery_state: "",
    delivery_lga: "",
    note: "",
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [showSummary, setShowSummary] = useState(false); // mobile toggle
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [flashSaleMap, setFlashSaleMap] = useState({});
  const [freeDeliveryAvailable, setFreeDeliveryAvailable] = useState(false);
  const [freeDeliveryEligible, setFreeDeliveryEligible] = useState(false);
  const [freeDeliveryLabel, setFreeDeliveryLabel] = useState('');
  const [useFreeDelivery, setUseFreeDelivery] = useState(false);

  // Address Book — Phase 3. selectedAddressId is null when the buyer is
  // entering an address manually (either because they have no saved
  // addresses, or explicitly chose "enter a different address"). When
  // an address is selected, formData.delivery_* is kept in sync from it
  // purely so the existing delivery-fee lookup effect (keyed on
  // formData.delivery_state) keeps working unchanged.
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState(emptyAddressForm());
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  useEffect(() => {
    if (document.getElementById("ckp-style")) return;
    const el = document.createElement("style");
    el.id = "ckp-style";
    el.textContent = `
      body { margin:0; }
      .ckp-wrap { min-height:100vh; background:#f7f5f0; font-family:Arial,sans-serif; }

      /* ── NAV ── */
      .ckp-nav { background:#1f4d1f; padding:10px 40px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; gap:12px; }
      .ckp-nav-left { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
      .ckp-nav-logo { width:36px; height:36px; border-radius:6px; }
      .ckp-nav-name  { font-weight:700; font-size:17px; color:#fff; line-height:1.2; }
      .ckp-nav-name span { color:#f0c050; }
      .ckp-nav-motto { font-size:9px; color:#a8d5a8; }
      .ckp-nav-back  { color:#f0c050; font-size:14px; cursor:pointer; font-weight:700; white-space:nowrap; flex-shrink:0; }

      /* ── CONTAINER ── */
      .ckp-container { max-width:1100px; margin:0 auto; padding:36px 40px; }
      .ckp-title { font-size:26px; font-weight:700; color:#1f4d1f; margin:0 0 8px; }
      .ckp-subtitle { font-size:13px; color:#888; margin:0 0 28px; }
      .ckp-error { background:#fff0f0; color:#cc0000; padding:12px 16px; border-radius:8px; margin-bottom:22px; font-size:14px; border:1px solid #ffb3b3; }

      /* ── LAYOUT ── */
      .ckp-layout { display:grid; grid-template-columns:1fr 360px; gap:28px; align-items:start; }

      /* ── FORM CARD ── */
      .ckp-card { background:#fff; border-radius:14px; border:1px solid #e8e4dc; padding:28px; }
      .ckp-card-title { font-size:18px; font-weight:700; color:#1f4d1f; margin:0 0 22px; display:flex; align-items:center; gap:8px; }
      .ckp-field { margin-bottom:20px; }
      .ckp-label { display:block; font-size:13px; color:#444; font-weight:600; margin-bottom:7px; }
      .ckp-input { width:100%; padding:13px 14px; border:1.5px solid #ddd; border-radius:10px; font-size:14px; box-sizing:border-box; outline:none; font-family:inherit; transition:border .2s; }
      .ckp-input:focus { border-color:#1f4d1f; }
      .ckp-textarea { width:100%; padding:13px 14px; border:1.5px solid #ddd; border-radius:10px; font-size:14px; box-sizing:border-box; resize:vertical; font-family:inherit; outline:none; transition:border .2s; }
      .ckp-textarea:focus { border-color:#1f4d1f; }
      .ckp-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; } .ckp-payment-cards { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:6px; } .ckp-payment-card { border:1.5px solid #ddd; border-radius:10px; padding:16px; cursor:pointer; transition:border .2s, background .2s; } .ckp-payment-card-active { border-color:#1f4d1f; background:#f0f7ec; } .ckp-payment-card-title { font-size:14px; font-weight:700; color:#111; margin-bottom:4px; } .ckp-payment-card-desc { font-size:12px; color:#888; }
      .ckp-address-list { display:flex; flex-direction:column; gap:10px; }
      .ckp-address-card { border:1.5px solid #ddd; border-radius:10px; padding:14px 16px; cursor:pointer; transition:border .2s, background .2s; }
      .ckp-address-card-active { border-color:#1f4d1f; background:#f0f7ec; }
      .ckp-address-link { font-size:12px; color:#1f4d1f; font-weight:600; cursor:pointer; text-decoration:underline; }
      .ckp-delivery-hint { font-size:12px; color:#888; margin-top:6px; }
      .ckp-delivery-box { margin-top:8px; background:#fff8e7; border:1px solid #f0c050; border-radius:8px; padding:10px 14px; font-size:13px; color:#7a5c00; }
      .ckp-delivery-box-free { margin-top:8px; background:#f0fff4; border:1px solid #a8d5a8; border-radius:8px; padding:10px 14px; font-size:13px; color:#1f4d1f; }
      .ckp-delivery-days { color:#888; font-size:12px; }
      .ckp-btn { width:100%; padding:16px; background:#1f4d1f; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; margin-top:10px; font-family:inherit; }
      .ckp-btn-dis { width:100%; padding:16px; background:#ccc; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:not-allowed; margin-top:10px; font-family:inherit; }
      .ckp-secure-row { display:flex; align-items:center; justify-content:center; gap:6px; font-size:11px; color:#888; margin-top:12px; }

      /* ── SUMMARY ── */
      .ckp-summary { background:#fff; border-radius:14px; border:1px solid #e8e4dc; padding:24px; position:sticky; top:80px; }
      .ckp-summary-title { font-size:18px; font-weight:700; color:#1f4d1f; margin:0 0 18px; }
      .ckp-item-list { max-height:260px; overflow-y:auto; margin-bottom:14px; }
      .ckp-item-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f5f5f5; gap:8px; }
      .ckp-item-left { display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
      .ckp-item-name  { font-size:13px; color:#333; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .ckp-item-qty   { font-size:11px; color:#1f4d1f; font-weight:700; background:#f0f7ec; padding:2px 7px; border-radius:99px; flex-shrink:0; }
      .ckp-item-price { font-size:13px; font-weight:700; color:#333; flex-shrink:0; }
      .ckp-divider { height:1px; background:#eee; margin:14px 0; }
      .ckp-sub-row { display:flex; justify-content:space-between; margin-bottom:10px; }
      .ckp-sub-label { font-size:14px; color:#888; }
      .ckp-sub-val   { font-size:14px; font-weight:600; color:#333; }
      .ckp-total-row { display:flex; justify-content:space-between; align-items:center; margin:4px 0 18px; }
      .ckp-total-label { font-size:18px; font-weight:700; color:#111; }
      .ckp-total-val   { font-size:26px; font-weight:900; color:#1f4d1f; }
      .ckp-est-delivery { font-size:12px; color:#555; background:#f7f5f0; padding:9px 12px; border-radius:7px; margin-bottom:16px; }
      .ckp-paystack { text-align:center; background:#f9f9f9; padding:14px; border-radius:8px; border:1px solid #eee; }
      .ckp-paystack img { height:20px; margin-bottom:6px; }
      .ckp-paystack p { font-size:11px; color:#888; margin:0; }

      /* ── MOBILE SUMMARY TOGGLE ── */
      .ckp-mobile-summary-toggle { display:none; }
      .ckp-mobile-total-bar      { display:none; }

      /* ── TABLET ── */
      @media (max-width:860px) {
        .ckp-nav { padding:10px 20px; }
        .ckp-container { padding:24px 20px; }
        .ckp-layout { grid-template-columns:1fr; }
        .ckp-summary { position:static; }
      }

      /* ── MOBILE ── */
      @media (max-width:600px) {
        .ckp-nav { padding:8px 14px; }
        .ckp-nav-name { font-size:15px; }
        .ckp-nav-back { font-size:13px; }
        .ckp-container { padding:14px 12px 110px; }
        .ckp-title { font-size:20px; }
        .ckp-card { padding:18px 14px; border-radius:12px; }
        .ckp-card-title { font-size:16px; }
        .ckp-row { grid-template-columns:1fr; gap:0; }
        .ckp-input, .ckp-textarea { font-size:16px; padding:14px 12px; }
        .ckp-btn, .ckp-btn-dis { font-size:16px; padding:16px; border-radius:10px; }

        /* Hide summary on mobile — replaced by toggle + bottom bar */
        .ckp-summary-col { display:none; }

        /* Mobile order summary toggle */
        .ckp-mobile-summary-toggle {
          display:flex; align-items:center; justify-content:space-between;
          background:#fff; border:1px solid #e8e4dc; border-radius:10px;
          padding:14px 16px; margin-bottom:16px; cursor:pointer;
        }
        .ckp-mobile-summary-toggle-left { font-size:14px; font-weight:700; color:#1f4d1f; display:flex; align-items:center; gap:6px; }
        .ckp-mobile-summary-toggle-right { font-size:16px; font-weight:900; color:#1f4d1f; }

        /* Mobile summary panel (shown when toggled) */
        .ckp-mobile-summary-panel { background:#fff; border:1px solid #e8e4dc; border-radius:10px; padding:16px; margin-bottom:16px; }

        /* Sticky bottom pay bar */
        .ckp-mobile-total-bar {
          display:flex; position:fixed; bottom:0; left:0; right:0;
          background:#fff; border-top:2px solid #e8e4dc;
          padding:12px 16px; gap:14px; align-items:center;
          box-shadow:0 -4px 20px rgba(0,0,0,0.1); z-index:200;
        }
        .ckp-mobile-total-bar-left { flex:1; }
        .ckp-mobile-total-bar-label { font-size:11px; color:#888; margin-bottom:1px; }
        .ckp-mobile-total-bar-val   { font-size:20px; font-weight:900; color:#1f4d1f; line-height:1; }
        .ckp-mobile-total-bar-btn {
          padding:14px 22px; background:#1f4d1f; color:#fff; border:none;
          border-radius:9px; font-size:15px; font-weight:700; cursor:pointer;
          font-family:inherit; white-space:nowrap;
        }
        .ckp-mobile-total-bar-btn-dis {
          padding:14px 22px; background:#ccc; color:#fff; border:none;
          border-radius:9px; font-size:15px; cursor:not-allowed; font-family:inherit;
        }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    const params = new URLSearchParams(location.search);
    if (params.get("cancelled") === "true") {
      navigate("/cart?payment=cancelled");
      return;
    }
    if (saved.length === 0) {
      navigate("/products");
      return;
    }
    setCart(saved);

    // Fetch flash sales without auth token so a stale/idle session
    // never silently prevents checkout from showing the correct price.
    axios
      .get(`${process.env.REACT_APP_API_URL}/flash-sales`, {
        headers: { Accept: "application/json" },
      })
      .then((r) => {
        const map = {};
        (r.data?.flash_sales || []).forEach((sale) => {
          if (sale.product?.id) map[sale.product.id] = sale;
        });
        setFlashSaleMap(map);
      })
      .catch(() => {});

    api
      .get("/delivery-zones")
      .then((res) => setDeliveryZones(res.data?.data || res.data || []))
      .catch(() => setDeliveryZones([]));
  }, [navigate]);

  useEffect(() => {
    getAddresses()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setAddresses(list);
        // Backend always sorts default-first, but don't rely on ordering —
        // find it explicitly and auto-select it.
        const def = list.find((a) => a.is_default) || list[0];
        if (def) selectAddress(def);
      })
      .catch(() => setAddresses([]))
      .finally(() => setAddressesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selecting a saved address keeps formData.delivery_* in sync purely so
  // the existing fee-lookup effect (keyed on formData.delivery_state)
  // keeps working without modification.
  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setFormData((prev) => ({
      ...prev,
      delivery_address: addr.full_address,
      delivery_state: addr.state,
      delivery_lga: addr.lga || "",
    }));
  };

  const useManualEntry = () => {
    setSelectedAddressId(null);
    setShowNewAddressForm(false);
    setFormData((prev) => ({ ...prev, delivery_address: "", delivery_state: "", delivery_lga: "" }));
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setSavingNewAddress(true);
    try {
      const res = await createAddress(newAddressForm);
      const created = res.data?.address || res.data;
      setAddresses((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      selectAddress(created);
      setNewAddressForm(emptyAddressForm());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save address.");
    } finally {
      setSavingNewAddress(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const subtotal = cart.reduce(
    (sum, item) => {
      const flash = flashSaleMap[item.id];
      const effectivePrice = flash ? Number(flash.sale_price) : Number(item.price);
      return sum + effectivePrice * item.quantity;
    },
    0,
  );

  useEffect(() => {
    if (!formData.delivery_state) {
      setDeliveryFee(0);
      setDeliveryDays(null);
      setFreeDeliveryAvailable(false);
      setFreeDeliveryEligible(false);
      setFreeDeliveryLabel('');
      setUseFreeDelivery(false);
      return;
    }
    setDeliveryLoading(true);
    api
      .get(`/delivery-zones/${encodeURIComponent(formData.delivery_state)}`, {
        params: { subtotal },
      })
      .then((res) => {
        const zone = res.data?.data || res.data;
        setDeliveryFee(Number(zone?.fee || 0));
        setDeliveryDays(zone?.estimated_days || null);
        setFreeDeliveryAvailable(!!zone?.free_delivery_available);
        setFreeDeliveryEligible(!!zone?.free_delivery_eligible);
        setFreeDeliveryLabel(zone?.free_delivery_label || '');
        // If globally free (threshold met), auto-apply — no opt-in needed
        if (zone?.globally_free) setUseFreeDelivery(true);
        else if (!zone?.free_delivery_eligible) setUseFreeDelivery(false);
      })
      .catch(() => {
        const match = deliveryZones.find(
          (z) => z.state?.toLowerCase() === formData.delivery_state.toLowerCase(),
        );
        setDeliveryFee(Number(match?.fee || 0));
        setDeliveryDays(match?.estimated_days || null);
        setFreeDeliveryAvailable(false);
        setFreeDeliveryEligible(false);
        setUseFreeDelivery(false);
      })
      .finally(() => setDeliveryLoading(false));
  }, [formData.delivery_state, subtotal]);

  const effectiveDeliveryFee = useFreeDelivery && freeDeliveryEligible ? 0 : deliveryFee;
  const grandTotal = subtotal + effectiveDeliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createOrder({
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        // address_id takes priority when a saved address is selected —
        // the old raw string fields are the fallback for manual entry,
        // exactly as before. Both are non-breaking per the Phase 3 spec.
        ...(selectedAddressId
          ? { address_id: selectedAddressId }
          : {
              delivery_address: formData.delivery_address,
              delivery_state: formData.delivery_state,
              delivery_lga: formData.delivery_lga,
            }),
        notes: formData.note,
        use_free_delivery: useFreeDelivery && freeDeliveryEligible,
        payment_method: paymentMethod,
      });
      if (res.data.payment_url) {
        if (res.data.reference)
          localStorage.setItem("last_order_reference", res.data.reference);
        localStorage.removeItem("cart");
        window.location.href = res.data.payment_url;
      } else {
        localStorage.removeItem("cart");
        if (paymentMethod === "pay_on_delivery") localStorage.setItem("pod_order_placed", "true");
        navigate("/orders");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const nigerianStates =
    deliveryZones.length > 0
      ? deliveryZones.map((z) => z.state)
      : NIGERIAN_STATES_FALLBACK;

  const DeliveryFeeInfo = () => {
    if (deliveryLoading)
      return <div className="ckp-delivery-hint">⏳ Fetching delivery fee...</div>;
    if (!formData.delivery_state) return null;

    const isFree = useFreeDelivery && freeDeliveryEligible;

    return (
      <>
        {/* Free delivery opt-in — only shown when zone has it available
            AND the buyer's current subtotal qualifies */}
        {freeDeliveryAvailable && freeDeliveryEligible && (
          <div
            style={{
              marginTop: 8,
              background: '#f0fff4',
              border: '1.5px solid #a8d5a8',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
            onClick={() => setUseFreeDelivery((v) => !v)}
          >
            <input
              type="checkbox"
              id="use-free-delivery"
              checked={useFreeDelivery}
              onChange={() => setUseFreeDelivery((v) => !v)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1f4d1f' }}
            />
            <label htmlFor="use-free-delivery" style={{ fontSize: 13, color: '#1f4d1f', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
              🎉 {freeDeliveryLabel || `Free delivery available for ${formData.delivery_state}`} — tap to use it
            </label>
          </div>
        )}

        {/* Show "not eligible yet" nudge if zone has free delivery but subtotal doesn't qualify */}
        {freeDeliveryAvailable && !freeDeliveryEligible && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
            💡 {freeDeliveryLabel || `Free delivery available for ${formData.delivery_state} — add more items to qualify`}
          </div>
        )}

        {/* Fee display */}
        {isFree ? (
          <div className="ckp-delivery-box-free" style={{ marginTop: 8 }}>
            🎉 Free delivery to <strong>{formData.delivery_state}</strong>!
            {deliveryDays && (
              <span className="ckp-delivery-days">
                {' '}· Est. {deliveryDays} day{deliveryDays > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <div className="ckp-delivery-box" style={{ marginTop: freeDeliveryAvailable ? 6 : 8 }}>
            🚚 Delivery to <strong>{formData.delivery_state}</strong>:{' '}
            <strong>₦{deliveryFee.toLocaleString()}</strong>
            {deliveryDays && (
              <span className="ckp-delivery-days">
                {' '}· Est. {deliveryDays} day{deliveryDays > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </>
    );
  };

  const SummaryContent = () => (
    <>
      <div className="ckp-item-list">
        {cart.map((item) => {
          const flash = flashSaleMap[item.id];
          const effectivePrice = flash ? Number(flash.sale_price) : Number(item.price);
          return (
          <div key={item.id} className="ckp-item-row">
            <div className="ckp-item-left">
              <span className="ckp-item-name">{item.name}</span>
              <span className="ckp-item-qty">×{item.quantity}</span>
            </div>
            <span className="ckp-item-price">
              ₦{(effectivePrice * item.quantity).toLocaleString()}
              {flash && (
                <span style={{ fontSize: 10, color: "#cc0000", marginLeft: 4 }}>⚡</span>
              )}
            </span>
          </div>
        );
        })}
      </div>
      <div className="ckp-divider" />
      <div className="ckp-sub-row">
        <span className="ckp-sub-label">Subtotal</span>
        <span className="ckp-sub-val">₦{subtotal.toLocaleString()}</span>
      </div>
      <div className="ckp-sub-row">
        <span className="ckp-sub-label">
          Delivery{" "}
          {formData.delivery_state ? `(${formData.delivery_state})` : ""}
        </span>
        <span className="ckp-sub-val">
          {deliveryLoading
            ? "..."
            : formData.delivery_state
              ? effectiveDeliveryFee === 0
                ? "Free 🎉"
                : `₦${effectiveDeliveryFee.toLocaleString()}`
              : "— select state"}
        </span>
      </div>
      <div className="ckp-divider" />
      <div className="ckp-total-row">
        <span className="ckp-total-label">Grand Total</span>
        <span className="ckp-total-val">₦{grandTotal.toLocaleString()}</span>
      </div>
      {deliveryDays && formData.delivery_state && (
        <div className="ckp-est-delivery">
          📦 Est. delivery:{" "}
          <strong>
            {deliveryDays} day{deliveryDays > 1 ? "s" : ""}
          </strong>{" "}
          to {formData.delivery_state}
        </div>
      )}
      <div className="ckp-paystack">
        <img
          src="https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-Endorsed.png"
          alt="Secured by Paystack"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ height: '40px' }}
        />
        <p>Your transaction is encrypted and secure.</p>
      </div>
    </>
  );

  return (
    <div className="ckp-wrap">
      {/* Nav */}
      <nav className="ckp-nav">
        <div className="ckp-nav-left" onClick={() => navigate("/products")}>
          <img
            src="/android-chrome-192x192.png"
            alt="Logo"
            className="ckp-nav-logo"
          />
        </div>
        <span className="ckp-nav-back" onClick={() => navigate("/cart")}>
          ← Return to Cart
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell />
          <MobileNavDrawer />
        </div>
      </nav>

      <div className="ckp-container">
        <h1 className="ckp-title">🔒 Secure Checkout</h1>
        <p className="ckp-subtitle">
          {cart.length} item{cart.length > 1 ? "s" : ""} · Grand Total: ₦
          {grandTotal.toLocaleString()}
        </p>

        {error && <div className="ckp-error">⚠️ {error}</div>}

        {/* ✅ Mobile: collapsible order summary */}
        <div
          className="ckp-mobile-summary-toggle"
          onClick={() => setShowSummary((s) => !s)}
        >
          <span className="ckp-mobile-summary-toggle-left">
            🧾 Order Summary ({cart.length} item{cart.length > 1 ? "s" : ""}){" "}
            {showSummary ? "▲" : "▼"}
          </span>
          <span className="ckp-mobile-summary-toggle-right">
            ₦{grandTotal.toLocaleString()}
          </span>
        </div>
        {showSummary && (
          <div className="ckp-mobile-summary-panel">
            <SummaryContent />
          </div>
        )}

        <div className="ckp-layout">
          {/* Delivery Form */}
          <div>
            <div className="ckp-card">
              <div className="ckp-card-title">📍 Delivery Details</div>
              <form onSubmit={handleSubmit}>

                {addressesLoading && (
                  <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                    Loading your saved addresses...
                  </p>
                )}

                {/* Saved address picker — shown when there's at least one
                    saved address and we're not mid-way through adding a
                    new one or explicitly using manual entry. */}
                {!addressesLoading && addresses.length > 0 && !showNewAddressForm && selectedAddressId !== null && (
                  <div className="ckp-field">
                    <label className="ckp-label">Deliver To</label>
                    <div className="ckp-address-list">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={
                            selectedAddressId === addr.id
                              ? "ckp-address-card ckp-address-card-active"
                              : "ckp-address-card"
                          }
                          onClick={() => selectAddress(addr)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                            <span className="ckp-payment-card-title" style={{ marginBottom: 0 }}>
                              {addr.label || "Home"}
                            </span>
                            {addr.is_default && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#1a7a3a", background: "#eafaf0", padding: "2px 8px", borderRadius: 99 }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div className="ckp-payment-card-desc">{addr.full_address}</div>
                          <div className="ckp-payment-card-desc">
                            {[addr.lga, addr.state].filter(Boolean).join(", ")}
                            {addr.phone && ` · ${addr.phone}`}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                      <span className="ckp-address-link" onClick={() => setShowNewAddressForm(true)}>
                        + Add new address
                      </span>
                      <span className="ckp-address-link" onClick={useManualEntry}>
                        Enter a different address
                      </span>
                    </div>
                    <DeliveryFeeInfo />
                  </div>
                )}

                {/* Inline "add new address" form — saves to the address
                    book via POST /addresses and selects it immediately. */}
                {showNewAddressForm && (
                  <div className="ckp-field">
                    <label className="ckp-label">New Address</label>
                    <div style={{ background: "#f7f5f0", border: "1px solid #e8e4dc", borderRadius: 10, padding: 16 }}>
                      <AddressFormFields
                        form={newAddressForm}
                        onChange={setNewAddressForm}
                        rowClassName="ckp-row"
                        styles={{ row2: {}, field: { marginBottom: 14 }, label: { display: "block", fontSize: 13, color: "#444", fontWeight: 600, marginBottom: 6 }, input: { width: "100%", padding: "11px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" } }}
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleCreateAddress}
                          disabled={savingNewAddress || !newAddressForm.full_address || !newAddressForm.state}
                          style={{ padding: "10px 20px", background: savingNewAddress ? "#ccc" : "#1f4d1f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: savingNewAddress ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                        >
                          {savingNewAddress ? "Saving..." : "Save Address"}
                        </button>
                        <span
                          className="ckp-address-link"
                          onClick={() => (addresses.length > 0 ? selectAddress(addresses.find((a) => a.is_default) || addresses[0]) : useManualEntry())}
                          style={{ alignSelf: "center" }}
                        >
                          Cancel
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual entry — original raw-string fields, unchanged.
                    Shown when the buyer has no saved addresses at all, or
                    explicitly chose "Enter a different address". */}
                {!addressesLoading && !showNewAddressForm && selectedAddressId === null && (
                  <>
                    {addresses.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <span
                          className="ckp-address-link"
                          onClick={() => selectAddress(addresses.find((a) => a.is_default) || addresses[0])}
                        >
                          ← Choose from saved addresses
                        </span>
                      </div>
                    )}
                    <div className="ckp-field">
                      <label className="ckp-label">Full Delivery Address</label>
                      <input
                        className="ckp-input"
                        type="text"
                        name="delivery_address"
                        placeholder="House number, street name, landmark..."
                        value={formData.delivery_address}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="ckp-row">
                      <div className="ckp-field">
                        <label className="ckp-label">State</label>
                        <select
                          className="ckp-input"
                          name="delivery_state"
                          value={formData.delivery_state}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select state</option>
                          {nigerianStates.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        <DeliveryFeeInfo />
                      </div>
                      <div className="ckp-field">
                        <label className="ckp-label">LGA</label>
                        <select
                          className="ckp-input"
                          name="delivery_lga"
                          value={formData.delivery_lga}
                          onChange={handleChange}
                          required
                          disabled={!formData.delivery_state}
                        >
                          <option value="">
                            {formData.delivery_state
                              ? "Select LGA"
                              : "Select state first"}
                          </option>
                          {(NIGERIA_LGAS[formData.delivery_state] || []).map(
                            (lga) => (
                              <option key={lga} value={lga}>
                                {lga}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="ckp-field">
                  <label className="ckp-label">
                    Order Note{" "}
                    <span style={{ color: "#aaa", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <textarea
                    className="ckp-textarea"
                    name="note"
                    rows={3}
                    placeholder="Special instructions for the rider..."
                    value={formData.note}
                    onChange={handleChange}
                  />
                </div>

                {/* Submit button — desktop/tablet only; mobile uses sticky bar */}
                <div className="ckp-field"><label className="ckp-label">Payment Method</label><div className="ckp-payment-cards"><div className={paymentMethod === "paystack" ? "ckp-payment-card ckp-payment-card-active" : "ckp-payment-card"} onClick={() => setPaymentMethod("paystack")}><div className="ckp-payment-card-title">Pay Online</div><div className="ckp-payment-card-desc">Card, bank transfer or USSD via Paystack</div></div><div className={paymentMethod === "pay_on_delivery" ? "ckp-payment-card ckp-payment-card-active" : "ckp-payment-card"} onClick={() => setPaymentMethod("pay_on_delivery")}><div className="ckp-payment-card-title">Pay on Delivery</div><div className="ckp-payment-card-desc">Pay with cash when your order arrives</div></div></div></div>
                <button
                  type="submit"
                  className={
                    loading || !formData.delivery_state
                      ? "ckp-btn-dis"
                      : "ckp-btn"
                  }
                  disabled={loading || !formData.delivery_state}
                >
                  {loading ? "Finalizing Order..." : (paymentMethod === "pay_on_delivery" ? "Place Order" : "Confirm and Pay Now")}
                </button>
                {paymentMethod === "paystack" && (
                <div className="ckp-secure-row">
                  <span>Secured</span> Secured and encrypted by Paystack
                </div>
                )}
              </form>
            </div>
          </div>

          {/* Order Summary — desktop/tablet */}
          <div className="ckp-summary-col">
            <div className="ckp-summary">
              <div className="ckp-summary-title">Order Summary</div>
              <SummaryContent />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Mobile sticky pay bar */}
      <div className="ckp-mobile-total-bar">
        <div className="ckp-mobile-total-bar-left">
          <div className="ckp-mobile-total-bar-label">Grand Total</div>
          <div className="ckp-mobile-total-bar-val">
            ₦{grandTotal.toLocaleString()}
          </div>
        </div>
        <button
          className={
            loading || !formData.delivery_state
              ? "ckp-mobile-total-bar-btn-dis"
              : "ckp-mobile-total-bar-btn"
          }
          disabled={loading || !formData.delivery_state}
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : (paymentMethod === "pay_on_delivery" ? "Place Order" : "Pay Now")}
        </button>
      </div>
    </div>
  );
}