import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import './Checkout.css';

function draftKey(foodId) {
  return `checkout_draft_${foodId}`;
}

function loadDraft(foodId) {
  try {
    const raw = localStorage.getItem(draftKey(foodId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(foodId, data) {
  try {
    localStorage.setItem(draftKey(foodId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function removeDraft(foodId) {
  try {
    localStorage.removeItem(draftKey(foodId));
  } catch {
    // ignore
  }
}

function appendOrder(order) {
  try {
    const raw = localStorage.getItem('orders');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    localStorage.setItem('orders', JSON.stringify(list));
  } catch {
    // ignore
  }
}

const Checkout = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(location?.state?.item || null);
  const [loadingItem, setLoadingItem] = useState(!item);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  const initialDraft = useMemo(() => loadDraft(foodId) || {}, [foodId]);

  const [quantity, setQuantity] = useState(Number(initialDraft.quantity) > 0 ? Number(initialDraft.quantity) : 1);
  const [deliveryMode, setDeliveryMode] = useState(initialDraft.deliveryMode === 'delivery' ? 'delivery' : 'pickup');
  const [phone, setPhone] = useState(initialDraft.phone || '');
  const [addressLine, setAddressLine] = useState(initialDraft.addressLine || '');
  const [cityArea, setCityArea] = useState(initialDraft.cityArea || '');
  const [landmark, setLandmark] = useState(initialDraft.landmark || '');
  const [note, setNote] = useState(initialDraft.note || '');
  const [paymentMethod, setPaymentMethod] = useState(initialDraft.paymentMethod === 'STRIPE' ? 'STRIPE' : 'COD');
  const [placing, setPlacing] = useState(false);

  const unitPrice = typeof item?.price === 'number' && Number.isFinite(item?.price) ? item.price : null;
  const total = unitPrice == null ? null : unitPrice * quantity;

  // Auth gate: ensure user is logged in (buyer)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.get('/api/food/favourites');
        if (mounted) setCheckingAuth(false);
      } catch (err) {
        const status = err?.response?.status;
        if (mounted) setCheckingAuth(false);
        if (status === 401) {
          navigate(`/user/login?next=/checkout/${foodId}`, { replace: true });
        }
      }
    })();
    return () => { mounted = false; };
  }, [foodId, navigate]);

  // Load item if refreshed (no state)
  useEffect(() => {
    if (item) return;
    let mounted = true;
    (async () => {
      setLoadingItem(true);
      try {
        const res = await api.get('/api/food/get-food-item');
        const list = res?.data?.foodItems || [];
        const found = list.find(fi => String(fi._id) === String(foodId)) || null;
        if (mounted) setItem(found);
        if (!found && mounted) setError('Item not found');
      } catch (err) {
        if (mounted) setError('Failed to load item');
      } finally {
        if (mounted) setLoadingItem(false);
      }
    })();
    return () => { mounted = false; };
  }, [foodId, item]);

  // Persist draft
  useEffect(() => {
    saveDraft(foodId, {
      quantity,
      deliveryMode,
      phone,
      addressLine,
      cityArea,
      landmark,
      note,
      paymentMethod,
    });
  }, [foodId, quantity, deliveryMode, phone, addressLine, cityArea, landmark, note, paymentMethod]);

  const validate = () => {
    if (!item) return 'Item not found';
    if (unitPrice == null) return 'Price is not set for this item.';
    if (!phone.trim()) return 'Phone is required';
    if (deliveryMode === 'delivery') {
      if (!addressLine.trim()) return 'Address is required for delivery';
      if (!cityArea.trim()) return 'City/Area is required for delivery';
    }
    return '';
  };

  const placeOrder = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      foodId: String(item._id),
      quantity,
      deliveryMode,
      phone: phone.trim(),
      address: deliveryMode === 'delivery' ? {
        addressLine: addressLine.trim(),
        cityArea: cityArea.trim(),
        landmark: landmark.trim(),
      } : null,
      note: note.trim(),
      paymentMethod,
    };

    (async () => {
      setPlacing(true);
      try {
        const res = await api.post('/api/orders', payload);
        const order = res?.data?.order;
        if (!order) throw new Error('Order not returned');
        appendOrder(order);
        removeDraft(foodId);

        if (paymentMethod === 'STRIPE') {
          const s = await api.post('/api/payments/stripe/checkout-session', { orderId: order._id });
          const url = s?.data?.url;
          if (!url) throw new Error('Stripe checkout URL not returned');
          window.location.href = url;
          return;
        }

        navigate('/order-success', { state: { order } });
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          navigate(`/user/login?next=/checkout/${foodId}`, { replace: true });
          return;
        }
        setError(err?.response?.data?.message || 'Failed to place order');
      } finally {
        setPlacing(false);
      }
    })();
  };

  const disabled = checkingAuth || loadingItem || placing;

  return (
    <div className="checkout-wrap">
      <div className="checkout-card">
        <div className="checkout-header">
          <button className="checkout-back" onClick={() => navigate(-1)}>Back</button>
          <h2>Checkout</h2>
          <div style={{ width: 60 }} />
        </div>

        <div className="checkout-body">
          {error && <div className="error">{error}</div>}

          {loadingItem ? (
            <div className="muted">Loading item...</div>
          ) : item ? (
            <div className="item-preview">
              <video src={item.video} muted playsInline controls={false} />
              <div className="item-meta">
                <h3>{item.name}</h3>
                <p className="muted">{item.description}</p>
                <div className="price">
                  {unitPrice == null ? 'Price not set' : `Rs ${unitPrice}`}
                </div>
                <p className="muted" style={{ marginTop: 8 }}>
                  Payment: {paymentMethod === 'STRIPE' ? 'Card (Stripe)' : 'Cash on Delivery'}
                </p>
              </div>
            </div>
          ) : (
            <div className="muted">Item not found</div>
          )}

          <div className="row">
            <div className="label">Payment Method</div>
            <div className="toggle">
              <button
                type="button"
                className={paymentMethod === 'COD' ? 'active' : ''}
                onClick={() => setPaymentMethod('COD')}
                disabled={disabled}
              >
                COD
              </button>
              <button
                type="button"
                className={paymentMethod === 'STRIPE' ? 'active' : ''}
                onClick={() => setPaymentMethod('STRIPE')}
                disabled={disabled}
              >
                Card
              </button>
            </div>
          </div>

          <div className="row">
            <div className="label">Quantity</div>
            <div className="qty">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={disabled}
              >
                -
              </button>
              <div className="value">{quantity}</div>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(50, q + 1))}
                disabled={disabled}
              >
                +
              </button>
            </div>
          </div>

          <div className="row">
            <div className="label">Delivery Mode</div>
            <div className="toggle">
              <button
                type="button"
                className={deliveryMode === 'pickup' ? 'active' : ''}
                onClick={() => setDeliveryMode('pickup')}
                disabled={disabled}
              >
                Pickup
              </button>
              <button
                type="button"
                className={deliveryMode === 'delivery' ? 'active' : ''}
                onClick={() => setDeliveryMode('delivery')}
                disabled={disabled}
              >
                Delivery
              </button>
            </div>
          </div>

          {deliveryMode === 'delivery' && (
            <>
              <div className="row">
                <div className="label">Address</div>
                <input
                  className="input"
                  value={addressLine}
                  onChange={e => setAddressLine(e.target.value)}
                  placeholder="House no, street, block..."
                  disabled={disabled}
                />
              </div>
              <div className="row">
                <div className="label">City / Area</div>
                <input
                  className="input"
                  value={cityArea}
                  onChange={e => setCityArea(e.target.value)}
                  placeholder="e.g. Gulshan, DHA..."
                  disabled={disabled}
                />
              </div>
              <div className="row">
                <div className="label">Landmark (optional)</div>
                <input
                  className="input"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="Near..."
                  disabled={disabled}
                />
              </div>
            </>
          )}

          <div className="row">
            <div className="label">Phone</div>
            <input
              className="input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="03xx-xxxxxxx"
              disabled={disabled}
            />
          </div>

          <div className="row">
            <div className="label">Note (optional)</div>
            <textarea
              className="textarea"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any instructions..."
              disabled={disabled}
            />
          </div>

          <div className="summary">
            <div className="muted">
              Total
            </div>
            <div className="total">
              {total == null ? '--' : `Rs ${total}`}
            </div>
          </div>

          <button className="cta" onClick={placeOrder} disabled={disabled}>
            {paymentMethod === 'STRIPE' ? (placing ? 'Redirecting...' : 'Pay with Stripe') : (placing ? 'Placing...' : 'Place Order')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
